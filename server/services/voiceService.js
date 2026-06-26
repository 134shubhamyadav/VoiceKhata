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

ENGLISH SENTENCE PATTERNS (very important):
- "I give Ramesh 5000" → credit, customer=Ramesh, amount=5000
- "I gave Ramesh 5000 rupees" → credit, customer=Ramesh, amount=5000
- "give Ramesh 500" → credit, customer=Ramesh, amount=500
- "I give NAME AMOUNT and he will give me back in X days" → credit, customer=NAME, amount=AMOUNT, dueDate=X days from today
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
- PRONOUNS ARE NOT NAMES. Ignore words like "maine", "mene", "I", "me", "wo", "usne", "vah", "tumne", "mi", "tumi", "tyane". Never return these as the customer name.
- CRITICAL: Strip suffixes from the name! In Marathi/Hindi, names often have suffixes attached (e.g. "रमेशने" -> "रमेश", "Rameshne" -> "Ramesh", "Sureshla" -> "Suresh", "Priyako" -> "Priya"). ALWAYS return the clean base name without "ne", "la", "ko", "kadun".
- If no clear person name found, set customerName to null (do NOT set "Unknown Customer")

AMOUNT EXTRACTION (critical):
- Convert regional number words to digits!
- "दोन हजार" or "don hajar" = 2000
- "पाचशे" or "pachshe" = 500
- "शंभर" or "shambhar" = 100
- Must return a valid integer.

DUE DATE EXTRACTION (FOR ALL LANGUAGES):
- Always translate relative dates spoken in ANY language to YYYY-MM-DD.
- Examples of "Tomorrow" (+1 day): 'kal' (Hindi), 'udya' / 'उद्या' (Marathi), 'kale' / 'કાલે' (Gujarati), 'naalai' / 'நாளை' (Tamil), 'bihaan' (Bhojpuri), 'tomorrow'.
- Examples of "Day after tomorrow" (+2 days): 'parso' / 'परसों' (Hindi), 'parva' / 'परवा' (Marathi), 'param divase' / 'પરમ દિવસે' (Gujarati), 'naalai marunaal' / 'நாளை மறுநாள்' (Tamil), 'day after tomorrow', 'terwa'.
- "30 days back" = 30 days from today
- "give back in X days" or "after X days" or "in X days" = X days from today
- "he will give me X days back" = X days from today
- "X din baad vapas karega", "X din mein dega", "X divsanantr deil", "X divsat parat karel" = X days from today
- "agle hafte", "next week", "pudhchya aathavdyat" = 7 days from today
- "agle mahine", "next month", "pudhchya mahinyat" = 30 days from today
- Payment type: if no date mentioned, use today as dueDate

Transaction type rules:
- CREDIT (given/taken udhaar): "diya", "denge", "dile", "udhaar diya", "udhar le", "udhaar liya", "credit", "liya", "ghetle", "baki", "baaki", "give", "gave", "I give", "borrow", "lent", "owes me", "unpaid", "due", "usne", "usane", "karja", "thakbaki", "dena baki hai", "udhar khatyame" → type = "credit"
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

// ─── Rule-Based Fallback ─────────────────────────────────────────────────────

const HINDI_NUMBERS = {
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9,
  das: 10, bees: 20, tees: 30, chalis: 40, pachaas: 50, saath: 60, sattar: 70,
  assi: 80, nabbe: 90, sau: 100, hazaar: 1000, lakh: 100000,
};
const MULTIPLIERS = { sau: 100, hazaar: 1000, lakh: 100000 };

const ENGLISH_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000, lakh: 100000, lakhs: 100000, crore: 10000000, crores: 10000000
};
const ENGLISH_MULTIPLIERS = {
  hundred: 100, thousand: 1000, lakh: 100000, lakhs: 100000, crore: 10000000, crores: 10000000
};

const MARATHI_NUMBERS = {
  ek: 1, don: 2, teen: 3, char: 4, pach: 5, saha: 6, saat: 7, aath: 8, nau: 9,
  daha: 10, vis: 20, tis: 30, chalis: 40, pannas: 50, sath: 60, sattar: 70,
  aishi: 80, navvad: 90, shambhar: 100, she: 100, hajar: 1000, lakh: 100000,
};
const MARATHI_MULTIPLIERS = { shambhar: 100, she: 100, hajar: 1000, lakh: 100000 };

