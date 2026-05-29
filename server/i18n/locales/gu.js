/**
 * gu.js — Gujarati (ગુજરાતી)
 */

"use strict";

module.exports = {
  meta: {
    code:      "gu",
    name:      "ગુજરાતી",
    script:    "Gujarati",
    fallback:  "hi",
    locale:    "gu-IN",
  },

  receipt: {
    title:          "ચુકવણી રસીદ",
    receiptNo:      "રસીદ નં.",
    shop:           "દુકાન",
    customer:       "ગ્રાહક",
    phone:          "ફોન",
    date:           "તારીખ",
    time:           "સમય",
    totalAmount:    "કુલ રકમ",
    amountPaid:     "ચૂકવેલ રકમ",
    balance:        "બાકી",
    status:         "સ્થિતિ",
    poweredBy:      "VoiceKhata દ્વારા",
    statusLabels: {
      paid:    "ચૂકવ્યું",
      partial: "અંશત: ચૂકવ્યું",
      pending: "બાકી",
    },
    typeLabels: {
      credit:  "ઉધાર",
      payment: "ચુકવણી",
    },
  },

  reminders: {
    friendly: {
      normal:  "નમસ્તે {name}! 🙏 એક નાની યાદ — તમારા ₹{amount} બાકી છે{due}. અનુકૂળ હોય ત્યારે આપો. — {shop}",
      overdue: "નમસ્તે {name}! તમારા ₹{amount}{due} થોડા overdue થઈ ગયા છે.{partial} ક્યારે આવશો? — {shop}",
    },
    normal: {
      normal:  "{name}, ₹{amount} હજુ બાકી છે{due}.{partial} ચુકવણી કરો. — {shop}",
      overdue: "{name}, ₹{amount} ની ચુકવણી{due} pending છે.{partial} જલ્દી settle કરો. — {shop}",
    },
    strict: {
      normal:  "{name}, ₹{amount} ની ચુકવણી{due} હજુ આવી નથી.{partial} તુરંત કરો. — {shop}",
      overdue: "{name}, નોટિસ: ₹{amount} overdue છે{due}.{partial} આજે ભરો, નહીં તો આગળ કાર્યવાહી થશે. — {shop}",
    },
    partialNote: " તમે પહેલાં કંઈ આપ્યું હતું, બાકી ₹{amount} pending છે.",
    dueOn:       " (ભરવાની તારીખ: {date})",
  },

  payment: {
    confirmed:    "{name} પાસેથી ₹{amount} મળ્યા. બાકી: ₹{remaining}.",
    fullyClear:   "ખાતું સાફ! {name} એ ₹{amount} ભર્યા. બાકી: ₹0. આભાર!",
    partialClear: "{name} પાસેથી ₹{amount} આંશિક મળ્યા. હજુ બાકી: ₹{remaining}.",
  },

  voice: {
    placeholder:  "દા.ત.: રમેશ ₹500 લઈ ગયો, કાલે આપશે",
    hint:         "બોલો: [નામ] ₹[રકમ] લઈ ગયો, [ક્યારે] આપશે",
    creditWords:  ["લીધા", "ઉધાર", "બાકી", "લઈ ગયો"],
    paymentWords: ["આપ્યા", "પાછા આપ્યા", "ભર્યા"],
    dueDateWords: {
      today:    ["આજે", "અત્યારે"],
      tomorrow: ["કાલે"],
      week:     ["અઠવાડિયામાં", "આવતા અઠવાડિયે"],
      month:    ["મહિનામાં", "આવતા મહિને"],
    },
  },

  onboarding: {
    languagePrompt: "રસીદ અને રિમાઇન્ડર માટે ભાષા પસંદ કરો:",
    languageSet:    "સરસ! હવે સામગ્રી ગુજરાતીમાં બનશે.",
  },
};
