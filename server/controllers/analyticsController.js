const { getCustomerStats } = require("../services/analyticsService");
const { calculateRisk } = require("../services/riskService");
const Customer = require("../models/Customer");

const getStats = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Ensure the customer belongs to the authenticated user
    const customer = await Customer.findOne({ _id: customerId, userId: req.user.id, isActive: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found or access denied." });
    }

    const [stats, risk] = await Promise.all([
      getCustomerStats(customerId),
      calculateRisk(customerId),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        riskScore: typeof risk === "object" ? risk.riskScore : risk,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStats };
