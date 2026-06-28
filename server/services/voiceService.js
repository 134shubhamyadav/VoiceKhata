"use strict";

/**
 * voiceService.js
 *
 * Two-tier voice parsing pipeline:
 *
 * Tier 1 — Gemini API (primary)
 *   Sends the raw transcript to Gemini with a structured extraction prompt.
 *   Handles Hindi, Hinglish, English, and mixed-language input natively.
 *   Returns: { customerName, amount, type, dueDate, note, confidence }
 *
 * Tier 2 — Rule-based fallback (secondary)
 *   Used when Gemini is unavailable (no API key, quota exceeded, network error).
 *   Keyword matching + number extraction covers common patterns.
 */

const appConfig = require("../config/appConfig");

// ─── Gemini Client Setup ────────────────────────────────────────────────────

let geminiModel = null;

(async () => {
  try {
    if (appConfig.geminiApiKey) {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(appConfig.geminiApiKey);
      geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("[VoiceService] Gemini AI initialized successfully.");
    } else {
      console.warn("[VoiceService] GEMINI_API_KEY not set. Using rule-based fallback parser.");
    }
  } catch (err) {
    console.warn("[VoiceService] Gemini initialization failed:", err.message);
  }
})();

// ─── Gemini Prompt ──────────────────────────────────────────────────────────

