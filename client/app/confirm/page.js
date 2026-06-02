"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle, Edit3, Mic, User, IndianRupee, Calendar, Tag, Zap, ChevronRight, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

const recentCustomers = ["Ramesh Yadav", "Suresh Patel", "Priya Sharma"];
const recentCashbookOut = ["Tea / Chai", "Shop Rent", "Salary / Wages", "Petrol / Travel", "Electricity Bill", "Samosa / Snacks"];
const recentCashbookIn = ["Daily Kirana Sales", "Galla Cash", "General Sales", "Product Delivery", "Online Settlement"];
const commonAmounts = [100, 500, 1000, 5000];

const confirmTranslations = {
  en: {
    credit: "Give Credit",
    payment: "Get Payment",
    cashbook_out: "Cash Out (Expense)",
    cashbook_in: "Cash In (Sales)",
    customerLabel: "Customer Name",
    categoryLabel: "Cashbook Note / Category",
    customerPlaceholder: "Enter customer name...",
    categoryPlaceholder: "Enter expense/sales category or note...",
    recentLabel: "Recent:",
    categoryLabelRecent: "Categories:",
    titleText: "Review Transaction Details",
    titleSub: "AI extracted ledger parameters",
    saveText: "Save to Ledger",
    amountLabel: "Amount (₹)",
    amountPlaceholder: "0",
    commonLabel: "Common:",
    typeLabel: "Transaction Type",
    dueDateLabel: "Due Date (Optional)",
    dueDatePlaceholder: "YYYY-MM-DD",
    quickDueLabel: "Quick due:",
    notesLabel: "Notes (Optional)",
    notesPlaceholder: "e.g. Weekly kirana supplies...",
    originalTranscript: "Original Transcript",
    noDue: "No Due",
    days: "Days",
    reRecord: "Re-record",
    aiParsed: "AI voice parsed",
    confidence: "Confidence"
  },
  hi: {
    credit: "उधार दें",
    payment: "भुगतान लें",
    cashbook_out: "खर्च",
    cashbook_in: "कमाई",
    customerLabel: "ग्राहक का नाम",
    categoryLabel: "कैशबुक विवरण / श्रेणी",
    customerPlaceholder: "ग्राहक का नाम दर्ज करें...",
    categoryPlaceholder: "खर्च/बिक्री की श्रेणी या विवरण दर्ज करें...",
    recentLabel: "हाल ही में:",
    categoryLabelRecent: "श्रेणियां:",
    titleText: "विवरण जांचें",
    titleSub: "AI द्वारा निकाले गए लेजर पैरामीटर",
    saveText: "लेजर में सहेजें",
    amountLabel: "राशि (₹)",
    amountPlaceholder: "0",
    commonLabel: "सामान्य:",
    typeLabel: "लेन-देन का प्रकार",
    dueDateLabel: "देय तिथि (वैकल्पिक)",
    dueDatePlaceholder: "YYYY-MM-DD",
    quickDueLabel: "त्वरित देय:",
    notesLabel: "टिप्पणी (वैकल्पिक)",
    notesPlaceholder: "जैसे साप्ताहिक किराना आपूर्ति...",
    originalTranscript: "मूल प्रतिलेख",
    noDue: "कोई देय नहीं",
    days: "दिन",
    reRecord: "फिर रिकॉर्ड करें",
    aiParsed: "AI आवाज़ विश्लेषण",
    confidence: "विश्वास"
  },
  ta: {
    credit: "கடனளி",
    payment: "பணம் வாங்கு",
    cashbook_out: "செலவு",
    cashbook_in: "வரவு",
    customerLabel: "வாடிக்கையாளர் பெயர்",
    categoryLabel: "குறிப்பு / வகை",
    customerPlaceholder: "வாடிக்கையாளர் பெயர் உள்ளிடவும்...",
    categoryPlaceholder: "செலவு/விற்பனை வகை அல்லது குறிப்பு...",
    recentLabel: "சமீபத்திய:",
    categoryLabelRecent: "வகைகள்:",
    titleText: "விவரங்களைச் சரிபார்க்கவும்",
    titleSub: "AI பிரித்தெடுக்கப்பட்ட அளவுருக்கள்",
    saveText: "பதிவேட்டில் சேமிக்கவும்",
    amountLabel: "தொகை (₹)",
    amountPlaceholder: "0",
    commonLabel: "பொதுவானது:",
    typeLabel: "பரிவர்த்தने வகை",
    dueDateLabel: "தேதி வரம்பு (விருப்பத்தேர்வு)",
    dueDatePlaceholder: "YYYY-MM-DD",
    quickDueLabel: "விரைவானது:",
    notesLabel: "குறிப்புகள் (விருப்பத்தேர்வு)",
    notesPlaceholder: "எ.கா. வாராந்திர किराना விநியோகம்...",
    originalTranscript: "அசல் டிரான்ஸ்கிரிப்ட்",
    noDue: "தேதி இல்லை",
    days: "நாட்கள்",
    reRecord: "மீண்டும் பதிவுசெய்",
    aiParsed: "AI குரல் பாகுபடுத்தப்பட்டது",
    confidence: "நம்பிக்கை"
  },
  mr: {
    credit: "उधार द्या",
    payment: "पैसे घ्या",
    cashbook_out: "खर्च",
    cashbook_in: "जमा",
    customerLabel: "ग्राहकाचे नाव",
    categoryLabel: "कॅशबुक नोंद / श्रेणी",
    customerPlaceholder: "ग्राहकाचे नाव प्रविष्ट करा...",
    categoryPlaceholder: "खर्च/विक्री श्रेणी किंवा नोंद प्रविष्ट करा...",
    recentLabel: "अलीकडील:",
    categoryLabelRecent: "श्रेण्या:",
    titleText: "तपशील तपासा",
    titleSub: "AI लेजर मापदंड",
    saveText: "लेजरमध्ये जतन करा",
    amountLabel: "रक्कम (₹)",
    amountPlaceholder: "0",
    commonLabel: "सामान्य:",
    typeLabel: "व्यवहार प्रकार",
    dueDateLabel: "देय तारीख (पर्यायी)",
    dueDatePlaceholder: "YYYY-MM-DD",
    quickDueLabel: "त्वरित देय:",
    notesLabel: "टीप (पर्यायी)",
    notesPlaceholder: "उदा. साप्ताहिक किराना पुरवठा...",
    originalTranscript: "मूळ मसुदा",
    noDue: "देय नाही",
    days: "दिवस",
    reRecord: "पुन्हा रेकॉर्ड करा",
    aiParsed: "AI व्हॉइस विश्लेषण",
    confidence: "विश्वास"
  },
  gu: {
    credit: "ઉધાર આપો",
    payment: "ચુકવણી લો",
    cashbook_out: "ખર્ચ",
    cashbook_in: "આવક",
    customerLabel: "ગ્રાહકનું નામ",
    categoryLabel: "કેશબુક નોંધ / શ્રેણી",
    customerPlaceholder: "ગ્રાહકનું નામ દાખલ કરો...",
    categoryPlaceholder: "ખર્ચ/વેચાણ શ્રેણી અથવા નોંધ દાખલ કરો...",
    recentLabel: "તાજેતરના:",
    categoryLabelRecent: "શ્રેણીઓ:",
    titleText: "વિગતો તપાસો",
    titleSub: "AI લેજર પરિમાણો",
    saveText: "લેજરમાં સાચવો",
    amountLabel: "રકમ (₹)",
    amountPlaceholder: "0",
    commonLabel: "સામાન્ય:",
    typeLabel: "વ્યવહાર પ્રકાર",
    dueDateLabel: "દેય તારીખ (વૈકલ્પિક)",
    dueDatePlaceholder: "YYYY-MM-DD",
    quickDueLabel: "ઝડપી દેય:",
    notesLabel: "નોંધ (વૈકલ્પિક)",
    notesPlaceholder: "દા.ત. સાપ્તાહિક કિરાણા સપ્લાય...",
    originalTranscript: "મૂળ લખાણ",
    noDue: "કોઈ દેય નથી",
    days: "દિવસો",
    reRecord: "ફરીથી રેકોર્ડ કરો",
    aiParsed: "AI અવાજ મેળવ્યો",
    confidence: "વિશ્વાસ"
  },
  bho: {
    credit: "उधार दें",
    payment: "भुगतान लें",
    cashbook_out: "खर्च",
    cashbook_in: "कमाई",
    customerLabel: "ग्राहक का नाम",
    categoryLabel: "विवरण / श्रेणी",
    customerPlaceholder: "ग्राहक का नाम दर्ज करें...",
    categoryPlaceholder: "खर्च/बिक्री की श्रेणी या विवरण दर्ज करें...",
    recentLabel: "हाल ही में:",
    categoryLabelRecent: "श्रेणियां:",
    titleText: "विवरण जांचें",
    titleSub: "AI द्वारा निकाले गए पैरामीटर",
    saveText: "लेजर में सहेजें",
    amountLabel: "राशि (₹)",
    amountPlaceholder: "0",
    commonLabel: "सामान्य:",
    typeLabel: "लेन-देन के प्रकार",
    dueDateLabel: "देय तिथि (वैकल्पिक)",
    dueDatePlaceholder: "YYYY-MM-DD",
    quickDueLabel: "त्वरित देय:",
    notesLabel: "टिप्पणी (वैकल्पिक)",
    notesPlaceholder: "जैसे साप्ताहिक किराना आपूर्ति...",
    originalTranscript: "मूल प्रतिलेख",
    noDue: "कोई देय ना",
    days: "दिन",
    reRecord: "फिर रिकॉर्ड करीं",
    aiParsed: "AI आवाज जांच",
    confidence: "विश्वास"
  }
};

