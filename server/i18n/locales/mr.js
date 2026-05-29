/**
 * mr.js — Marathi (मराठी)
 */

"use strict";

module.exports = {
  meta: {
    code:      "mr",
    name:      "मराठी",
    script:    "Devanagari",
    fallback:  "hi",
    locale:    "mr-IN",
  },

  receipt: {
    title:          "पेमेंट पावती",
    receiptNo:      "पावती क्र.",
    shop:           "दुकान",
    customer:       "ग्राहक",
    phone:          "फोन",
    date:           "तारीख",
    time:           "वेळ",
    totalAmount:    "एकूण रक्कम",
    amountPaid:     "दिलेली रक्कम",
    balance:        "शिल्लक",
    status:         "स्थिती",
    poweredBy:      "VoiceKhata द्वारे",
    statusLabels: {
      paid:    "भरले",
      partial: "अंशतः भरले",
      pending: "बाकी",
    },
    typeLabels: {
      credit:  "उधारी",
      payment: "पेमेंट",
    },
  },

  reminders: {
    friendly: {
      normal:  "नमस्कार {name}! 🙏 एक छोटी आठवण — तुमची ₹{amount} बाकी आहे{due}। सोयीस्कर असेल तेव्हा द्या। — {shop}",
      overdue: "नमस्कार {name}! तुमची ₹{amount} ची रक्कम{due} थोडी उशीरा झाली आहे.{partial} कधी येणार? — {shop}",
    },
    normal: {
      normal:  "{name}, तुमची ₹{amount} रक्कम अजून बाकी आहे{due}.{partial} पेमेंट करा. — {shop}",
      overdue: "{name}, ₹{amount} चे पेमेंट{due} pending आहे.{partial} लवकरात लवकर द्या. — {shop}",
    },
    strict: {
      normal:  "{name}, ₹{amount} चे पेमेंट{due} अजून झाले नाही.{partial} ताबडतोब करा. — {shop}",
      overdue: "{name}, नोटीस: ₹{amount} थकीत आहे{due}.{partial} आज भरा, अन्यथा पुढील कारवाई होई. — {shop}",
    },
    partialNote: " तुम्ही आधी काही दिले होते, बाकी ₹{amount} अजून pending आहे.",
    dueOn:       " (देय: {date})",
  },

  payment: {
    confirmed:    "{name} कडून ₹{amount} मिळाले. बाकी शिल्लक: ₹{remaining}.",
    fullyClear:   "खाते क्लियर! {name} ने ₹{amount} भरले. शिल्लक: ₹0. धन्यवाद!",
    partialClear: "{name} कडून ₹{amount} अंशतः मिळाले. अजून बाकी: ₹{remaining}.",
  },

  voice: {
    placeholder:  "उदा: रमेश ने ₹500 घेतले, उद्या देईल",
    hint:         "बोला: [नाव] ने ₹[रक्कम] घेतली, [केव्हा] देईल",
    creditWords:  ["घेतले", "उधारी", "बाकी", "नेले"],
    paymentWords: ["दिले", "परत केले", "भरले"],
    dueDateWords: {
      today:    ["आज", "आत्ता"],
      tomorrow: ["उद्या"],
      week:     ["आठवड्यात", "पुढच्या आठवड्यात"],
      month:    ["महिन्यात", "पुढच्या महिन्यात"],
    },
  },

  onboarding: {
    languagePrompt: "पावती आणि रिमाइंडरसाठी भाषा निवडा:",
    languageSet:    "छान! आता माहिती मराठीत तयार होईल.",
  },
};
