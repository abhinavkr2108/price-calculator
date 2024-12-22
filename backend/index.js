import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { google } from "googleapis";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
const PORT = process.env.PORT || 5000;

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials/price-calculator.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const client = await auth.getClient();

app.post("/get-referral-fee", async (req, res) => {
  const range = "Referral Fees";
  const { category, price } = req.body;
  const getRows = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: "1o_yM63Grl_QB6lpuXE3spbrMeCs-hIMXCVyghj8FmV0",
    range: range,
  });
  const rows = getRows.data.values;

  const referralFees = {
    automotive: {
      helmetsAndGloves: [],
      tyresAndRims: [],
      vehicles: {},
      partsAndAccessories: [],
      cleaningKits: [],
    },
    baby: {
      hardlines: [],
      strollers: [],
      diapers: [],
    },
    books: [],
  };

  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header row

    const category = row[0];
    const priceRange = row[1];
    const percentage = parseFloat(row[2].replace("%", ""));

    const priceCondition = priceRange.split(" ");
    let maxPrice = null;
    let minPrice = null;

    if (priceCondition[0] === "<=") {
      maxPrice = parseFloat(priceCondition[1]);
    } else if (priceCondition[0] === ">") {
      minPrice = parseFloat(priceCondition[1]) + 1;
    } else if (priceCondition[0] === "All") {
      minPrice = null;
      maxPrice = null;
    }

    const feeObject = {};
    if (maxPrice !== null) feeObject.maxPrice = maxPrice;
    if (minPrice !== null) feeObject.minPrice = minPrice;
    feeObject.percentage = percentage;

    switch (category) {
      case "Automotive - Helmets & Riding Gloves":
        referralFees.automotive.helmetsAndGloves.push(feeObject);
        break;
      case "Automotive - Tyres & Rims":
        referralFees.automotive.tyresAndRims.push(feeObject);
        break;
      case "Automotive Vehicles - 2-Wheelers 4-Wheelers and Electric Vehicles":
        referralFees.automotive.vehicles = feeObject;
        break;
      case "Automotive – Car and Bike parts":
        referralFees.automotive.partsAndAccessories.push(feeObject);
        break;
      case "Automotive – Cleaning kits":
        referralFees.automotive.cleaningKits.push(feeObject);
        break;
      case "Baby Hardlines":
        referralFees.baby.hardlines.push(feeObject);
        break;
      case "Baby Strollers":
        referralFees.baby.strollers.push(feeObject);
        break;
      case "Baby diapers":
        referralFees.baby.diapers.push(feeObject);
        break;
      case "Books":
        referralFees.books.push(feeObject);
        break;
    }
  });

  let feeStructure;

  if (category.startsWith("Automotive")) {
    if (category.includes("Helmets")) {
      feeStructure = referralFees.automotive.helmetsAndGloves;
    } else if (category.includes("Tyres")) {
      feeStructure = referralFees.automotive.tyresAndRims;
    } else if (category.includes("Vehicles")) {
      const fee = price * (referralFees.automotive.vehicles.percentage / 100);
      return res.json({ fee });
    } else if (category.includes("Parts")) {
      feeStructure = referralFees.automotive.partsAndAccessories;
    } else if (category.includes("Cleaning")) {
      feeStructure = referralFees.automotive.cleaningKits;
    }
  } else if (category.startsWith("Baby")) {
    if (category.includes("Hardlines")) {
      feeStructure = referralFees.baby.hardlines;
    } else if (category.includes("Strollers")) {
      feeStructure = referralFees.baby.strollers;
    } else if (category.includes("Diapers")) {
      feeStructure = referralFees.baby.diapers;
    }
  } else if (category === "Books") {
    feeStructure = referralFees.books;
  }

  if (!feeStructure) {
    const defaultFee = price * 0.15; // Default rate
    return res.json({ fee: defaultFee });
  }

  for (const tier of feeStructure) {
    if (
      (tier.maxPrice !== undefined && price <= tier.maxPrice) ||
      (tier.minPrice !== undefined && price > tier.minPrice)
    ) {
      const fee = price * (tier.percentage / 100);
      return res.json({ fee });
    }
  }

  const defaultFee = price * 0.15; // Default fallback if no tier matches
  return res.json({ fee: defaultFee });
});

function calculateClosingFee(closingFees, mode, price) {
  const getFeeRange = (price) => {
    if (price <= 250) return "upTo250";
    if (price <= 500) return "upTo500";
    if (price <= 1000) return "upTo1000";
    return "above1000";
  };

  const range = getFeeRange(price);

  if (mode === "FBA") {
    return closingFees.fba.normal[range];
  } else if (mode === "Easy Ship") {
    return closingFees.easyShip.standard[range];
  } else if (mode === "Self Ship") {
    return closingFees.selfShip[range];
  }

  return 0;
}