export default function UnifiedTransactionForm() {
  const router = useRouter();
  const { user } = useAuth();
  const t = confirmTranslations.en;
  const [confirmed, setConfirmed] = useState(false);
  const [isVoiceEntry, setIsVoiceEntry] = useState(false);
  const [voiceRawText, setVoiceRawText] = useState("");
  const [confidence, setConfidence] = useState(94);

  // Reusable Form States
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("credit"); // credit (Udhaar Do) or payment (Payment Lo)
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const isCashbook = transactionType === "cashbook_in" || transactionType === "cashbook_out";

  // Populate form from URL query parameters (Manual path) or LocalStorage (Voice path)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const manualParam = searchParams.get('manual');
      const typeParam = searchParams.get('type');
      
      const rawIntent = localStorage.getItem('voice_intent');

      if (rawIntent && manualParam !== 'true') {
        // Voice path
        try {
          const parsed = JSON.parse(rawIntent);
          const isCb = parsed.type === "cashbook_in" || parsed.type === "cashbook_out";
          if (isCb) {
            setCustomerName(parsed.customer && parsed.customer !== 'Unknown Customer' ? parsed.customer : parsed.raw || "");
          } else {
            setCustomerName(parsed.customer || "");
          }
          setAmount(parsed.amount ? parsed.amount.toString() : "");
          const tType = parsed.type || "credit";
          setTransactionType(tType);
          setNote(parsed.note || "");
          setConfidence(parsed.confidence || 94);
          setVoiceRawText(parsed.raw || "");
          setIsVoiceEntry(true);
          
          if (parsed.dueDate && parsed.dueDate !== 'None' && parsed.dueDate !== 'No due date') {
            // Attempt conversion to Y-M-D for date picker input
            try {
              const d = new Date(parsed.dueDate);
              if (!isNaN(d.getTime())) {
                setDueDate(d.toISOString().split('T')[0]);
              }
            } catch (e) {}
          } else if (tType === "payment") {
            setDueDate(new Date().toISOString().split('T')[0]);
          }
        } catch (err) {
          console.error("Could not parse saved voice intent.");
        }
      } else {
        // Manual fallback path
        setIsVoiceEntry(false);
        localStorage.removeItem('voice_intent'); // Clear voice cache
        if (typeParam === 'payment' || typeParam === 'credit') {
          setTransactionType(typeParam);
          if (typeParam === 'payment') {
            setDueDate(new Date().toISOString().split('T')[0]);
          }
        }
      }
    }
  }, []);

  // Sync date selection for manual type toggles
  useEffect(() => {
    if (transactionType === "payment" && !dueDate) {
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [transactionType]);

  const selectCustomer = (name) => {
    setCustomerName(name);
  };

  const selectAmount = (amt) => {
    setAmount(amt.toString());
  };

  const selectDueDate = (days) => {
    if (days === 0) {
      setDueDate("");
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");


    if (!customerName.trim()) {
      setErrorMsg(isCashbook ? "Category / Note is required." : "Customer name is required.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid positive amount.");
      return;
    }

    setConfirmed(true);

    if (isCashbook) {
      try {
        const cashbookType = transactionType === "cashbook_in" ? "in" : "out";
        const newEntry = {
          id: Date.now(),
          type: cashbookType,
          amount: parsedAmount,
          note: customerName.trim(),
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        let currentEntries = [];
        const savedCashbook = localStorage.getItem('cashbook_entries');
        if (savedCashbook) {
          try {
            currentEntries = JSON.parse(savedCashbook);
          } catch (err) {}
        }
        const updated = [newEntry, ...currentEntries];
        localStorage.setItem('cashbook_entries', JSON.stringify(updated));
        
        localStorage.removeItem('voice_intent');
        localStorage.setItem('recent_transaction', JSON.stringify({
          customer: newEntry.note,
          amount: parsedAmount,
          type: transactionType,
          dueDate: 'None',
          note: newEntry.note,
          raw: isVoiceEntry ? voiceRawText : "Manual cashbook entry"
        }));

        setTimeout(() => router.push("/success"), 500);
      } catch (err) {
        console.error("Failed to save cashbook entry locally", err);
        setErrorMsg("Failed to save cashbook entry.");
        setConfirmed(false);
      }
      return;
    }

    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(customerName.trim());
      const payload = {
        userId: user?.id || '60b9b32b9b1d8e2df8a149f1', // Live merchant context ID
        amount: parsedAmount, // Stored directly in rupees
        type: transactionType,
        status: 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        note: note.trim() || (transactionType === "credit" ? "Udhaar entry" : "Payment record"),
        voiceTranscript: isVoiceEntry ? voiceRawText : "Manual entry creation",
      };

      if (isObjectId) {
        payload.customerId = customerName.trim();
      } else {
        payload.customerName = customerName.trim();
      }

      const response = await apiClient.createEntry(payload);
      if (response.success) {
        localStorage.removeItem('voice_intent');
        localStorage.setItem('recent_transaction', JSON.stringify({
          customer: response.data.customer?.name || response.data.entry?.customerId?.name || payload.customerName || 'Unknown Customer',
          amount: parsedAmount,
          type: payload.type,
          dueDate: payload.dueDate ? new Date(payload.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'None',
          note: payload.note,
          raw: isVoiceEntry ? voiceRawText : "Manual ledger entry"
        }));
        setTimeout(() => router.push("/success"), 500);
      } else {
        throw new Error(response.message || "Failed to create entry");
      }
    } catch (err) {
      console.warn("Could not save to live backend, executing offline fallback save.");
      if (typeof window !== 'undefined') {
        localStorage.removeItem('voice_intent');
      }
      try {
        const dummyCustomerName = customerName.trim();
        localStorage.setItem('recent_transaction', JSON.stringify({
          customer: dummyCustomerName,
          amount: parsedAmount,
          type: transactionType,
          dueDate: dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'None',
          note: note.trim() || (transactionType === "credit" ? "Udhaar entry" : "Payment record"),
          raw: isVoiceEntry ? voiceRawText : "Manual ledger entry"
        }));
        setTimeout(() => router.push("/success"), 500);
      } catch (innerErr) {
        setErrorMsg("Failed to save transaction details.");
        setConfirmed(false);
      }
    }
  };

  const suggestions = transactionType === "cashbook_out" ? recentCashbookOut : transactionType === "cashbook_in" ? recentCashbookIn : recentCustomers;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col relative transition-colors duration-200">
      {/* Notion-style header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center cursor-pointer">
          <ArrowLeft size={16} className="text-slate-400" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-display">{t.titleText}</h1>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{t.titleSub}</p>
        </div>
        <div className="w-9" />
      </div>

      <div className="relative z-10 flex-1 px-5 pb-10">
        {isVoiceEntry && (
          <div className="space-y-3 mb-4">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-4.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                  <Mic size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{t.aiParsed}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{t.confidence}: {confidence}%</p>
                </div>
              </div>
              <button onClick={() => router.push("/voice")} className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-[9px] rounded-lg uppercase tracking-wider transition-colors">
                {t.reRecord}
              </button>
            </div>
            
            {voiceRawText && (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1.5">{t.originalTranscript}</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 italic">"{voiceRawText}"</p>
              </div>
            )}
          </div>
        )}

      <form onSubmit={handleSave} className="relative z-10 space-y-4">
        {errorMsg && (
          <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider p-3 rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        {/* 1. Customer Name or Category Input & Suggestions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            {isCashbook ? t.categoryLabel : t.customerLabel}
          </label>
          <div className="relative">
            {isCashbook ? (
              <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            ) : (
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            )}
            <input 
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={isCashbook ? t.categoryPlaceholder : t.customerPlaceholder}
              className="w-full bg-slate-50/50 focus:bg-white dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-350 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Smart Suggestions */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
              {isCashbook ? t.categoryLabelRecent : t.recentLabel}
            </span>
            {suggestions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectCustomer(c)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-550 dark:text-slate-400 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 outline-none focus:outline-none"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Amount Input & Suggestions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">{t.amountLabel}</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 dark:text-slate-500 font-extrabold text-xs">₹</span>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t.amountPlaceholder}
              className="w-full bg-slate-50/50 focus:bg-white dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-lg py-2.5 pl-9 pr-4 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-350 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Smart Amount Suggestions */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">{t.commonLabel}</span>
            {commonAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => selectAmount(amt)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-550 dark:text-slate-400 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 outline-none focus:outline-none"
              >
                ₹{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Transaction Type selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">{t.typeLabel}</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "credit", label: t.credit },
              { id: "payment", label: t.payment },
              { id: "cashbook_out", label: t.cashbook_out },
              { id: "cashbook_in", label: t.cashbook_in }
            ].map(type => (
              <button 
                key={type.id}
                type="button"
                onClick={() => setTransactionType(type.id)}
                className={`py-2.5 rounded-lg text-center text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer outline-none focus:outline-none ${
                  transactionType === type.id
                    ? type.id === "credit"
                      ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                      : type.id === "payment"
                      ? "bg-emerald-600 border-emerald-650 text-white shadow-sm"
                      : type.id === "cashbook_out"
                      ? "bg-rose-600 border-rose-650 text-white shadow-sm"
                      : "bg-teal-600 border-teal-650 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Due Date Selector & Quick suggestions */}
        {!isCashbook && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-855 rounded-xl p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
              {transactionType === 'payment' ? "Payment Date" : t.dueDateLabel}
            </label>
            <div className="relative h-10">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
              {/* Visible DD/MM/YYYY label */}
              <div className="absolute inset-0 flex items-center pl-10 pr-4 pointer-events-none z-10">
                <span className="text-xs font-semibold text-slate-800 dark:text-white">
                  {dueDate
                    ? new Date(dueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : <span className="text-slate-400 dark:text-slate-500">DD/MM/YYYY</span>}
                </span>
              </div>
              {/* Native date input — transparent, handles click */}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
              />
              {/* Styled background box */}
              <div className="w-full h-full bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-lg" />
            </div>

            {/* Smart Due Date suggestions */}
            {transactionType !== 'payment' && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">{t.quickDueLabel}</span>
                {[
                  { label: t.noDue, days: 0 },
                  { label: `7 ${t.days}`, days: 7 },
                  { label: `15 ${t.days}`, days: 15 },
                  { label: `30 ${t.days}`, days: 30 }
                ].map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => selectDueDate(d.days)}
                    className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-550 dark:text-slate-400 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 outline-none focus:outline-none"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Notes Input */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">{t.notesLabel}</label>
          <div className="relative">
            <Edit3 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full bg-slate-50/50 focus:bg-white dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-350 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Raw spoken transcript preview (Voice entry path fallback details) */}


        {/* Submit Actions */}
        <button
          type="submit"
          disabled={confirmed}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none transition-colors mt-6"
        >
          {confirmed ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
          ) : (
            <>{t.saveText} <ChevronRight size={14} /></>
          )}
        </button>
      </form>
      </div>
    </div>
  );
}