const GEMINI_PROMPT = (text) => `
You are a financial assistant for Indian merchants who track credit (udhaar) and payments (vasuli).
Analyse the following voice transcript and extract the transaction details.

The merchant may speak in Hindi (both Devnagari script and Hinglish), English, Marathi, Gujarati, or Bhojpuri.

Common patterns:
- "mene Yash ko 5000 udhar diye hai vah kal vapas karega" → credit, amount=5000, customer=Yash, dueDate=tomorrow
- "Suresh ne 1000 diya" → payment received, amount=1000, customer=Suresh
- "शुभम में 5 रुपए दिए" → payment received, amount=5, customer=Shubham, dueDate=${new Date().toISOString().split("T")[0]}
- "सतीश को 800 का उधार" → credit, amount=800, customer=Satish
- "Ramesh ka udhaar 500" → credit
- "2000 chai ke liye kharch kiya" → cashbook_out, amount=2000, note=Chai
- "aaj 3000 sales hui" → cashbook_in, amount=3000
- "Priya ko 700 kal tak dena hai" → credit, dueDate=tomorrow
- "maine Anil ko 50 diya, parso lautaega" → credit, amount=50, customer=Anil, dueDate=2 days from today
- "मैंने अनिल को 50 दिया, परसों लौटाएगा" → credit, amount=50, customer=Anil, dueDate=2 days from today
- "Ramesh la 500 udhar dile" → credit, amount=500, customer=Ramesh
- "Suresh kadun 200 aale" → payment, amount=200, customer=Suresh
- "रमेशने दोन हजार रुपये उधार घेतले" → credit, amount=2000, customer=रमेश (Remove suffix 'ने')
- "पाचशे रुपये दिले" → credit, amount=500
- "रमेशने दोन हजार रुपयांचा आधार घेतला आहे तीन दिवस नंतर देणार आहे" → credit, amount=2000, customer=रमेश, dueDate=3 days from today
- "Ramesh took credit of 3000 and will give me back after 3 days" → credit, amount=3000, customer=Ramesh, dueDate=3 days from today
- "उमेश ने 2000 का उधार लिया है तीन दिन बाद वापस करेगा" → credit, amount=2000, customer=उमेश, dueDate=3 days from today

ENGLISH SENTENCE PATTERNS (very important):
- "I give Ramesh 5000" → credit, customer=Ramesh, amount=5000
- "I gave Ramesh 5000 rupees" → credit, customer=Ramesh, amount=5000
- "give Ramesh 500" → credit, customer=Ramesh, amount=500
- "Ramesh took credit of 3000 and will give me back in X days" → credit, customer=Ramesh, amount=3000, dueDate=X days from today
- "Ramesh owes me 2000" → credit, customer=Ramesh, amount=2000
- "Priya paid me 1500" → payment, customer=Priya, amount=1500
- "he will give me back in 30 days" → dueDate = 30 days from today
- "give me back after 30 days" → dueDate = 30 days from today
- "return in X days" → dueDate = X days from today

CUSTOMER NAME EXTRACTION (critical):
- Look for proper nouns (capitalized names) immediately after "give", "gave", "to", "from", "for", "ko", "ne", "la", "kadun"
- "I give Ramesh" → Ramesh is the customer
- "mene Yash ko" → Yash is the customer
- "Suresh paid" → Suresh is the customer
- "Ramesh took credit" → Ramesh is the customer
- PRONOUNS ARE NOT NAMES. Ignore words like "maine", "mene", "I", "me", "wo", "usne", "vah", "tumne", "mi", "tumi", "tyane". Never return these as the customer name.
- CRITICAL: Strip suffixes from the name! In Marathi/Hindi, names often have suffixes attached (e.g. "रमेशने" -> "रमेश", "Rameshne" -> "Ramesh", "Sureshla" -> "Suresh", "Priyako" -> "Priya"). ALWAYS return the clean base name without "ne", "la", "ko", "kadun".
- "back" is NOT a customer name. If you see "give me back", the name must come before the verb not after "back".
- If no clear person name found, set customerName to null (do NOT set "Unknown Customer")

AMOUNT EXTRACTION (critical):
- Convert regional number words to digits!
- "दोन हजार" or "don hajar" = 2000
- "पाचशे" or "pachshe" = 500
- "शंभर" or "shambhar" = 100
- "three thousand" = 3000
- Must return a valid integer.

DUE DATE EXTRACTION (FOR ALL LANGUAGES):
- Always translate relative dates spoken in ANY language to YYYY-MM-DD.
- Examples of "Tomorrow" (+1 day): 'kal' (Hindi), 'udya' / 'उद्या' (Marathi), 'kale' / 'કાલે' (Gujarati), 'naalai' / 'நாளை' (Tamil), 'bihaan' (Bhojpuri), 'tomorrow'.
- Examples of "Day after tomorrow" (+2 days): 'parso' / 'परसों' (Hindi), 'parva' / 'परवा' (Marathi), 'param divase' / 'પરમ દિવસે' (Gujarati), 'day after tomorrow', 'terwa'.
- "give back in X days" or "after X days" or "in X days" = X days from today
- "X din baad vapas karega", "X din mein dega", "X divsanantr deil", "X divsat parat karel" = X days from today
- "X tarikh", "X tareekh", "X तारीख", "X tarke la", "X tarakhela", "X तारखेला", "on the Xth", "date X", "X of this month" = The Xth day of the current month (or next month if that day has passed). Format as YYYY-MM-DD.
- "teen din baad" = 3 days from today
- "तीन दिन बाद" = 3 days from today
- "तीन दिवस नंतर" = 3 days from today
- "three days" / "after 3 days" = 3 days from today
- "agle hafte", "next week", "pudhchya aathavdyat" = 7 days from today
- "agle mahine", "next month", "pudhchya mahinyat" = 30 days from today
- Payment type: if no date mentioned, use today as dueDate

Transaction type rules:
- CREDIT (given/taken udhaar): "diya", "denge", "dile", "udhaar diya", "udhar le", "udhaar liya", "credit", "liya", "ghetle", "baki", "baaki", "give", "gave", "I give", "borrow", "lent", "owes me", "unpaid", "due", "usne", "usane", "karja", "thakbaki", "dena baki hai", "udhar khatyame", "took credit", "will give back", "will return", "pay back" → type = "credit"
- PAYMENT (received from customer): "aaya", "mila", "aale", "jama", "payment mili", "vasuli", "bhugtaan", "bhugtan le", "chuka diya", "collected", "ne diya", "ne diye", "paid", "received from", "settled", "cleared", "returned", "got back", "vasul", "mile", "jama kiya", "wapas kiya", "vapas aaya", "return kiya", "chukta kiya", "mil gaya", "prapt hua", "milale", "jama zale", "parat dile", "fitale", "chukte kele", "phitle", "bharpai" → type = "payment"
- EXPENSE (money out): "kharch", "expense", "chai", "petrol", "rent", "salary", "spent", "bought", "paid for", "cost", "bill", "kharcha", "lag gaya", "de diye", "bhada", "pagar", "kiraaya", "gela", "bhade" → type = "cashbook_out"
- INCOME (money in): "sales", "bikri", "aaj ki", "galla", "income", "revenue", "sold", "profit", "kamai", "aamdani", "becha", "vikri", "utpanna", "dhanda" → type = "cashbook_in"

Today's date is: ${new Date().toISOString().split("T")[0]}

Return ONLY valid JSON — no markdown, no explanation:
{
  "customerName": "<proper name string, e.g. 'Ramesh', or null if not found>",
  "amount": <number in rupees, integer, required>,
  "type": "<credit | payment | cashbook_out | cashbook_in>",
  "dueDate": "<YYYY-MM-DD or null>",
  "note": "<brief English description or null>",
  "confidence": <0.0 to 1.0>
}

Transcript: "${text}"
`;