const DEVNAGARI_NUMBERS = {
  "एक": 1, "दोन": 2, "दो": 2, "तीन": 3, "चार": 4, "पाच": 5, "पांच": 5, "सहा": 6, "छह": 6, "सात": 7, "आठ": 8, "नऊ": 9, "नौ": 9,
  "दहा": 10, "दस": 10, "वीस": 20, "बीस": 20, "तीस": 30, "चाळीस": 40, "चालीस": 40, "पन्नास": 50, "पचास": 50, "साठ": 60, "साठ": 60, 
  "सत्तर": 70, "ऐंशी": 80, "अस्सी": 80, "नव्वद": 90, "नब्बे": 90, "शंभर": 100, "सौ": 100, "हजार": 1000, "लाख": 100000
};
const DEVNAGARI_MULTIPLIERS = { "शंभर": 100, "सौ": 100, "हजार": 1000, "लाख": 100000 };

const CASHBOOK_OUT_WORDS = [
  "expense", "kharch", "kharch kiya", "chai", "tea", "rent", "salary",
  "petrol", "fuel", "bill", "electricity", "samosa", "snack", "food",
  "wages", "transport", "maintenance", "dile", "kharchale", "spent",
  "bought", "paid for", "cost", "kharcha", "lag gaya", "bhada", "pagar", "kiraaya", "gela", "bhade"
];
const CASHBOOK_IN_WORDS = [
  "sales", "bikri", "income", "revenue", "galla", "aaj ki kamai",
  "settlement", "daily sales", "collection", "jama", "aale", "milale",
  "sold", "profit", "kamai", "aamdani", "becha", "vikri", "utpanna", "dhanda"
];
const CREDIT_WORDS = [
  "udhaar", "credit", "diya", "diye", "de diya", "baki", "baaki",
  "liya", "le gaya", "ka udhaar", "ko udhaar", "udhar", "dile", "ghetle",
  "borrow", "lent", "gave", "give", "owes", "unpaid", "due", "usne", "usane", "karja", "thakbaki", "dena baki", "khatyame"
];
const PAYMENT_WORDS = [
  "payment", "paid", "mila", "aaya", "vasuli", "wapas", "return",
  "ne diya", "ne diye", "collect", "recovered", "aale", "kadun aale", "jama", "parat",
  "settled", "received", "cleared", "returned", "got back", "vasul", "mile", "jama kiya", "wapas kiya", "vapas aaya", "return kiya", "bhugtaan", "chuka diya", "chukta kiya", "pay kiya", "mil gaya", "prapt hua", "jama zale", "parat dile", "fitale", "chukte kele", "phitle", "bharpai"
];

const extractAmount = (text) => {
  // Numeric: 2000, 2,000, ₹2000, Rs 2000
  const numericMatch = text.match(/(?:₹|rs\.?|inr\s*)?\s*(\d[\d,]*(?:\.\d+)?)/i);
  if (numericMatch) {
    const val = parseFloat(numericMatch[1].replace(/,/g, ""));
    if (val > 0) return Math.round(val);
  }

  // Clean text: keep english letters, spaces, and devnagari characters
  const cleanText = text.toLowerCase().replace(/[^\u0900-\u097Fa-z\s]/g, "");
  const words = cleanText.split(/\s+/);
  let total = 0, current = 0;
  let hasEnglishWord = false;

  for (const word of words) {
    if (ENGLISH_NUMBERS[word] !== undefined) {
      hasEnglishWord = true;
      const value = ENGLISH_NUMBERS[word];
      if (ENGLISH_MULTIPLIERS[word] !== undefined) {
        current = current === 0 ? value : current * value;
        total += current;
        current = 0;
      } else {
        current += value;
      }
    }
  }
  if (hasEnglishWord) {
    const finalVal = total + current;
    if (finalVal > 0) return finalVal;
  }

  // Hindi words: "paanch hazaar", "do sau"
  total = 0;
  current = 0;
  let hasHindiWord = false;
  for (const word of words) {
    if (HINDI_NUMBERS[word] !== undefined) {
      hasHindiWord = true;
      const value = HINDI_NUMBERS[word];
      if (MULTIPLIERS[word] !== undefined) {
        current = current === 0 ? value : current * value;
        total += current;
        current = 0;
      } else {
        current += value;
      }
    }
  }
  if (hasHindiWord) {
    const finalVal = total + current;
    if (finalVal > 0) return finalVal;
  }

  // Marathi words: "don hajar", "pach she"
  total = 0;
  current = 0;
  let hasMarathiWord = false;
  for (const word of words) {
    if (MARATHI_NUMBERS[word] !== undefined) {
      hasMarathiWord = true;
      const value = MARATHI_NUMBERS[word];
      if (MARATHI_MULTIPLIERS[word] !== undefined) {
        current = current === 0 ? value : current * value;
        total += current;
        current = 0;
      } else {
        current += value;
      }
    }
  }
  if (hasMarathiWord) {
    const finalVal = total + current;
    if (finalVal > 0) return finalVal;
  }

  // Devnagari words: "दोन हजार", "पाचशे", "दो सौ"
  total = 0;
  current = 0;
  let hasDevnagariWord = false;
  for (const word of words) {
    if (DEVNAGARI_NUMBERS[word] !== undefined) {
      hasDevnagariWord = true;
      const value = DEVNAGARI_NUMBERS[word];
      if (DEVNAGARI_MULTIPLIERS[word] !== undefined) {
        current = current === 0 ? value : current * value;
        total += current;
        current = 0;
      } else {
        current += value;
      }
    }
  }
  if (hasDevnagariWord) {
    const finalVal = total + current;
    if (finalVal > 0) return finalVal;
  }

  return null;
};

