/**
 * bho.js — Bhojpuri / Awadhi (भोजपुरी)
 *
 * Fallback chain: bho → hi
 * Keys not defined here are automatically pulled from hi.js by the i18n engine.
 * Only keys that differ meaningfully from Hindi are overridden.
 */

"use strict";

module.exports = {
  meta: {
    code:     "bho",
    name:     "भोजपुरी",
    script:   "Devanagari",
    fallback: "hi",          // ← critical: missing keys fall back to Hindi
    locale:   "hi-IN",       // CLDR locale for number/date formatting
  },

  receipt: {
    title:          "पइसा के रसीद",
    receiptNo:      "रसीद नं.",
    shop:           "दुकान",
    customer:       "ग्राहक",
    phone:          "फोन",
    date:           "तारीख",
    time:           "टाइम",
    totalAmount:    "कुल रकम",
    amountPaid:     "दिहल रकम",
    balance:        "बाकी",
    status:         "हालत",
    poweredBy:      "VoiceKhata के तरफ से",
    statusLabels: {
      paid:    "दे दिहलs",
      partial: "थोड़ा दिहलs",
      pending: "बाकी बा",
    },
    typeLabels: {
      credit:  "उधार",
      payment: "भुगतान",
    },
  },

  reminders: {
    friendly: {
      normal:  "प्रणाम {name} भाई! 🙏 एगो छोट याद दिलावत बानी — रउआ ₹{amount} बाकी बा{due}। जब सुविधा होखे दे दीं। — {shop}",
      overdue: "प्रणाम {name} भाई! रउआ ₹{amount}{due} थोड़ा overdue हो गईल बा.{partial} कब आइबs? — {shop}",
    },
    normal: {
      normal:  "{name} भाई, रउआ ₹{amount} अभियो बाकी बा{due}.{partial} पइसा के इंतजाम कर लीं। — {shop}",
      overdue: "{name} भाई, ₹{amount} के भुगतान{due} pending बा.{partial} जल्दी से दे दीं। — {shop}",
    },
    strict: {
      normal:  "{name}, ₹{amount} के भुगतान{due} अभियो ना आइल.{partial} तुरंत करीं। — {shop}",
      overdue: "{name}, सूचना: ₹{amount} overdue हो गइल बा{due}.{partial} आज दे दीं, नाहीं त आगे कारवाई होई। — {shop}",
    },
    partialNote: " रउआ पहिले कुछ दिहल रहलs, बाकी ₹{amount} अभियो pending बा।",
    dueOn:       " (देय: {date})",
  },

  payment: {
    confirmed:    "{name} से ₹{amount} मिलल। बाकी बचल: ₹{remaining}।",
    fullyClear:   "खाता साफ हो गइल! {name} ₹{amount} दे दिहलs। बाकी: ₹0। धन्यवाद!",
    partialClear: "{name} से ₹{amount} थोड़ा मिलल। अभियो बाकी: ₹{remaining}।",
  },

  voice: {
    placeholder:  "जइसे: रमेश ₹500 लिहलस, काल देई",
    hint:         "बोलीं: [नाम] ₹[रकम] लिहलस, [कब] देई",
    creditWords:  ["लिहलस", "उधार", "बाकी", "ले गइल", "लेले गइल"],
    paymentWords: ["दे दिहलस", "वापस कइलस", "भेज दिहलस"],
    dueDateWords: {
      today:    ["आज", "अभी"],
      tomorrow: ["काल", "कल"],
      week:     ["हफ्ता में", "अगिला हफ्ता"],
      month:    ["महीना में", "अगिला महीना"],
    },
  },

  onboarding: {
    languagePrompt: "रसीद आ रिमाइंडर खातिर भाषा चुनीं:",
    languageSet:    "बढ़िया! अब सामग्री भोजपुरी में बनी।",
  },
};
