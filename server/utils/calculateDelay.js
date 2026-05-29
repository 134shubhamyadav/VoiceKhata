/**
 * Calculates the delay in days between dueDate and paymentDate.
 * Returns 0 if payment was on time or no paymentDate provided.
 *
 * @param {Object} params
 * @param {Date|string} params.dueDate
 * @param {Date|string|null} params.paymentDate
 * @returns {number} delay in days (0 if on time)
 */
const calculateDelay = ({ dueDate, paymentDate }) => {
  if (!dueDate) return 0;

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const payment = paymentDate ? new Date(paymentDate) : new Date();
  payment.setHours(0, 0, 0, 0);

  const diffMs = payment - due;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

module.exports = { calculateDelay };
