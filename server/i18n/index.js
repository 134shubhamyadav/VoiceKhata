/**
 * i18n/index.js
 *
 * Central i18n engine for VoiceKhata.
 *
 * Responsibilities:
 *   1. Load and cache all locale files at startup
 *   2. Resolve keys with fallback chain (bho → hi, mr/gu/ta → en)
 *   3. Interpolate {variable} placeholders in template strings
 *   4. Format currency and dates per locale
 *   5. Expose t() and helpers consumed by services
 *
 * Adding a new language:
 *   1. Create server/i18n/locales/<code>.js  (mirror en.js structure)
 *   2. Add code to SUPPORTED_LANGUAGES in User.js
 *   3. Done — the engine auto-discovers and loads it here
 */

"use strict";

const path = require("path");
const fs   = require("fs");

// ---------------------------------------------------------------------------
// Load all locale files from ./locales/
// ---------------------------------------------------------------------------

const LOCALES_DIR = path.join(__dirname, "locales");

/** @type {Record<string, object>} */
const registry = {};

fs.readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith(".js"))
  .forEach((file) => {
    const code            = path.basename(file, ".js");
    registry[code]        = require(path.join(LOCALES_DIR, file));
  });

// ---------------------------------------------------------------------------
// Internal: deep-get a dotted key path from an object
//   get(obj, "receipt.statusLabels.paid") → "PAID"
// ---------------------------------------------------------------------------

const _dig = (obj, keyPath) => {
  const parts = keyPath.split(".");
  let node    = obj;
  for (const part of parts) {
    if (node === null || node === undefined || typeof node !== "object") return undefined;
    node = node[part];
  }
  return node;
};

// ---------------------------------------------------------------------------
// Internal: resolve a key through the fallback chain
// ---------------------------------------------------------------------------

const _resolve = (lang, keyPath) => {
  const visited = new Set();
  let current   = lang;

  while (current && !visited.has(current)) {
    visited.add(current);
    const locale = registry[current];
    if (!locale) break;

    const value = _dig(locale, keyPath);
    if (value !== undefined && value !== null) return value;

    // Walk up the fallback chain
    current = locale.meta?.fallback ?? null;
  }

  // Last resort: English
  return _dig(registry["en"], keyPath);
};

// ---------------------------------------------------------------------------
// Internal: interpolate {variable} placeholders
//   interpolate("Hello {name}!", { name: "Ramesh" }) → "Hello Ramesh!"
// ---------------------------------------------------------------------------

const _interpolate = (template, vars = {}) => {
  if (typeof template !== "string") return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined && val !== null ? String(val) : `{${key}}`;
  });
};

// ---------------------------------------------------------------------------
// t()  — primary translation function
//
// @param {string} lang      Language code ("hi", "ta", "en", ...)
// @param {string} keyPath   Dot-separated key ("receipt.title")
// @param {object} [vars]    Interpolation variables
// @returns {string}
//
// Usage:
//   t("hi", "receipt.title")                       → "भुगतान रसीद"
//   t("ta", "reminders.friendly.normal", { name: "Ramesh", amount: 500, due: "", shop: "Raj Stores" })
// ---------------------------------------------------------------------------

const t = (lang, keyPath, vars = {}) => {
  const raw = _resolve(lang || "en", keyPath);
  if (raw === undefined) {
    console.warn(`[i18n] Missing key "${keyPath}" for lang "${lang}"`);
    return keyPath;   // fail-visible: returns key path so bugs are obvious
  }
  return _interpolate(raw, vars);
};

// ---------------------------------------------------------------------------
// tReceipt()  — shorthand for receipt label lookups
// ---------------------------------------------------------------------------

const tReceipt = (lang, key, vars = {}) => t(lang, `receipt.${key}`, vars);

// ---------------------------------------------------------------------------
// buildReminderMessage()
//
// Constructs a full reminder string from tone + context.
// Handles the partialNote and dueOn sub-templates internally.
//
// @param {string} lang
// @param {string} tone       "friendly" | "normal" | "strict"
// @param {object} ctx
//   ctx.name     {string}  Customer name
//   ctx.amount   {number}  Remaining amount
//   ctx.shop     {string}  Shop name
//   ctx.isOverdue {boolean}
//   ctx.isPartial {boolean}
//   ctx.dueDate  {Date|null}
// @returns {string}
// ---------------------------------------------------------------------------