app.post("/get-closing-fees", async (req, res) => {
  const client = await auth.getClient();
  const range = "Closing Fees";
  const { mode, price } = req.body;
  try {
    const getRows = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1o_yM63Grl_QB6lpuXE3spbrMeCs-hIMXCVyghj8FmV0",
      range: range,
    });

    const data = getRows.data.values;
    let closingFees = {
      fba: {
        normal: {},
        exception: {},
      },
      easyShip: {
        standard: {},
      },
      selfShip: {},
    };

    data.slice(1).forEach((row) => {
      const priceRange = row[0];
      let newPriceRange = {
        "0-250": "upTo250",
        "251-500": "upTo500",
        "501-1000": "upTo1000",
        "1000+": "above1000",
      }[priceRange];
      closingFees.fba.normal[newPriceRange] = parseFloat(
        row[1].replace("₹", "")
      );
      closingFees.fba.exception[newPriceRange] = parseFloat(
        row[2].replace("₹", "")
      );
      closingFees.easyShip.standard[newPriceRange] = parseFloat(
        row[3].replace("₹", "")
      );
      closingFees.selfShip[newPriceRange] = parseFloat(row[4].replace("₹", ""));
    });

    const closingFee = calculateClosingFee(closingFees, mode, price);
    console.log("Closing Fee: ", closingFee);
    console.log(typeof closingFee);
    res.json(closingFee);
  } catch (error) {
    console.error(error);
  }
});

app.post("/weight-handling-fee", async (req, res) => {
  const { mode, weight, serviceLevel, location, size } = req.body;

  if (!mode || !weight || !location || !size) {
    return res.status(400).json({
      error:
        "Missing required parameters. Please provide mode, weight, location, and size.",
    });
  }

  const range = "Weight Handling Fees";
  const getRows = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: "1o_yM63Grl_QB6lpuXE3spbrMeCs-hIMXCVyghj8FmV0",
    range: range,
  });
  const data = getRows.data.values;

  const transformedData = transformWeightHandlingFees(data);
  const calculatedFee = calculateWeightHandlingFee(
    transformedData,
    mode,
    weight,
    serviceLevel,
    location,
    size
  );

  res.json(calculatedFee);
});

