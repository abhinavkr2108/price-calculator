// Referral Fees
export const referralFees = {
  automotive: {
    helmetsAndGloves: [
      { maxPrice: 500, percentage: 6.50 },
      { minPrice: 500, percentage: 8.50 }
    ],
    tyresAndRims: [
      { maxPrice: 500, percentage: 5.00 },
      { minPrice: 500, percentage: 7.00 }
    ],
    vehicles: { percentage: 5.00 },
    partsAndAccessories: [
      { maxPrice: 500, percentage: 13.00 },
      { minPrice: 500, percentage: 14.00 }
    ],
    cleaningKits: [
      { maxPrice: 500, percentage: 9.00 },
      { minPrice: 500, percentage: 12.00 }
    ]
  },
  baby: {
    hardlines: [
      { maxPrice: 300, percentage: 6.00 },
      { maxPrice: 500, percentage: 8.50 },
      { maxPrice: 1000, percentage: 6.00 },
      { minPrice: 1000, percentage: 7.50 }
    ],
    strollers: [
      { maxPrice: 300, percentage: 4.00 },
      { maxPrice: 1000, percentage: 6.00 },
      { minPrice: 1000, percentage: 10.00 }
    ],
    diapers: [
      { maxPrice: 300, percentage: 5.00 },
      { maxPrice: 500, percentage: 5.50 },
      { minPrice: 500, percentage: 9.50 }
    ]
  },
  books: [
    { maxPrice: 250, percentage: 3.00 },
    { maxPrice: 500, percentage: 4.50 },
    { maxPrice: 1000, percentage: 9.00 }
  ]
};

// Weight Handling Fees
export const weightHandlingFees = {
  easyShip: {
    standard: {
      first500g: {
        local: 43,
        regional: 54.5,
        national: 76
      },
      additional500gUpTo1kg: {
        local: 13,
        regional: 17,
        national: 25
      },
      additionalKgAfter1kg: {
        local: 21,
        regional: 27,
        national: 33
      },
      additionalKgAfter5kg: {
        local: 12,
        regional: 13,
        national: 16
      }
    },
    heavyBulky: {
      first12kg: {
        local: 192,
        regional: 277,
        national: 371
      },
      additionalKgAfter12kg: {
        local: 5,
        regional: 6,
        national: 12
      }
    }
  },
  fba: {
    standard: {
      premium: {
        first500g: 29,
        additional500gUpTo1kg: 13,
        additionalKgAfter1kg: 21,
        additionalKgAfter5kg: 12
      },
      standard: {
        first500g: 35,
        additional500gUpTo1kg: 13,
        additionalKgAfter1kg: 21,
        additionalKgAfter5kg: 12
      },
      basic: {
        first500g: 41,
        additional500gUpTo1kg: 13,
        additionalKgAfter1kg: 21,
        additionalKgAfter5kg: 12
      }
    }
  }
};

// Closing Fees
export const closingFees = {
  fba: {
    normal: {
      upTo250: 25,
      upTo500: 20,
      upTo1000: 25,
      above1000: 50
    },
    exception: {
      upTo250: 12,
      upTo500: 12,
      upTo1000: 25,
      above1000: 70
    }
  },
  easyShip: {
    standard: {
      upTo250: 4,
      upTo500: 9,
      upTo1000: 30,
      above1000: 61
    }
  },
  selfShip: {
    upTo250: 7,
    upTo500: 20,
    upTo1000: 41,
    above1000: 80
  }
};

// Other Fees
export const otherFees = {
  pickAndPack: {
    standard: 14,
    oversizeHeavyBulky: 26
  },
  storage: 45, // per cubic foot per month
  removal: {
    standard: {
      standard: 10,
      expedited: 30
    },
    heavyBulky: {
      standard: 100,
      expedited: 100
    }
  }
};