// ─── Gemini Parser ──────────────────────────────────────────────────────────

const parseWithGemini = async (text) => {
  if (!geminiModel) return null;

  try {
    const result = await geminiModel.generateContent(GEMINI_PROMPT(text));
    const raw    = result.response.text().trim();

    // Strip markdown code fences if Gemini returns them
    const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

    const parsed = JSON.parse(json);

    // Validate required fields
    let amountVal = parsed.amount;
    if (typeof amountVal === "string") {
      amountVal = parseFloat(amountVal.replace(/,/g, ""));
    }
    if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
      return null;
    }
    if (!["credit", "payment", "cashbook_out", "cashbook_in"].includes(parsed.type)) {
      return null;
    }

    return {
      customerName: parsed.customerName || null,
      amount:       Math.round(Math.abs(amountVal)),
      type:         parsed.type,
      dueDate:      parsed.dueDate || null,
      note:         parsed.note    || null,
      confidence:   Math.min(1, Math.max(0, parsed.confidence || 0.85)),
      source:       "gemini",
      raw:          text,
    };
  } catch (err) {
    console.warn("[VoiceService] Gemini parse error:", err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Rule-Based Fallback ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Number Dictionaries ─────────────────────────────────────────────────────

const HINDI_NUMBERS = {
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6, chhah: 6, saat: 7, aath: 8, nau: 9,
  das: 10, gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16,
  satrah: 17, atharah: 18, unnis: 19, bees: 20, ikkees: 21, baees: 22, tees: 30,
  chalis: 40, pachaas: 50, saath: 60, sattar: 70, assi: 80, nabbe: 90,
  sau: 100, hazaar: 1000, hazar: 1000, lakh: 100000, crore: 10000000,
};
const HINDI_MULTIPLIERS = { sau: 100, hazaar: 1000, hazar: 1000, lakh: 100000, crore: 10000000 };

const ENGLISH_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000, lakh: 100000, lakhs: 100000, crore: 10000000, crores: 10000000,
};
const ENGLISH_MULTIPLIERS = { hundred: 100, thousand: 1000, lakh: 100000, lakhs: 100000, crore: 10000000, crores: 10000000 };

const MARATHI_NUMBERS = {
  ek: 1, don: 2, teen: 3, char: 4, pach: 5, saha: 6, saat: 7, aath: 8, nau: 9,
  daha: 10, akra: 11, bara: 12, tera: 13, chaudha: 14, pandhra: 15, sola: 16,
  satra: 17, athara: 18, ekonis: 19, vis: 20, ekvis: 21, tis: 30,
  chalis: 40, pannas: 50, saath: 60, sattar: 70, ashi: 80, navvad: 90,
  shambhar: 100, she: 100, hajar: 1000, lakh: 100000,
};
const MARATHI_MULTIPLIERS = { shambhar: 100, she: 100, hajar: 1000, lakh: 100000 };

const DEVNAGARI_NUMBERS = {
  "एक": 1, "दोन": 2, "दो": 2, "तीन": 3, "चार": 4,
  "पाच": 5, "पांच": 5, "सहा": 6, "छह": 6, "सात": 7, "आठ": 8, "नऊ": 9, "नौ": 9,
  "दहा": 10, "दस": 10, "अकरा": 11, "ग्यारह": 11, "बारा": 12, "बारह": 12,
  "तेरा": 13, "तेरह": 13, "चौदा": 14, "चौदह": 14, "पंधरा": 15, "पंद्रह": 15,
  "सोळा": 16, "सोलह": 16, "सतरा": 17, "सत्रह": 17, "अठरा": 18, "अट्ठारह": 18,
  "एकोणीस": 19, "उन्नीस": 19, "वीस": 20, "बीस": 20,
  "तीस": 30, "चाळीस": 40, "चालीस": 40, "पन्नास": 50, "पचास": 50,
  "साठ": 60, "सत्तर": 70, "ऐंशी": 80, "अस्सी": 80, "नव्वद": 90, "नब्बे": 90,
  "शंभर": 100, "सौ": 100, "हजार": 1000, "लाख": 100000,
};
const DEVNAGARI_MULTIPLIERS = { "शंभर": 100, "सौ": 100, "हजार": 1000, "लाख": 100000 };

// Compound number words that appear as one joined word
const COMPOUND_NUMBER_MAP = {
  // Marathi "she" (hundred) compounds
  "pachshe": 500, "panchshe": 500, "donshe": 200, "donashe": 200,
  "teenshe": 300, "charshe": 400, "sahasha": 600, "saatsha": 700,
  "aathshe": 800, "naushe": 900,
  // Devnagari compounds
  "पाचशे": 500, "दोनशे": 200, "तीनशे": 300, "चारशे": 400,
  "सहाशे": 600, "सातशे": 700, "आठशे": 800, "नऊशे": 900,
  "पाचहजार": 5000, "दहाहजार": 10000,
};

// ─── Transaction Type Keywords ────────────────────────────────────────────────

const CASHBOOK_OUT_WORDS = [
  "expense", "spent", "bought", "paid for", "cost", "bill",
  "kharch", "kharch kiya", "kharcha", "lag gaya", "kharchale",
  "chai", "tea", "petrol", "fuel", "diesel", "rent", "bhada", "kiraaya", "bhade",
  "salary", "pagar", "wages", "electricity", "light bill",
  "samosa", "snack", "food", "transport", "maintenance",
  "kharcha zala", "gela",
];

const CASHBOOK_IN_WORDS = [
  "sales", "income", "revenue", "sold", "profit",
  "bikri", "galla", "aaj ki kamai", "kamai", "aamdani", "becha",
  "vikri", "utpanna", "dhanda", "milale",
  "settlement", "daily sales", "collection",
];

// Future-return phrases → ALWAYS credit (highest priority check)
const FUTURE_RETURN_PHRASES = [
  "will give me back", "will give back", "will return", "give me back",
  "will pay back", "pay me back", "pay back",
  "vapas karega", "wapas karega", "lautaega", "lautayega", "lotaega",
  "vapas dega", "wapas dega", "phir dega",
  "parat karel", "deil", "parat deil", "nantar deil",
  "वापस करेगा", "लौटाएगा", "देगा", "वापस देगा",
  "परत करेल", "देईल", "परत देईल",
];

const CREDIT_PHRASES = [
  "udhaar", "udhar", "credit", "baki", "baaki",
  "ka udhaar", "ko udhaar", "liya", "le gaya", "le liya",
  "ghetle", "gheto", "diya", "diye", "de diya", "dile",
  "borrow", "lent", "gave", "give", "owes", "unpaid", "due",
  "karja", "thakbaki", "dena baki", "khatyame",
  "took credit", "took loan",
  "aadhar gheta", "adhaar gheta",
  "उधार", "उधार दिया", "उधार लिया", "उधार दिए", "बाकी", "लिया", "दिए", "दिया", "दिले", "घेतले",
];

// Completed-payment phrases (past tense; must NOT include future-return words)
const PAYMENT_PATTERNS = [
  /\b(?:mila|aaya|vasuli|vasul|mile|bharpai)\b/,
  /\b(?:ne\s+diya|ne\s+diye|ne\s+bheja)\b/,
  /\b(?:jama\s+kiya|jama\s+hua|chuka\s+diya|chukta\s+kiya|pay\s+kiya)\b/,
  /\b(?:settled|received|cleared|collected|recovered|refunded)\b/,
  /\b(?:paid\s+me|paid\s+back|paid\s+us)\b/,
  /मिला|आया|वसूली|आले|कडून|परत\s+दिले|परत\s+आले|भुगतान/,
  /\b(?:parat\s+dile|parat\s+aale|fitale|chukte\s+kele|phitle)\b/,
  /\b(?:jama\s+zale|kadun\s+aale)\b/,
];

// ─── Preprocessing ───────────────────────────────────────────────────────────

const preProcessText = (text) => {
  let out = text;

  // 1. Replace compound Devnagari/Marathi number words (e.g. "पाचशे" → "500")
  for (const [word, val] of Object.entries(COMPOUND_NUMBER_MAP)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`, "gi"), ` ${val} `);
  }

  // 2. "N hazaar/lakh/thousand" → numeric (e.g. "2 hazaar" → "2000")
  const scaleMap = {
    hazaar: 1000, hazar: 1000, thousand: 1000, thousands: 1000,
    lakh: 100000, lakhs: 100000, crore: 10000000, crores: 10000000,
    sau: 100, hundred: 100, hundreds: 100,
  };
  const scaleRegex = /(\d+(?:\.\d+)?)\s*(hazaar|hazar|thousand|thousands|lakh|lakhs|crore|crores|sau|hundred|hundreds)\b/gi;
  out = out.replace(scaleRegex, (_, numStr, scaleWord) => {
    return (parseFloat(numStr) * scaleMap[scaleWord.toLowerCase()]).toString();
  });

  return out;
};

// ─── Amount Extraction ───────────────────────────────────────────────────────

const extractAmount = (text) => {
  // 1. Numeric match: ₹2000, Rs 500, "2000 rupees", plain "3000"
  const numMatch =
    text.match(/(?:₹|rs\.?\s*|inr\s*)(\d[\d,]*(?:\.\d+)?)/i) ||
    text.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:₹|rs\.?|inr|rupees?|rupe|रुपए|रुपये|रुपया|रु\.?)/i) ||
    text.match(/(\d[\d,]*(?:\.\d+)?)/);

  if (numMatch) {
    const val = parseFloat(numMatch[1].replace(/,/g, ""));
    if (val > 0) return Math.round(val);
  }

  // 2. Word numbers — try each language, stop accumulation at first non-number word
  const cleanText = text.toLowerCase().replace(/[^\u0900-\u097Fa-z\s]/g, "");
  const words = cleanText.split(/\s+/);

  const tryWordNumbers = (dict, multipliers) => {
    let total = 0, current = 0, found = false;
    for (const word of words) {
      if (dict[word] !== undefined) {
        found = true;
        const val = dict[word];
        if (multipliers[word]) {
          current = current === 0 ? val : current * val;
          total += current;
          current = 0;
        } else {
          current += val;
        }
      } else if (found) {
        break; // CRITICAL: stop at first non-number word (prevents dates polluting amount)
      }
    }
    return found ? total + current : 0;
  };

  const engVal = tryWordNumbers(ENGLISH_NUMBERS, ENGLISH_MULTIPLIERS);
  if (engVal > 0) return engVal;

  const hindiVal = tryWordNumbers(HINDI_NUMBERS, HINDI_MULTIPLIERS);
  if (hindiVal > 0) return hindiVal;

  const marathiVal = tryWordNumbers(MARATHI_NUMBERS, MARATHI_MULTIPLIERS);
  if (marathiVal > 0) return marathiVal;

  const devVal = tryWordNumbers(DEVNAGARI_NUMBERS, DEVNAGARI_MULTIPLIERS);
  if (devVal > 0) return devVal;

  return null;
};

// ─── Customer Name Extraction ────────────────────────────────────────────────

// Words that should NEVER be returned as a customer name
const NAME_STOPWORDS = new Set([
  // English
  "i", "me", "my", "he", "she", "we", "they", "you", "him", "her", "us",
  "back", "rupees", "rupee", "rs", "inr", "bucks", "money", "cash",
  "credit", "payment", "udhar", "udhaar", "aadhar", "loan",
  "din", "days", "day", "week", "month", "ago", "later", "after",
  "of", "on", "at", "in", "to", "for", "from", "by", "and", "the", "a",
  "took", "takes", "take", "give", "gave", "paid", "got", "will", "has",
  "have", "is", "are", "was", "were",
  "expense", "income", "sales", "return",
  // Hindi/Marathi pronouns
  "main", "maine", "mene", "mujhe", "mujhse", "mera", "meri",
  "vah", "vo", "wo", "usne", "uska", "unka", "unhe",
  "mi", "tumi", "tyane", "tila", "aami", "amhi", "aaple",
  "yah", "ye",
  // Common verbs at sentence start
  "aaya", "aale", "diya", "diye", "mila",
]);

const stripDevnagariSuffixes = (name) => {
  const suffixes = ["ने", "ला", "कडून", "को", "का", "के", "की", "से", "में"];
  for (const suf of suffixes) {
    if (name.endsWith(suf) && name.length > suf.length + 1) {
      return name.slice(0, name.length - suf.length);
    }
  }
  return name;
};

const stripLatinSuffixes = (name) => {
  return name.replace(/(?:ne|la|ko|ke|ka|ki|kadun)$/i, "");
};

const extractCustomerName = (text) => {
  const t = text.trim();

  // Pattern 1: Devnagari — suffix attached "रमेशने" or "रमेश ने"
  const devAttached = t.match(/^([\u0900-\u097F]+?)(?:ने|ला|कडून|को|का|के)(?:\s|$)/);
  if (devAttached) {
    const name = stripDevnagariSuffixes(devAttached[1]);
    if (name.length > 1 && !NAME_STOPWORDS.has(name)) return name;
  }

  const devSep = t.match(/^([\u0900-\u097F]+)\s+(?:ने|को|का|के|की|ला|कडून)\b/);
  if (devSep) {
    const name = devSep[1];
    if (!NAME_STOPWORDS.has(name)) return name;
  }

  // Pattern 2: Devnagari name after "को/से/कडून"
  const devAfter = t.match(/\b(?:को|से|के|कडून)\s+([\u0900-\u097F]+)\b/);
  if (devAfter) {
    const name = devAfter[1];
    if (!NAME_STOPWORDS.has(name)) return name;
  }

  // Pattern 3: English/Hinglish — "[Name] ne/ko/la/kadun"
  const latinBefore = t.match(/^([A-Za-z][a-zA-Z]*)(?:\s+|\b)(?:ne|ko|ka|ke|la|kadun)\b/i);
  if (latinBefore) {
    const name = stripLatinSuffixes(latinBefore[1].trim());
    if (name.length > 2 && !NAME_STOPWORDS.has(name.toLowerCase())) {
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
  }

  // Pattern 4: English — "[Name] took/paid/gave/owes..." (name is subject)
  const nameSubject = t.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:took|paid|gave|owes|borrowed|returned|has)\b/);
  if (nameSubject) {
    const name = nameSubject[1];
    if (!NAME_STOPWORDS.has(name.toLowerCase())) return name;
  }

  // Pattern 5: English — "give/gave/paid/lent [Name]"
  const afterVerb = t.match(/\b(?:give|gave|paid|given|lent|credited)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (afterVerb) {
    const name = afterVerb[1];
    if (!NAME_STOPWORDS.has(name.toLowerCase())) return name;
  }

  // Pattern 6: Hinglish suffix attached "Rameshne" → "Ramesh"
  const latinSuffix = t.match(/^([A-Za-z]{3,}?)(?:ne|la|ko)(?:\s|$)/i);
  if (latinSuffix) {
    const name = latinSuffix[1];
    if (name.length > 2 && !NAME_STOPWORDS.has(name.toLowerCase())) {
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
  }

  // Pattern 7: Devnagari first word fallback
  const firstDev = t.match(/^([\u0900-\u097F]+)/);
  if (firstDev) {
    const name = stripDevnagariSuffixes(firstDev[1]);
    if (name.length > 1 && !NAME_STOPWORDS.has(name)) return name;
  }

  // Pattern 8: First capitalized English word (last resort)
  const firstCap = t.match(/\b([A-Z][a-z]{2,})\b/);
  if (firstCap) {
    const name = firstCap[1];
    if (!NAME_STOPWORDS.has(name.toLowerCase())) return name;
  }

  return null;
};

// ─── Due Date Extraction ─────────────────────────────────────────────────────

const extractDueDate = (text) => {
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];
  const addDays = (d) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split("T")[0];
  };

  let t = text.toLowerCase();

  // Step 1: Replace word-numbers with digits (for date context only)
  const numWords = {
    // English
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "fifteen": 15, "twenty": 20, "thirty": 30,
    // Hindi/Hinglish
    "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5,
    "chhe": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    "gyarah": 11, "barah": 12, "pandrah": 15, "bees": 20, "tees": 30,
    // Marathi romanised
    "don": 2, "pach": 5, "saha": 6, "daha": 10, "vis": 20, "tis": 30,
    "bara": 12, "pandhra": 15,
    // Hindi Devnagari
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5,
    "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "पंद्रह": 15, "बीस": 20, "तीस": 30,
    // Marathi Devnagari
    "दोन": 2, "पाच": 5, "सहा": 6, "दहा": 10, "वीस": 20,
    "नऊ": 9, "अकरा": 11, "बारा": 12, "पंधरा": 15,
  };
  for (const [word, digit] of Object.entries(numWords)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "g"), `$1${digit}`);
  }

  // Step 2: Absolute relative keywords
  if (/\b(?:aaj|today|aaja|aaje)\b|आज/.test(t)) return todayISO;
  if (/\b(?:kal|tomorrow|udya|kale|bihaan)\b|कल|उद्या|बिहान/.test(t)) return addDays(1);
  if (/\b(?:parso|parson|parsoo|day\s*after|terwa|parva)\b|परसों|परसो|परवा/.test(t)) return addDays(2);
  if (/\b(?:next\s*week|agle\s*hafte|hafte\s*mein|pudhchya\s*aathavdyat)\b|हफ्ते|सप्ताह|आठवड/.test(t)) return addDays(7);
  if (/\b(?:next\s*month|agle\s*mahine|mahine\s*mein|pudhchya\s*mahinyat)\b|महीने|महीना|महिन्यात/.test(t)) return addDays(30);

  // Step 3: "X din/days baad/mein/later/nantar"
  const daysAfter = t.match(/(\d+)\s*(?:din|day|days|divas|दिन|दिवस)\s*(?:baad|mein|me|later|nantar|sat|बाद|में|नंतर)/);
  if (daysAfter) return addDays(parseInt(daysAfter[1]));

  // Step 4: "after X days" / "in X days"
  const daysPrefix = t.match(/(?:after|in)\s+(\d+)\s+(?:days?|din|divas)/);
  if (daysPrefix) return addDays(parseInt(daysPrefix[1]));

  // Step 5: Marathi compound "3 divsanantr" / "3 divsat parat"
  const marathiSuffix = t.match(/(\d+)\s*(?:divsanantr|divsat\s*parat)/);
  if (marathiSuffix) return addDays(parseInt(marathiSuffix[1]));

  // Step 6: Generic fallback "X days"
  const daysFallback = t.match(/(\d+)\s+days?/);
  if (daysFallback) return addDays(parseInt(daysFallback[1]));

  // Step 6.5: "X tarikh" or "date X" or "X tarke la"
  const tarikhMatch = t.match(/(?:on the\s+|date\s+|)(\d+)\s*(?:tarikh|tareekh|tariq|तारीख|tarke\s*la|tarakhela|तारखेला|th|nd|rd|st\s+of|th\s+of)?(?:\s+ko)?/);
  if (tarikhMatch) {
    const day = parseInt(tarikhMatch[1]);
    const today = new Date();
    let m = today.getMonth();
    let y = today.getFullYear();
    if (day < today.getDate()) {
      m++;
      if (m > 11) { m = 0; y++; }
    }
    const d = new Date(y, m, day);
    // ensure local time formatting doesn't shift the day
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Step 7: ISO date in text
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];

  return null;
};

// ─── Transaction Type Detection ──────────────────────────────────────────────

const detectType = (text) => {
  const t = text.toLowerCase();

  // Priority 1: Expense
  if (CASHBOOK_OUT_WORDS.some((w) => t.includes(w))
    || /खर्च|सैलरी|किराया|पेट्रोल|भाडे/.test(t)) {
    return "cashbook_out";
  }

  // Priority 2: Income
  if (CASHBOOK_IN_WORDS.some((w) => t.includes(w))
    || /बिक्री|कमाई|गल्ला|उत्पन्न/.test(t)) {
    return "cashbook_in";
  }

  // Priority 3: Future-return = CREDIT (must check BEFORE payment words)
  //   "vapas karega", "will give back", "parat karel" etc.
  if (FUTURE_RETURN_PHRASES.some((p) => t.includes(p))) {
    return "credit";
  }

  // Priority 4: Explicit credit keywords (udhaar, liya, give, borrow)
  if (CREDIT_PHRASES.some((p) => t.includes(p))
    || /उधार|लिया|बाकी|दिले|घेतले|आधार घेतला/.test(t)) {
    return "credit";
  }

  // Priority 5: Completed payment (past tense)
  if (PAYMENT_PATTERNS.some((re) => re.test(t))) {
    return "payment";
  }

  // Priority 6: Default = credit
  return "credit";
};

// ─── Main Rule-Based Parser ──────────────────────────────────────────────────

const ruleBasedParse = (text) => {
  const processedText = preProcessText(text);

  const amount       = extractAmount(processedText);
  const customerName = extractCustomerName(processedText);
  const type         = detectType(processedText);
  let   dueDate      = extractDueDate(processedText);

  // Payment with no date → default to today
  if (type === "payment" && !dueDate) {
    dueDate = new Date().toISOString().split("T")[0];
  }

  let confidence = 0.60;
  if (amount)       confidence += 0.15;
  if (customerName) confidence += 0.10;
  if (dueDate)      confidence += 0.05;

  return {
    customerName: customerName || null,
    amount:       amount       || 0,
    type,
    dueDate:      dueDate      || null,
    note:         null,
    confidence:   Math.min(0.90, confidence),
    source:       "rule-based",
    raw:          text,
  };
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * processVoiceInput(text)
 *
 * Tries Gemini first; falls back to rule-based parser.
 * Always returns a valid result object.
 */
const processVoiceInput = async (text) => {
  // Tier 1: Gemini
  const geminiResult = await parseWithGemini(text);
  if (geminiResult) return geminiResult;

  // Tier 2: Rule-based
  return ruleBasedParse(text);
};

module.exports = { processVoiceInput, ruleBasedParse };
