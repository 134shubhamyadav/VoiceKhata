/**
 * en.js — English
 * Source-of-truth locale. All other locales mirror this key structure.
 */

"use strict";

module.exports = {
  meta: {
    code:      "en",
    name:      "English",
    script:    "Latin",
    fallback:  null,
    locale:    "en-IN",
  },

  // ── Receipt ───────────────────────────────────────────────────────────────
  receipt: {
    title:          "PAYMENT RECEIPT",
    receiptNo:      "Receipt No",
    shop:           "Shop",
    customer:       "Customer",
    phone:          "Phone",
    date:           "Date",
    time:           "Time",
    totalAmount:    "Total Amount",
    amountPaid:     "Amount Paid",
    balance:        "Balance",
    status:         "Status",
    poweredBy:      "Powered by VoiceKhata",
    statusLabels: {
      paid:    "PAID",
      partial: "PARTIAL",
      pending: "PENDING",
    },
    typeLabels: {
      credit:  "Credit",
      payment: "Payment",
    },
  },

  // ── Reminders ─────────────────────────────────────────────────────────────
  reminders: {
    friendly: {
      normal:  "{name}, just a friendly reminder — you have ₹{amount} pending{due}. Pay when convenient. — {shop}",
      overdue: "{name}, your ₹{amount} payment{due} is a little overdue.{partial} When can we expect it? — {shop}",
    },
    normal: {
      normal:  "{name}, ₹{amount} is still outstanding{due}.{partial} Please arrange payment. — {shop}",
      overdue: "{name}, your ₹{amount} payment{due} is pending.{partial} Kindly settle soon. — {shop}",
    },
    strict: {
      normal:  "{name}, ₹{amount} is due{due}.{partial} Please pay immediately. — {shop}",
      overdue: "{name}, NOTICE: ₹{amount} is overdue{due}.{partial} Pay today or further action will follow. — {shop}",
    },
    partialNote: " You have made partial payments; ₹{amount} still remains.",
    dueOn:       " (due: {date})",
  },

  // ── Payment confirmations ─────────────────────────────────────────────────
  payment: {
    confirmed:    "Payment of ₹{amount} received from {name}. Remaining balance: ₹{remaining}.",
    fullyClear:   "Account cleared! ₹{amount} paid by {name}. Balance: ₹0. Thank you!",
    partialClear: "Partial payment of ₹{amount} received from {name}. Still owed: ₹{remaining}.",
  },

  // ── Voice parsing prompts ─────────────────────────────────────────────────
  voice: {
    placeholder:  "e.g. Ramesh took ₹500, will pay tomorrow",
    hint:         "Say: [Name] took ₹[amount], will pay [when]",
    creditWords:  ["took", "owes", "credit", "borrowed", "lent"],
    paymentWords: ["paid", "returned", "gave back", "settled"],
    dueDateWords: {
      today:     ["today", "now"],
      tomorrow:  ["tomorrow"],
      week:      ["next week", "in a week"],
      month:     ["next month", "in a month"],
    },
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  onboarding: {
    languagePrompt: "Choose your preferred language for receipts and reminders:",
    languageSet:    "Great! Content will now be generated in English.",
  },
};