const transformWeightHandlingFees = (data) => {
  // Skip the header row
  const rows = data.slice(1);

  const parseValue = (value) => {
    if (value === "-" || value === "NA" || value === "") return null;
    return parseFloat(value.replace("₹", ""));
  };

  const weightHandlingFees = {
    easyShip: {
      standard: {
        premium: {
          first500g: {
            local: parseValue(rows[0][2]),
            regional: parseValue(rows[0][3]),
            national: parseValue(rows[0][4]),
            ixd: parseValue(rows[0][5]),
          },
        },
        advanced: {
          first500g: {
            local: parseValue(rows[1][2]),
            regional: parseValue(rows[1][3]),
            national: parseValue(rows[1][4]),
            ixd: parseValue(rows[1][5]),
          },
        },
        standard: {
          first500g: {
            local: parseValue(rows[2][2]),
            regional: parseValue(rows[2][3]),
            national: parseValue(rows[2][4]),
            ixd: parseValue(rows[2][5]),
          },
        },
        basic: {
          first500g: {
            local: parseValue(rows[3][2]),
            regional: parseValue(rows[3][3]),
            national: parseValue(rows[3][4]),
            ixd: parseValue(rows[3][5]),
          },
        },
        additional500gUpTo1kg: {
          local: parseValue(rows[4][2]),
          regional: parseValue(rows[4][3]),
          national: parseValue(rows[4][4]),
          ixd: parseValue(rows[4][5]),
        },
        additionalKgAfter1kg: {
          local: parseValue(rows[5][2]),
          regional: parseValue(rows[5][3]),
          national: parseValue(rows[5][4]),
          ixd: parseValue(rows[5][5]),
        },
        additionalKgAfter5kg: {
          local: parseValue(rows[6][2]),
          regional: parseValue(rows[6][3]),
          national: parseValue(rows[6][4]),
          ixd: parseValue(rows[6][5]),
        },
      },
      heavyBulky: {
        first12kg: {
          local: parseValue(rows[7][2]),
          regional: parseValue(rows[7][3]),
          national: parseValue(rows[7][4]),
          ixd: parseValue(rows[7][5]),
        },
        additionalKgAfter12kg: {
          local: parseValue(rows[8][2]),
          regional: parseValue(rows[8][3]),
          national: parseValue(rows[8][4]),
          ixd: parseValue(rows[8][5]),
        },
      },
    },
    fba: {
      standard: {
        premium: {
          first500g: {
            local: parseValue(rows[9][2]),
            regional: parseValue(rows[9][3]),
            national: parseValue(rows[9][4]),
            ixd: parseValue(rows[9][5]),
          },
          additional500gUpTo1kg: {
            local: parseValue(rows[12][2]),
            regional: parseValue(rows[12][3]),
            national: parseValue(rows[12][4]),
            ixd: parseValue(rows[12][5]),
          },
          additionalKgAfter1kg: {
            local: parseValue(rows[13][2]),
            regional: parseValue(rows[13][3]),
            national: parseValue(rows[13][4]),
            ixd: parseValue(rows[13][5]),
          },
          additionalKgAfter5kg: {
            local: parseValue(rows[14][2]),
            regional: parseValue(rows[14][3]),
            national: parseValue(rows[14][4]),
            ixd: parseValue(rows[14][5]),
          },
        },
        standard: {
          first500g: {
            local: parseValue(rows[10][2]),
            regional: parseValue(rows[10][3]),
            national: parseValue(rows[10][4]),
            ixd: parseValue(rows[10][5]),
          },
          additional500gUpTo1kg: {
            local: parseValue(rows[12][2]),
            regional: parseValue(rows[12][3]),
            national: parseValue(rows[12][4]),
            ixd: parseValue(rows[12][5]),
          },
          additionalKgAfter1kg: {
            local: parseValue(rows[13][2]),
            regional: parseValue(rows[13][3]),
            national: parseValue(rows[13][4]),
            ixd: parseValue(rows[13][5]),
          },
          additionalKgAfter5kg: {
            local: parseValue(rows[14][2]),
            regional: parseValue(rows[14][3]),
            national: parseValue(rows[14][4]),
            ixd: parseValue(rows[14][5]),
          },
        },
        basic: {
          first500g: {
            local: parseValue(rows[11][2]),
            regional: parseValue(rows[11][3]),
            national: parseValue(rows[11][4]),
            ixd: parseValue(rows[11][5]),
          },
          additional500gUpTo1kg: {
            local: parseValue(rows[12][2]),
            regional: parseValue(rows[12][3]),
            national: parseValue(rows[12][4]),
            ixd: parseValue(rows[12][5]),
          },
          additionalKgAfter1kg: {
            local: parseValue(rows[13][2]),
            regional: parseValue(rows[13][3]),
            national: parseValue(rows[13][4]),
            ixd: parseValue(rows[13][5]),
          },
          additionalKgAfter5kg: {
            local: parseValue(rows[14][2]),
            regional: parseValue(rows[14][3]),
            national: parseValue(rows[14][4]),
            ixd: parseValue(rows[14][5]),
          },
        },
      },
      heavyBulky: {
        premium: {
          first12kg: {
            local: parseValue(rows[15][2]),
            regional: parseValue(rows[15][3]),
            national: parseValue(rows[15][4]),
            ixd: parseValue(rows[15][5]),
          },
          additionalKgAfter12kg: {
            local: parseValue(rows[18][2]),
            regional: parseValue(rows[18][3]),
            national: parseValue(rows[18][4]),
            ixd: parseValue(rows[18][5]),
          },
        },
        standard: {
          first12kg: {
            local: parseValue(rows[16][2]),
            regional: parseValue(rows[16][3]),
            national: parseValue(rows[16][4]),
            ixd: parseValue(rows[16][5]),
          },
          additionalKgAfter12kg: {
            local: parseValue(rows[18][2]),
            regional: parseValue(rows[18][3]),
            national: parseValue(rows[18][4]),
            ixd: parseValue(rows[18][5]),
          },
        },
        basic: {
          first12kg: {
            local: parseValue(rows[17][2]),
            regional: parseValue(rows[17][3]),
            national: parseValue(rows[17][4]),
            ixd: parseValue(rows[17][5]),
          },
          additionalKgAfter12kg: {
            local: parseValue(rows[18][2]),
            regional: parseValue(rows[18][3]),
            national: parseValue(rows[18][4]),
            ixd: parseValue(rows[18][5]),
          },
        },
      },
    },
  };

  return weightHandlingFees;
};
const calculateWeightHandlingFee = (
  fees,
  mode,
  weight,
  serviceLevel,
  location,
  size
) => {
  if (mode === "Easy Ship") {
    const easyShipFees = fees.easyShip;
    const sizeFees =
      size === "Standard" ? easyShipFees.standard : easyShipFees.heavyBulky;

    if (size === "Standard") {
      if (weight <= 0.5) {
        return sizeFees[serviceLevel.toLowerCase()].first500g[
          location.toLowerCase()
        ];
      } else if (weight <= 1) {
        return (
          sizeFees[serviceLevel.toLowerCase()].first500g[
            location.toLowerCase()
          ] + sizeFees.additional500gUpTo1kg[location.toLowerCase()]
        );
      } else if (weight <= 5) {
        return (
          sizeFees[serviceLevel.toLowerCase()].first500g[
            location.toLowerCase()
          ] +
          sizeFees.additional500gUpTo1kg[location.toLowerCase()] +
          Math.ceil(weight - 1) *
            sizeFees.additionalKgAfter1kg[location.toLowerCase()]
        );
      } else {
        return (
          sizeFees[serviceLevel.toLowerCase()].first500g[
            location.toLowerCase()
          ] +
          sizeFees.additional500gUpTo1kg[location.toLowerCase()] +
          4 * sizeFees.additionalKgAfter1kg[location.toLowerCase()] +
          Math.ceil(weight - 5) *
            sizeFees.additionalKgAfter5kg[location.toLowerCase()]
        );
      }
    } else {
      if (weight <= 12) {
        return sizeFees.first12kg[location.toLowerCase()];
      } else {
        return (
          sizeFees.first12kg[location.toLowerCase()] +
          Math.ceil(weight - 12) *
            sizeFees.additionalKgAfter12kg[location.toLowerCase()]
        );
      }
    }
  }

  if (mode === "FBA") {
    const fbaFees = fees.fba.standard[serviceLevel.toLowerCase()];

    if (weight <= 0.5) {
      return fbaFees.first500g[location.toLowerCase()];
    }
    if (weight <= 1) {
      return (
        fbaFees.first500g[location.toLowerCase()] +
        fbaFees.additional500gUpTo1kg[location.toLowerCase()]
      );
    }
    if (weight <= 5) {
      return (
        fbaFees.first500g[location.toLowerCase()] +
        fbaFees.additional500gUpTo1kg[location.toLowerCase()] +
        Math.ceil(weight - 1) *
          fbaFees.additionalKgAfter1kg[location.toLowerCase()]
      );
    }
    return (
      fbaFees.first500g[location.toLowerCase()] +
      fbaFees.additional500gUpTo1kg[location.toLowerCase()] +
      4 * fbaFees.additionalKgAfter1kg[location.toLowerCase()] +
      Math.ceil(weight - 5) *
        fbaFees.additionalKgAfter5kg[location.toLowerCase()]
    );
  }

  return 0;
};