const extractCustomerName = (text) => {
  // Look for name before/after common prepositions in both English and Hindi/Marathi Devnagari script
  const patterns = [
    // Devnagari patterns (Hindi & Marathi suffixes)
    /^([\u0900-\u097F]+)\s+(?:ने|को|का|के|की|में|से|ला|कडून)(?:\s|$)/,
    /(?:\s|^)(?:ने|को|का|के|से|कडून)\s+([\u0900-\u097F]+)(?:\s|$)/,
    /^([\u0900-\u097F]+)(?:ने|ला|कडून)(?:\s|$)/, // Suffix attached directly
    // English patterns (Hindi & Marathi suffixes)
    /^([a-zA-Z]+(?:\s[a-zA-Z]+)?)\s+(?:ko|ne|ka|ke|ki|la|kadun)\b/i,
    /\b(?:ko|ne|ka|ke|kadun)\s+([a-zA-Z]+(?:\s[a-zA-Z]+)?)\b/i,
    /^([a-zA-Z]+)(?:ne|la)\b/i, // Suffix attached directly
    // English action verbs & prepositions
    /\b(?:gave|give|paid|to|from)\s+([a-zA-Z]+(?:\s[a-zA-Z]+)?)\b/i,
    /\b([a-zA-Z]+(?:\s[a-zA-Z]+)?)\s+(?:paid|gave|owes|returns|returned)\b/i,
    /^([a-zA-Z]{2,})\b/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1] && m[1].length > 1) {
      let name = m[1].trim();
      // Strip starting Hinglish/Marathi pronouns
      const pronouns = ["me", "main", "maine", "mene", "i", "he", "she", "we", "they", "you", "mujhse", "mujhe", "mera", "meri", "vah", "wo", "usne", "mi", "tumi", "tyane", "tila", "aami", "amhi"];
      const words = name.split(/\s+/);
      if (words.length > 1 && pronouns.includes(words[0].toLowerCase())) {
        words.shift();
        name = words.join(" ");
      } else if (words.length === 1 && pronouns.includes(words[0].toLowerCase())) {
        return null;
      }
      // Capitalize first letter if it is English
      if (/^[a-zA-Z]/.test(name)) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
      return name;
    }
  }

  // Fallback: if first word is in Devnagari and it is followed by prepositions/amounts
  const words = text.trim().split(/\s+/);
  if (words.length > 0 && /^[\u0900-\u097F]+$/.test(words[0])) {
    const stopwords = ["ने", "को", "का", "के", "की", "में", "से", "रुपए", "रुपये", "रुपया", "दिए", "दिया", "खर्च", "उधार", "पेमेंट"];
    if (!stopwords.includes(words[0])) {
      return words[0];
    }
  }
  return null;
};

