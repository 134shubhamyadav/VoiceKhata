/**
 * hi.js — Hindi (हिंदी)
 * Primary Indian language. Also serves as fallback base for Bhojpuri.
 */

"use strict";

module.exports = {
  meta: {
    code:      "hi",
    name:      "हिंदी",
    script:    "Devanagari",
    fallback:  null,
    locale:    "hi-IN",
  },

  receipt: {
    title:          "भुगतान रसीद",
    receiptNo:      "रसीद नं.",
    shop:           "दुकान",
    customer:       "ग्राहक",
    phone:          "फ़ोन",
    date:           "तारीख",
    time:           "समय",
    totalAmount:    "कुल राशि",
    amountPaid:     "भुगतान राशि",
    balance:        "बकाया",
    status:         "स्थिति",
    poweredBy:      "VoiceKhata द्वारा संचालित",
    statusLabels: {
      paid:    "भुगतान हो गया",
      partial: "आंशिक भुगतान",
      pending: "बकाया",
    },
    typeLabels: {
      credit:  "उधार",
      payment: "भुगतान",
    },
  },

  reminders: {
    friendly: {
      normal:  "नमस्ते {name} जी! 🙏 बस एक छोटा सा याद दिलाना — आपका ₹{amount} बाकी है{due}। जब सुविधा हो दे दें। — {shop}",
      overdue: "नमस्ते {name} जी! 🙏 आपका ₹{amount} थोड़ा overdue हो गया है{due}.{partial} कब आएंगे? — {shop}",
    },
    normal: {
      normal:  "{name} जी, आपका ₹{amount} अभी भी बाकी है{due}.{partial} भुगतान का इंतज़ाम कर लें। — {shop}",
      overdue: "{name} जी, आपका ₹{amount} का भुगतान{due} pending है.{partial} कृपया जल्द settle करें। — {shop}",
    },
    strict: {
      normal:  "{name} जी, ₹{amount} का भुगतान{due} अभी तक नहीं आया.{partial} तुरंत करें। — {shop}",
      overdue: "{name} जी, सूचना: ₹{amount} overdue है{due}.{partial} आज ही भुगतान करें, वरना आगे कार्रवाई होगी। — {shop}",
    },
    partialNote: " आपने पहले कुछ दिया था, बाकी ₹{amount} अभी pending है।",
    dueOn:       " (देय: {date})",
  },

  payment: {
    confirmed:    "{name} जी से ₹{amount} प्राप्त। बाकी बकाया: ₹{remaining}।",
    fullyClear:   "खाता साफ! {name} जी ने ₹{amount} दे दिया। बकाया: ₹0। धन्यवाद!",
    partialClear: "{name} जी से ₹{amount} आंशिक भुगतान मिला। अभी बाकी: ₹{remaining}।",
  },

  voice: {
    placeholder:  "जैसे: रमेश ने ₹500 लिए, कल देगा",
    hint:         "बोलें: [नाम] ने ₹[राशि] लिए, [कब] देगा",
    creditWords:  ["लिए", "लिया", "उधार", "बाकी", "ले गया"],
    paymentWords: ["दिया", "दे दिया", "वापस किया", "भेज दिया"],
    dueDateWords: {
      today:    ["आज", "अभी"],
      tomorrow: ["कल"],
      week:     ["हफ्ते में", "अगले हफ्ते"],
      month:    ["महीने में", "अगले महीने"],
    },
  },

  onboarding: {
    languagePrompt: "रसीद और रिमाइंडर के लिए अपनी भाषा चुनें:",
    languageSet:    "बढ़िया! अब सामग्री हिंदी में बनेगी।",
  },
};