app.post("/other-fees", async (req, res) => {
  const { mode, size } = req.body;

  try {
    const range = "Other Fees";
    const getRows = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1o_yM63Grl_QB6lpuXE3spbrMeCs-hIMXCVyghj8FmV0",
      range: range,
    });
    const data = getRows.data.values;
    const transformedFees = transformOtherFees(data);

    const calculatedFee =
      size === "Standard"
        ? transformedFees.pickAndPack.standard
        : transformedFees.pickAndPack.oversizeHeavyBulky;

    if (mode === "FBA") {
      calculatedFee = 0;
    }

    res.json(calculatedFee);
  } catch (error) {
    console.error(error);
  }
});
const transformOtherFees = (data) => {
  // Skip the header row
  const rows = data.slice(1);

  // Helper function to parse fee values
  const parseValue = (value) => {
    if (value.includes("per cubic foot per month")) {
      return parseFloat(value.match(/₹(\d+)/)[1]);
    }
    return parseFloat(value.replace("₹", ""));
  };

  const otherFees = {
    pickAndPack: {
      standard: 0,
      oversizeHeavyBulky: 0,
    },
    storage: 0,
    removal: {
      standard: {
        standard: 0,
        expedited: 0,
      },
      heavyBulky: {
        standard: 0,
        expedited: 0,
      },
    },
  };

  rows.forEach((row) => {
    const [feeType, category, rate] = row;

    switch (feeType) {
      case "Pick & Pack Fee":
        if (category === "Standard Size") {
          otherFees.pickAndPack.standard = parseValue(rate);
        } else if (category === "Oversize/Heavy & Bulky") {
          otherFees.pickAndPack.oversizeHeavyBulky = parseValue(rate);
        }
        break;

      case "Storage Fee":
        otherFees.storage = parseValue(rate);
        break;

      case "Removal Fees":
        if (category.includes("Standard Size")) {
          if (category.includes("Standard Shipping")) {
            otherFees.removal.standard.standard = parseValue(rate);
          } else if (category.includes("Expedited Shipping")) {
            otherFees.removal.standard.expedited = parseValue(rate);
          }
        } else if (category.includes("Heavy & Bulky")) {
          if (category.includes("Standard Shipping")) {
            otherFees.removal.heavyBulky.standard = parseValue(rate);
          } else if (category.includes("Expedited Shipping")) {
            otherFees.removal.heavyBulky.expedited = parseValue(rate);
          }
        }
        break;
    }
  });

  return otherFees;
};

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