const extractDueDate = (text) => {
  const t = text.toLowerCase();
  const today = new Date();
  const addDays = (d) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split("T")[0];
  };

  // Today: aaj, aaja, aaje, indru, aaju
  if (/aaj|today|आज|aaja|aaje|આજે|indru|இன்று|aaju|आजु/.test(t)) return addDays(0);
  
  // Tomorrow: kal, udya, kale, naali, bihaan
  if (/kal|tomorrow|कल|udya|उद्या|kale|કાલે|naalai|நாளை|bihaan|बिहान/.test(t)) return addDays(1);
  
  // Day After Tomorrow: parso, parva, param divase, naalai marunaal
  if (/parso|parson|day after|परसों|परसो|parva|परवा|param divase|પરમ દિવસે|naalai marunaal|நாளை மறுநாள்|terwa/.test(t)) return addDays(2);
  
  // Next week: pudhchya, aavta avadiye, adutha vaaram
  if (/hafte\s*mein|next\s*week|हफ्ते|सप्ताह|pudhchya aathavdyat|पुढच्या आठवड्यात|aavta avadiye|આવતા અઠવાડિયે|adutha vaaram|அடுத்த வாரம்|agle hafte/.test(t)) return addDays(7);
  
  // Next month: pudhchya mahinyat, aavta mahine, adutha maatham
  if (/mahine\s*mein|next\s*month|महीने|महीना|pudhchya mahinyat|पुढच्या महिन्यात|aavta mahine|આવતા મહિને|adutha maatham|அடுத்த மாதம்|agle mahine/.test(t)) return addDays(30);

  const daysMatch = t.match(/(\d+)\s*(?:din|days?|divas|दिन|दिवस)\s*(?:mein|baad|later|nantar|sat|में|बाद|नंतर)/);
  if (daysMatch) return addDays(parseInt(daysMatch[1]));

  const daysPrefixMatch = t.match(/(?:in|after)\s+(\d+)\s+(?:days?)/);
  if (daysPrefixMatch) return addDays(parseInt(daysPrefixMatch[1]));

  const marathiSuffixMatch = t.match(/(\d+)\s*(?:divsanantr)/);
  if (marathiSuffixMatch) return addDays(parseInt(marathiSuffixMatch[1]));

  // ISO date
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  return null;
};

const detectType = (text) => {
  const t = text.toLowerCase();
  if (CASHBOOK_OUT_WORDS.some((w) => t.includes(w)) || /खर्च|सैलरी|किराया|पेट्रोल/i.test(t)) return "cashbook_out";
  if (CASHBOOK_IN_WORDS.some((w) => t.includes(w)) || /बिक्री|कमाई|गल्ला/i.test(t)) return "cashbook_in";

  // Check if "ne/mein/kadun" or "ने/में/कडून" is present before the amount, and "diya/diye/aale" or "दिया/दिए/आले/दिले" is present
  const isPaymentRegex = /(?:ne|mein|kadun|ने|में|कडून)\s+.*\s+(?:diya|diye|aale|jama|dile|दिया|दिए|आले|जमा|दिले)(?:\s|$)/i;
  const isPaymentSimple = /mila|aaya|vasuli|wapas|payment|paid|collect|aale|kadun|parat|bhugtaan|bhugtan|settled|received|cleared|returned|vasul|mile|chukta|prapt|fitale|phitle|bharpai|मिला|आया|वसूली|वापस|आले|कडून|परत|भुगतान/i;
  if (isPaymentRegex.test(t) || isPaymentSimple.test(t)) {
    return "payment";
  }

  const isCreditRegex = /udhaar|udhar|credit|diya|diye|baki|baaki|liya|le|dile|ghetle|borrow|lent|gave|give|owes|unpaid|due|usne|usane|karja|thakbaki|उधार|दिया|दिए|बाकी|लिया|दिले|घेतले/i;
  if (isCreditRegex.test(t)) {
    return "credit";
  }

  return "credit"; // safe default
};

const preProcessScaleWords = (text) => {
  const multipliers = {
    hazaar: 1000, hazar: 1000,
    thousand: 1000, thousands: 1000,
    lakh: 100000, lakhs: 100000,
    crore: 10000000, crores: 10000000,
    sau: 100, hundred: 100, hundreds: 100
  };

  let cleanText = text.toLowerCase();
  const regex = /(\d+(?:\.\d+)?)\s*(hazaar|hazar|thousand|thousands|lakh|lakhs|crore|crores|sau|hundred|hundreds)\b/g;

  return cleanText.replace(regex, (match, numStr, scaleWord) => {
    const num = parseFloat(numStr);
    const scale = multipliers[scaleWord];
    return (num * scale).toString();
  });
};

const ruleBasedParse = (text) => {
  const processedText = preProcessScaleWords(text);
  const amount       = extractAmount(processedText);
  const customerName = extractCustomerName(processedText);
  const type         = detectType(processedText);
  let dueDate        = extractDueDate(processedText);

  // If transaction type is payment and no date is specified, automatically default to today
  if (type === "payment" && !dueDate) {
    dueDate = new Date().toISOString().split("T")[0];
  }

  // Confidence: base 0.60, add for each extracted field
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