const buildReminderMessage = (lang, tone, ctx) => {
  const { name, amount, shop } = ctx;

  // Extract digits to cleanly format as ₹X,XXX
  const cleanAmountDigits = String(amount).replace(/[^0-9]/g, '');
  const formattedAmount = cleanAmountDigits ? `₹${Number(cleanAmountDigits).toLocaleString('en-IN')}` : amount;

  const templates = {
    en: `Namaste {name},\n\nThis is a reminder from {shop}.\n\nYour pending amount is {amount}.\n\nPlease complete the payment.\n\nSupported by VoiceKhata`,
    hi: `नमस्ते {name},\n\nयह {shop} की तरफ से एक रिमाइंडर है।\n\nआपकी लंबित राशि {amount} है।\n\nकृपया भुगतान पूरा करें।\n\nSupported by VoiceKhata`,
    ta: `வணக்கம் {name},\n\nஇது {shop} இலிருந்து ஒரு நினைவூட்டல் ஆகும்.\n\nஉங்கள் நிலுவையில் உள்ள தொகை {amount} ஆகும்.\n\nதயவுசெய்து கட்டணத்தை முடிக்கவும்.\n\nSupported by VoiceKhata`,
    mr: `नमस्ते {name},\n\nहा {shop} कडून एक स्मरणपत्र आहे.\n\nतुमची प्रलंबित रक्कम {amount} आहे.\n\nकृपया पेमेंट पूर्ण करा.\n\nSupported by VoiceKhata`,
    gu: `નમસ્તે {name},\n\nઆ {shop} તરફથી રીમાઇન્ડર છે.\n\nતમારી બાકી રકમ {amount} છે.\n\nકૃપા કરીને ચુકવણી પૂર્ણ કરો.\n\nSupported by VoiceKhata`,
    bho: `प्रणाम {name},\n\nई {shop} के तरफ से एगो रिमाइंडर बा।\n\nराउर बाकी रुपया {amount} बा।\n\nकृपया भुगतान पूरा करीं।\n\nSupported by VoiceKhata`
  };

  const selectedLang = lang && templates[lang] ? lang : "en";
  const template = templates[selectedLang];

  return template
    .replace("{name}", name || "Customer")
    .replace("{shop}", shop || "VoiceKhata Shop")
    .replace("{amount}", formattedAmount);
};

// ---------------------------------------------------------------------------
// buildPaymentConfirmation()
//
// @param {string} lang
// @param {object} ctx
//   ctx.name       {string}  Customer name
//   ctx.amount     {number}  Amount paid this transaction
//   ctx.remaining  {number}  Remaining after this payment
// @returns {string}
// ---------------------------------------------------------------------------

const buildPaymentConfirmation = (lang, ctx) => {
  const { name, amount, remaining } = ctx;

  const key = remaining === 0 ? "payment.fullyClear" : "payment.partialClear";
  return t(lang, key, { name, amount, remaining });
};

// ---------------------------------------------------------------------------
// formatCurrency()
//
// Always uses ₹ INR. Formats number per locale conventions.
// ---------------------------------------------------------------------------

const formatCurrency = (amount, lang = "en") => {
  const locale = registry[lang]?.meta?.locale || "en-IN";
  return new Intl.NumberFormat(locale, {
    style:    "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// ---------------------------------------------------------------------------
// getSupportedLanguages()
//
// Returns array of { code, name } for UI dropdowns.
// ---------------------------------------------------------------------------

const getSupportedLanguages = () =>
  Object.values(registry).map((loc) => ({
    code: loc.meta.code,
    name: loc.meta.name,
  }));

// ---------------------------------------------------------------------------
// getVoiceHints()
//
// Returns voice parser signal words + UI prompts for a language.
// Used by voiceService to extend its pattern tables per merchant.
// ---------------------------------------------------------------------------

const getVoiceHints = (lang) => ({
  placeholder:  t(lang, "voice.placeholder"),
  hint:         t(lang, "voice.hint"),
  creditWords:  _resolve(lang, "voice.creditWords")  || [],
  paymentWords: _resolve(lang, "voice.paymentWords") || [],
  dueDateWords: _resolve(lang, "voice.dueDateWords") || {},
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  t,
  tReceipt,
  buildReminderMessage,
  buildPaymentConfirmation,
  formatCurrency,
  getSupportedLanguages,
  getVoiceHints,
  locales: registry,
  registry
};
