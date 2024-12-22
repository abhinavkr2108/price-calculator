export async function getClosingFees(req, res) {
  try {
    const closingFees = await getClosingFees();
    res.status(200).json(closingFees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
