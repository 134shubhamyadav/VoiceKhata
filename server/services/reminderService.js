const Reminder = require("../models/Reminder");
const Customer = require("../models/Customer");
const Entry = require("../models/Entry");
const { buildReminderMessage, formatCurrency } = require("../i18n");

const DUPLICATE_WINDOW_HOURS = 12;

/**
 * Generate a reminder message based on tone and entry data.
 */
const generateMessage = (customer, entry, tone) => {
  const lang = customer.userId && customer.userId.language ? customer.userId.language : 'en';
  const amountRupees = (entry.remainingAmount ?? entry.amount);
  const formattedAmount = formatCurrency(amountRupees, lang);

  return buildReminderMessage(lang, tone, {
    name: customer.name,
    amount: formattedAmount,
    shop: customer.userId && customer.userId.shopName ? customer.userId.shopName : "VoiceKhata",
    isOverdue: entry.dueDate ? new Date(entry.dueDate) < new Date() : false,
    isPartial: entry.status === "partial",
    dueDate: entry.dueDate,
  });
};

/**
 * Generate a WhatsApp deep link.
 * Opens WhatsApp chat with pre-filled message.
 */
const generateWhatsAppLink = (phone, message) => {
  const encoded = encodeURIComponent(message);

  if (phone) {
    // Normalize Indian phone: strip leading 0 or +91, ensure 10 digits
    const normalized = phone.replace(/^(\+91|91|0)/, "").replace(/\D/g, "");
    const withCountryCode = `91${normalized}`;
    return `https://wa.me/${withCountryCode}?text=${encoded}`;
  }

  // No phone — open WhatsApp share without a specific contact
  return `https://wa.me/?text=${encoded}`;
};

/**
 * Determine reminder type from entry state.
 */
const getReminderType = (entry) => {
  if (entry.dueDate && new Date(entry.dueDate) < new Date()) {
    return "overdue";
  }
  if (entry.status === "partial") {
    return "partial_due";
  }
  return "payment_due";
};

/**
 * Check if a reminder was already sent within the duplicate window.
 */
const isDuplicate = async (customerId, entryId) => {
  const windowStart = new Date(
    Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000
  );

  const existing = await Reminder.findOne({
    customerId,
    entryId,
    sentAt: { $gte: windowStart },
  });

  return !!existing;
};

/**
 * Core service: build and save a reminder.
 */
const sendReminder = async (customerId, entryId, tone = "friendly", customMessage = null) => {
  // 1. Validate tone if not customMessage
  const validTones = ["friendly", "firm", "urgent"];
  if (!customMessage && !validTones.includes(tone)) {
    throw new Error(`Invalid tone. Must be one of: ${validTones.join(", ")}`);
  }

  // 2. Fetch customer
  const customer = await Customer.findById(customerId).populate("userId");
  if (!customer) {
    throw new Error("Customer not found");
  }

  let entry = null;
  if (entryId) {
    // 3. Fetch entry
    entry = await Entry.findOne({
      _id: entryId,
      customerId,
      type: "credit",
    });
    if (!entry) {
      throw new Error("Credit entry not found for this customer");
    }

    if (entry.status === "paid") {
      throw new Error("Entry is already fully paid. No reminder needed.");
    }
  }

  // 4. Duplicate guard (only if not customMessage and entryId exists)
  if (!customMessage && entryId) {
    const duplicate = await isDuplicate(customerId, entryId);
    if (duplicate) {
      throw new Error(
        `A reminder was already sent within the last ${DUPLICATE_WINDOW_HOURS} hours`
      );
    }
  }

  // 5. Generate message and link
  const message = customMessage || generateMessage(customer, entry, tone);
  const whatsappLink = generateWhatsAppLink(customer.phone, message);
  const type = entry ? getReminderType(entry) : "general";

  // 6. Save reminder
  const reminder = await Reminder.create({
    customerId,
    entryId: entryId || undefined,
    message,
    whatsappLink,
    tone: customMessage ? "friendly" : tone,
    type,
    sentAt: new Date(),
    snapshot: {
      customerName: customer.name,
      customerPhone: customer.phone,
      amount: entry ? entry.amount : customer.totalOwed,
      entryType: entry ? entry.type : "general",
      entryStatus: entry ? entry.status : "pending",
    },
  });

  return reminder;
};

module.exports = { sendReminder, generateMessage, generateWhatsAppLink };
