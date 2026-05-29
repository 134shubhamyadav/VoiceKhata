/**
 * ta.js — Tamil (தமிழ்)
 *
 * Tamil is a Dravidian language — structurally distinct from all other
 * supported locales.  No shared fallback with Hindi/Devanagari is appropriate,
 * so fallback is set to "en" for any future missing keys.
 *
 * Script:  Tamil (தமிழ் அரிச்சுவडी)
 * Region:  Tamil Nadu, Puducherry + diaspora (Sri Lanka, Singapore, Malaysia)
 * CLDR:    ta-IN
 *
 * Transliteration note on amounts:
 *   ₹ symbol is kept as-is (universally understood in India).
 *   Tamil number words included in voice.creditWords / paymentWords
 *   for the voice parser signal tables.
 */

"use strict";

module.exports = {
  meta: {
    code:     "ta",
    name:     "தமிழ்",
    script:   "Tamil",
    fallback: "en",     // Dravidian — no meaningful overlap with Hindi
    locale:   "ta-IN",
  },

  // ── Receipt ────────────────────────────────────────────────────────────────
  receipt: {
    title:          "பணம் செலுத்திய ரசீது",
    receiptNo:      "ரசீது எண்",
    shop:           "கடை",
    customer:       "வாடிக்கையாளர்",
    phone:          "தொலைபேசி",
    date:           "தேதி",
    time:           "நேரம்",
    totalAmount:    "மொத்த தொகை",
    amountPaid:     "செலுத்திய தொகை",
    balance:        "மீதி",
    status:         "நிலை",
    poweredBy:      "VoiceKhata மூலம்",
    statusLabels: {
      paid:    "செலுத்தப்பட்டது",
      partial: "பகுதியாக செலுத்தப்பட்டது",
      pending: "நிலுவையில் உள்ளது",
    },
    typeLabels: {
      credit:  "கடன்",
      payment: "பணம்",
    },
  },

  // ── Reminders ─────────────────────────────────────────────────────────────
  reminders: {
    friendly: {
      normal:  "வணக்கம் {name}! 🙏 ஒரு சிறிய நினைவூட்டல் — உங்களிடம் ₹{amount} நிலுவையில் உள்ளது{due}। வசதியான நேரத்தில் செலுத்துங்கள்। — {shop}",
      overdue: "வணக்கம் {name}! உங்கள் ₹{amount} தொகை{due} கொஞ்சம் தாமதமாகிவிட்டது.{partial} எப்போது வருவீர்கள்? — {shop}",
    },
    normal: {
      normal:  "{name}, ₹{amount} இன்னும் நிலுவையில் உள்ளது{due}.{partial} தயவுசெய்து செலுத்துங்கள். — {shop}",
      overdue: "{name}, ₹{amount} தொகை{due} நிலுவையில் உள்ளது.{partial} விரைவில் தீர்க்கவும். — {shop}",
    },
    strict: {
      normal:  "{name}, ₹{amount} தொகை{due} இன்னும் வரவில்லை.{partial} உடனே செலுத்துங்கள். — {shop}",
      overdue: "{name}, அறிவிப்பு: ₹{amount} தாமதமாகிவிட்டது{due}.{partial} இன்றே செலுத்துங்கள், இல்லையெனில் நடவடிக்கை எடுக்கப்படும். — {shop}",
    },
    partialNote: " நீங்கள் முன்பு சிறிது செலுத்தினீர்கள்; ₹{amount} இன்னும் மீதி உள்ளது.",
    dueOn:       " (செலுத்த வேண்டிய தேதி: {date})",
  },

  // ── Payment confirmations ─────────────────────────────────────────────────
  payment: {
    confirmed:    "{name} இடமிருந்து ₹{amount} பெறப்பட்டது. மீதி: ₹{remaining}.",
    fullyClear:   "கணக்கு முடிந்தது! {name} ₹{amount} செலுத்திவிட்டார். மீதி: ₹0. நன்றி!",
    partialClear: "{name} இடமிருந்து ₹{amount} பகுதியாக பெறப்பட்டது. இன்னும் மீதி: ₹{remaining}.",
  },

  // ── Voice parsing prompts ─────────────────────────────────────────────────
  voice: {
    placeholder:  "எ.கா: ரமேஷ் ₹500 வாங்கினார், நாளை தருவார்",
    hint:         "சொல்லுங்கள்: [பெயர்] ₹[தொகை] வாங்கினார், [எப்போது] தருவார்",
    creditWords:  [
      "வாங்கினார்", "கடன்", "நிலுவை", "எடுத்தார்",
      "வாங்கிட்டார்", "கொண்டுபோனார்",
    ],
    paymentWords: [
      "கொடுத்தார்", "திருப்பிக்கொடுத்தார்", "செலுத்தினார்",
      "அனுப்பினார்", "தந்தார்",
    ],
    dueDateWords: {
      today:    ["இன்று", "இப்போது"],
      tomorrow: ["நாளை"],
      week:     ["அடுத்த வாரம்", "ஒரு வாரத்தில்"],
      month:    ["அடுத்த மாதம்", "ஒரு மாதத்தில்"],
    },
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  onboarding: {
    languagePrompt: "ரசீது மற்றும் நினைவூட்டல்களுக்கான மொழியை தேர்ந்தெடுக்கவும்:",
    languageSet:    "சரி! இனி உள்ளடக்கம் தமிழில் உருவாக்கப்படும்.",
  },
};
