"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle, MessageCircle, Link, ArrowRight, Share2, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/apiClient";

const successTranslations = {
  en: {
    creditAdded: "Credit Added Successfully",
    expenseRecorded: "Expense Recorded",
    salesRecorded: "Sales Recorded",
    paymentRecorded: "Payment Recorded",
    successCreditMsg: "Successfully recorded ₹{amount} for {customer} in the business ledger.",
    successCashbookMsg: "Successfully recorded ₹{amount} for {customer} in the business Cashbook.",
    transactionCode: "Transaction Code",
    categoryNote: "Category / Note",
    customer: "Customer",
    amount: "Amount",
    type: "Type",
    dueDate: "Due Date",
    recordedOn: "Recorded On",
    note: "Note",
    typeCredit: "Give Credit",
    typePayment: "Get Payment",
    typeExpense: "Cash Out (Expense)",
    typeSales: "Cash In (Sales)",
    recordMore: "Record More Entries",
    goToDashboard: "Go to Dashboard",
    whatsappReminder: "WhatsApp reminder format",
    whatsappReceipt: "WhatsApp receipt format",
    paymentLink: "Payment link",
    copy: "Copy",
    copied: "Copied ✓",
    shareReceipt: "Share Receipt on WhatsApp",
    whatsappReminderTemplate: "*VoiceKhata Reminder*\n\n{customer}! 🙏 Your pending credit of ₹{amount} has been successfully recorded.\nNote: {note}\nDue Date: {dueDate}\n\nPay here: {link}\n\n*{shopName}*\nSupported by VoiceKhata",
    whatsappReceiptTemplate: "*Payment Confirmation*\n\nHello! You have successfully paid ₹{amount} to {shopName}.\nDate: {date}\n\nThank you! 🙏\n\n*{shopName}*\nSupported by VoiceKhata",
    whatsappReminderPreview: "\"{customer}! 🙏 Your pending credit of ₹{amount} has been recorded. Due date: {dueDate}. Pay here: pay.voicekhata.in/txn\"",
    whatsappReceiptPreview: "\"*Payment Confirmation* You have paid ₹{amount} to {shopName}. Date: {date}. Thank you! 🙏\"",
    cancelTransaction: "Cancel / Delete Transaction",
    cancelling: "Cancelling..."
  },
  hi: {
    creditAdded: "उधार सफलतापूर्वक जोड़ा गया",
    expenseRecorded: "खर्च सफलतापूर्वक दर्ज किया गया",
    salesRecorded: "बिक्री सफलतापूर्वक दर्ज की गई",
    paymentRecorded: "भुगतान सफलतापूर्वक दर्ज किया गया",
    successCreditMsg: "सफलतापूर्वक व्यापार लेजर में {customer} के लिए ₹{amount} दर्ज किया गया।",
    successCashbookMsg: "सफलतापूर्वक व्यापार कैशबुक में {customer} के लिए ₹{amount} दर्ज किया गया।",
    transactionCode: "लेन-देन कोड",
    categoryNote: "कैशबुक विवरण / श्रेणी",
    customer: "ग्राहक का नाम",
    amount: "राशि",
    type: "प्रकार",
    dueDate: "देय तिथि",
    recordedOn: "दर्ज किया गया",
    note: "टिप्पणी",
    typeCredit: "उधार दिया (Credit)",
    typePayment: "भुगतान लिया (Debit)",
    typeExpense: "खर्च (Cash Out)",
    typeSales: "कमाई (Cash In)",
    recordMore: "और एंट्री करो",
    goToDashboard: "डैशबोर्ड पर जाओ",
    whatsappReminder: "व्हाट्सएप रिमाइंडर प्रारूप",
    whatsappReceipt: "व्हाट्सएप रसीद प्रारूप",
    paymentLink: "भुगतान लिंक",
    copy: "कॉपी करें",
    copied: "कॉपी किया गया ✓",
    shareReceipt: "व्हाट्सएप पर रसीद साझा करें",
    whatsappReminderTemplate: "*VoiceKhata Reminder*\n\n{customer} जी! 🙏 आपका ₹{amount} का लंबित उधार सफलतापूर्वक दर्ज कर लिया गया है।\nविवरण: {note}\nदेय तिथि: {dueDate}\n\nयहाँ भुगतान करें: {link}\n\n*{shopName}*\nVoiceKhata द्वारा समर्थित",
    whatsappReceiptTemplate: "*भुगतान पुष्टि*\n\nआपने {shopName} को ₹{amount} का भुगतान सफलतापूर्वक किया है।\nदिनांक: {date}\n\nधन्यवाद! 🙏\n\n*{shopName}*\nVoiceKhata द्वारा समर्थित",
    whatsappReminderPreview: "\"{customer} जी! 🙏 आपका ₹{amount} का लंबित उधार दर्ज हो गया है। देय तिथि: {dueDate}। भुगतान लिंक: pay.voicekhata.in/txn\"",
    whatsappReceiptPreview: "\"*भुगतान पुष्टि* आपने {shopName} को ₹{amount} का भुगतान किया है। दिनांक: {date}। धन्यवाद! 🙏\"",
    cancelTransaction: "लेन-देन रद्द / हटाएं",
    cancelling: "रद्द किया जा रहा है..."
  },
  ta: {
    creditAdded: "கடன் வெற்றிகரமாக சேர்க்கப்பட்டது",
    expenseRecorded: "செலவு பதிவு செய்யப்பட்டது",
    salesRecorded: "விற்பனை பதிவு செய்யப்பட்டது",
    paymentRecorded: "கட்டணம் பதிவு செய்யப்பட்டது",
    successCreditMsg: "வணிகப் பேரேட்டில் {customer} க்கு ₹{amount} வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.",
    successCashbookMsg: "வணிகப் பணப்புத்தகத்தில் {customer} க்கு ₹{amount} வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.",
    transactionCode: "பரிவர்த்தனை குறியீடு",
    categoryNote: "குறிப்பு / வகை",
    customer: "வாடிக்கையாளர் பெயர்",
    amount: "தொகை",
    type: "வகை",
    dueDate: "தேதி வரம்பு",
    recordedOn: "பதிவு செய்யப்பட்டது",
    note: "குறிப்புகள்",
    typeCredit: "கடனளி (Credit)",
    typePayment: "பணம் வாங்கு (Debit)",
    typeExpense: "செலவு (Cash Out)",
    typeSales: "வரவு (Cash In)",
    recordMore: "மேலும் பதிவுசெய்",
    goToDashboard: "டாஷ்போர்டுக்குச் செல்",
    whatsappReminder: "வாட்ஸ்அப் நினைவூட்டல் வடிவம்",
    whatsappReceipt: "வாட்ஸ்அப் ரசீது வடிவம்",
    paymentLink: "கட்டண இணைப்பு",
    copy: "நகலெடு",
    copied: "நகலெடுக்கப்பட்டது ✓",
    shareReceipt: "வாட்ஸ்அப்பில் ரசீதைப் பகிரவும்",
    whatsappReminderTemplate: "*VoiceKhata நினைவூட்டல்*\n\n{customer} அவர்களே! 🙏 உங்கள் ₹{amount} நிலுவையில் உள்ள கடன் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.\nகுறிப்பு: {note}\nதேதி வரம்பு: {dueDate}\n\nஇங்கே செலுத்தவும்: {link}\n\n*{shopName}*\nVoiceKhata உதவியுடன்",
    whatsappReceiptTemplate: "*பணம் செலுத்தியதற்கான உறுதிப்படுத்தல்*\n\n{shopName} க்கு நீங்கள் வெற்றிகரமாக ₹{amount} செலுத்தியுள்ளீர்கள்.\nதேதி: {date}\n\nநன்றி! 🙏\n\n*{shopName}*\nVoiceKhata உதவியுடன்",
    whatsappReminderPreview: "\"{customer} அவர்களே! 🙏 உங்கள் ₹{amount} நிலுவைக் கடன் பதிவு செய்யப்பட்டது. தேதி: {dueDate}. இங்கே செலுத்தவும்: pay.voicekhata.in/txn\"",
    whatsappReceiptPreview: "\"*பணம் உறுதிப்படுத்தல்* {shopName} க்கு நீங்கள் ₹{amount} செலுத்தியுள்ளீர்கள். தேதி: {date}. நன்றி! 🙏\""
  },
  mr: {
    creditAdded: "उधार यशस्वीरित्या जोडले गेले",
    expenseRecorded: "खर्च नोंदवला गेला",
    salesRecorded: "विक्री नोंदवली गेली",
    paymentRecorded: "पेमेंट यशस्वीरित्या नोंदवले गेले",
    successCreditMsg: "व्यवसाय लेजरमध्ये {customer} साठी ₹{amount} यशस्वीरित्या नोंदवले गेले.",
    successCashbookMsg: "व्यवसाय कॅशबुकमध्ये {customer} साठी ₹{amount} यशस्वीरित्या नोंदवले गेले.",
    transactionCode: "व्यवहार कोड",
    categoryNote: "कॅशबुक नोंद / श्रेणी",
    customer: "ग्राहकाचे नाव",
    amount: "रक्कम",
    type: "प्रकार",
    dueDate: "देय तारीख",
    recordedOn: "नोंदणी तारीख",
    note: "टीप",
    typeCredit: "उधार दिला (Credit)",
    typePayment: "पेमेंट घेतला (Debit)",
    typeExpense: "खर्च (Cash Out)",
    typeSales: "जमा (Cash In)",
    recordMore: "आणखी नोंद करा",
    goToDashboard: "डॅशबोर्डवर जा",
    whatsappReminder: "व्हॉट्सॲप स्मरणपत्र",
    whatsappReceipt: "व्हॉट्सॲप रसीद",
    paymentLink: "पेमेंट लिंक",
    copy: "कॉपी करा",
    copied: "कॉपी केले ✓",
    shareReceipt: "व्हॉट्सॲपवर रसीद शेअर करा",
    whatsappReminderTemplate: "*VoiceKhata स्मरणपत्र*\n\n{customer} जी! 🙏 आपले ₹{amount} चे प्रलंबित उधार यशस्वीरित्या नोंदवले गेले आहे.\nटीप: {note}\nदेय तारीख: {dueDate}\n\nयेथे पेमेंट करा: {link}\n\n*{shopName}*\nVoiceKhata द्वारे समर्थित",
    whatsappReceiptTemplate: "*पेमेंट पावती*\n\nआपण {shopName} ला ₹{amount} चे पेमेंट यशस्वीरित्या केले आहे.\nतारीख: {date}\n\nधन्यवाद! 🙏\n\n*{shopName}*\nVoiceKhata द्वारे समर्थित",
    whatsappReminderPreview: "\"{customer} जी! 🙏 आपले ₹{amount} चे प्रलंबित उधार नोंदवले गेले आहे. देय तारीख: {dueDate}. येथे पेमेंट करा: pay.voicekhata.in/txn\"",
    whatsappReceiptPreview: "\"*पेमेंट पावती* आपण {shopName} ला ₹{amount} पेमेंट केले आहे. तारीख: {date}. धन्यवाद! 🙏\""
  },
  gu: {
    creditAdded: "ઉધાર સફળતાપૂર્વક ઉમેરવામાં આવ્યું",
    expenseRecorded: "ખર્ચ નોંધવામાં આવ્યો",
    salesRecorded: "વેચાણ નોંધવામાં આવ્યો",
    paymentRecorded: "ચુકવણી સફળતાપૂર્વક નોંધવામાં આવી",
    successCreditMsg: "ધંધાકીય ખાતાવહીમાં {customer} માટે ₹{amount} સફળતાપૂર્વક નોંધવામાં આવ્યા.",
    successCashbookMsg: "ધંધાકીય કેશબુકમાં {customer} માટે ₹{amount} સફળતાપૂર્વક નોંધવામાં આવ્યા.",
    transactionCode: "વ્યવહાર કોડ",
    categoryNote: "કેશબુક નોંધ / શ્રેણી",
    customer: "ગ્રાહકનું નામ",
    amount: "રકમ",
    type: "પ્રકાર",
    dueDate: "દેય તારીખ",
    recordedOn: "નોંધાયેલ",
    note: "નોંધ",
    typeCredit: "ઉધાર આપો (Credit)",
    typePayment: "ચુકવણી લો (Debit)",
    typeExpense: "ખર્ચ (Cash Out)",
    typeSales: "આવક (Cash In)",
    recordMore: "વધુ એન્ટ્રી કરો",
    goToDashboard: "ડેશબોર્ડ પર જાઓ",
    whatsappReminder: "વોટ્સએપ રીમાઇન્ડર ફોર્મેટ",
    whatsappReceipt: "વોટ્સએપ રસીદ ફોર્મેટ",
    paymentLink: "ચુકવણી લિંક",
    copy: "કોપી કરો",
    copied: "કોપી થયેલ ✓",
    shareReceipt: "વોટ્સએપ પર રસીદ શેર કરો",
    whatsappReminderTemplate: "*VoiceKhata રીમાઇન્ડર*\n\n{customer} જી! 🙏 તમારું ₹{amount} નું બાકી ઉધાર સફળતાપૂર્વક નોંધવામાં આવ્યું છે.\nનોંધ: {note}\nદેય તારીખ: {dueDate}\n\nઅહીં ચુકવણી કરો: {link}\n\n*{shopName}*\nVoiceKhata દ્વારા સમર્થિત",
    whatsappReceiptTemplate: "*ચુકવણી પુષ્ટિકરણ*\n\nતમે {shopName} ને ₹{amount} ની ચુકવણી સફળતાપૂર્વક કરી છે.\nતારીખ: {date}\n\nઆભાર! 🙏\n\n*{shopName}*\nVoiceKhata દ્વારા સમર્થિત",
    whatsappReminderPreview: "\"{customer} જી! 🙏 તમારું ₹{amount} નું બાકી ઉધાર નોંધવામાં આવ્યું છે. દેય તારીખ: {dueDate}. અહીં ચુકવણી કરો: pay.voicekhata.in/txn\"",
    whatsappReceiptPreview: "\"*ચુકવણી પુષ્ટિ* તમે {shopName} ને ₹{amount} ચૂકવ્યા છે. તારીખ: {date}. આભાર! 🙏\""
  },
  bho: {
    creditAdded: "उधार सफलतापूर्वक जोड़ल गइल",
    expenseRecorded: "खर्च सफलतापूर्वक दर्ज भइल",
    salesRecorded: "कमाई सफलतापूर्वक दर्ज भइल",
    paymentRecorded: "भुगतान सफलतापूर्वक दर्ज भइल",
    successCreditMsg: "लेजर में {customer} खातिर ₹{amount} सफलतापूर्वक दर्ज भइल बा।",
    successCashbookMsg: "कैशबुक में {customer} खातिर ₹{amount} सफलतापूर्वक दर्ज भइल बा।",
    transactionCode: "लेन-देने कोड",
    categoryNote: "कैशबुक विवरण / श्रेणी",
    customer: "ग्राहक का नाम",
    amount: "राशि",
    type: "प्रकार",
    dueDate: "देय तिथि",
    recordedOn: "दर्ज तिथि",
    note: "टिप्पणी",
    typeCredit: "उधार देहनी (Credit)",
    typePayment: "भुगतान लेहनी (Debit)",
    typeExpense: "खर्च (Cash Out)",
    typeSales: "कमाई (Cash In)",
    recordMore: "अउरी एंट्री करीं",
    goToDashboard: "डैशबोर्ड पर जाईं",
    whatsappReminder: "व्हाट्सएप रिमाइंडर फॉर्मेट",
    whatsappReceipt: "व्हाट्सएप रसीद फॉर्मेट",
    paymentLink: "भुगतान लिंक",
    copy: "कॉपी करीं",
    copied: "कॉपी भइल ✓",
    shareReceipt: "व्हाट्सएप पर रसीद साझा करीं",
    whatsappReminderTemplate: "*VoiceKhata रिमाइंडर*\n\n{customer} जी! 🙏 रउआ ₹{amount} के उधार सफलतापूर्वक दर्ज कइल गइल बा।\nविवरण: {note}\nदेय तिथि: {dueDate}\n\nइहाँ भुगतान करीं: {link}\n\n*{shopName}*\nVoiceKhata द्वारा समर्थित",
    whatsappReceiptTemplate: "*भुगतान पुष्टि*\n\nरउआ {shopName} के ₹{amount} के भुगतान सफलतापूर्वक कइले बानी।\nतारीख: {date}\n\nधन्यवाद! 🙏\n\n*{shopName}*\nVoiceKhata द्वारा समर्थित",
    whatsappReminderPreview: "\"{customer} जी! 🙏 रउआ ₹{amount} के लंबित उधार दर्ज हो गइल बा। देय तिथि: {dueDate}। भुगतान लिंक: pay.voicekhata.in/txn\"",
    whatsappReceiptPreview: "\"*भुगतान पुष्टि* रउआ {shopName} के ₹{amount} के भुगतान कइले बानी। तारीख: {date}। धन्यवाद! 🙏\""
  }
};

export default function SuccessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [txData, setTxData] = useState({
    customer: "Ramesh Yadav",
    amount: 2000,
    type: "credit",
    dueDate: "26 Jan 2025",
    note: "Kirana items",
    raw: "Ramesh ne aaj 2000 rupaye ka udhaar kiya kirana ke liye"
  });
  const [copied, setCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Load language settings dynamically from merchant configuration
  const userLang = user?.language || "en";
  const t = successTranslations[userLang] || successTranslations.en;

  useEffect(() => {
    // Read actual created entry details from localStorage
    const savedTx = localStorage.getItem('recent_transaction');
    if (savedTx) {
      try {
        setTxData(JSON.parse(savedTx));
      } catch (err) {
        console.error("Could not parse recent transaction payload");
      }
    }
  }, []);

  const handleCancel = async () => {
    if (!txData.id) return;
    
    const confirmCancel = window.confirm(
      userLang === "hi" 
        ? "क्या आप निश्चित रूप से इस लेन-देन को रद्द करना चाहते हैं?" 
        : "Are you sure you want to cancel and delete this transaction?"
    );
    if (!confirmCancel) return;

    setIsCancelling(true);
    setCancelError("");

    try {
      await apiClient.deleteEntry(txData.id);
      localStorage.removeItem('recent_transaction');
      alert(
        userLang === "hi"
          ? "लेन-देन सफलतापूर्वक रद्द कर दिया गया।"
          : "Transaction cancelled and deleted successfully."
      );
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to cancel transaction:", err);
      setCancelError(
        userLang === "hi"
          ? "लेन-देन रद्द करने में विफल: " + err.message
          : "Failed to cancel transaction: " + err.message
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopy = () => {
    const linkText = `pay.voicekhata.in/txn-${Math.floor(1000 + Math.random() * 9000)}`;
    navigator.clipboard.writeText(linkText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    let whatsappMsg = "";
    let shopName = "Yaksh Kirana Store";
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('merchant_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.shopName) shopName = parsed.shopName;
        } catch (e) {}
      }
    }

    const formattedAmount = txData.amount.toLocaleString();
    const linkText = `pay.voicekhata.in/txn-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateText = txData.dueDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const noteText = txData.note || "None";
    
    if (txData.type === 'credit') {
      whatsappMsg = formatText(t.whatsappReminderTemplate, {
        customer: txData.customer,
        amount: formattedAmount,
        note: noteText,
        dueDate: txData.dueDate || 'None',
        link: linkText,
        shopName: shopName
      });
    } else {
      whatsappMsg = formatText(t.whatsappReceiptTemplate, {
        amount: formattedAmount,
        shopName: shopName,
        date: dateText
      });
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, '_blank');
  };

  const isCredit = txData.type === 'credit';
  const isCashbookOut = txData.type === 'cashbook_out';
  const isCashbookIn = txData.type === 'cashbook_in';
  const isCashbook = isCashbookOut || isCashbookIn;

  let themeColorClass = "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-950/20 border-indigo-500/10 dark:border-indigo-900/30";
  if (isCashbookOut) {
    themeColorClass = "text-rose-600 dark:text-rose-400 bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/10 dark:border-rose-900/30";
  } else if (isCashbookIn || txData.type === 'payment') {
    themeColorClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/10 dark:border-emerald-900/30";
  }

  // Helper to resolve localized text strings with params
  const formatText = (template = "", vars = {}) => {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col items-center justify-between px-5 pt-16 pb-12 relative overflow-hidden transition-colors duration-200">
      {/* Precision ambient background orbs */}
      <div className={`absolute w-64 h-64 ${isCredit ? "bg-indigo-500/5" : isCashbookOut ? "bg-rose-500/5" : "bg-emerald-500/5"} rounded-full blur-[80px] -top-20 left-1/2 -translate-x-1/2 pointer-events-none`} />

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm">
        
        {/* Sleek verification checkmark badge */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="relative mb-6"
        >
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${themeColorClass} shadow-sm`}>
            <CheckCircle size={36} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight font-display mb-1.5">
            {isCredit ? t.creditAdded : isCashbookOut ? t.expenseRecorded : isCashbookIn ? t.salesRecorded : t.paymentRecorded}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed px-4">
            {isCashbook 
              ? formatText(t.successCashbookMsg, { amount: txData.amount.toLocaleString(), customer: txData.customer })
              : formatText(t.successCreditMsg, { amount: txData.amount.toLocaleString(), customer: txData.customer })}
          </p>
        </motion.div>

        {/* Clean Ledger Receipt Outline Box */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 p-4.5 mt-6 text-left shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
        >
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.transactionCode}</p>
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-350 mt-0.5">TXN-00{Math.floor(100 + Math.random() * 900)}</p>
            </div>
            <div className={`w-7 h-7 ${isCredit ? "bg-indigo-500/5 text-indigo-500" : isCashbookOut ? "bg-rose-500/5 text-rose-500" : "bg-emerald-500/5 text-emerald-500"} rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800`}>
              <CheckCircle size={14} />
            </div>
          </div>
          
          {[
            [isCashbook ? t.categoryNote : t.customer, txData.customer],
            [t.amount, `₹${txData.amount.toLocaleString()}`],
            [t.type, isCredit ? t.typeCredit : isCashbookOut ? t.typeExpense : isCashbookIn ? t.typeSales : t.typePayment],
            [isCredit ? t.dueDate : t.recordedOn, txData.dueDate || 'None'],
            [t.note, txData.note || 'None']
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-855/40 last:border-0">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{k}</span>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{v}</span>
            </div>
          ))}
        </motion.div>

        {/* Clean Receipt Notification Box */}
        {!isCashbook && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="w-full mt-4.5"
          >
            <div className={`border rounded-xl p-4 text-left ${isCredit ? "bg-indigo-500/5 border-indigo-500/10" : "bg-emerald-500/5 border-emerald-500/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={13} className={isCredit ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCredit ? "text-indigo-700 dark:text-indigo-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                  {isCredit ? t.whatsappReminder : t.whatsappReceipt}
                </span>
              </div>
              <p className={`text-xs leading-relaxed font-semibold ${isCredit ? "text-indigo-650 dark:text-indigo-350" : "text-emerald-650 dark:text-emerald-350"}`}>
                {isCredit
                  ? formatText(t.whatsappReminderPreview, { customer: txData.customer, amount: txData.amount.toLocaleString(), dueDate: txData.dueDate || 'None' })
                  : formatText(t.whatsappReceiptPreview, { amount: txData.amount.toLocaleString(), shopName: user?.shopName || 'Store', date: txData.dueDate || new Date().toLocaleDateString('en-IN') })
                }
              </p>
            </div>
          </motion.div>
        )}

        {/* Payment link & WhatsApp Share action button */}
        {!isCashbook && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.25 }}
            className="w-full mt-4 flex flex-col gap-2.5"
          >
            {isCredit && (
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <Link size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.paymentLink}</p>
                  <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 truncate mt-0.5">pay.voicekhata.in/txn-{Math.floor(1000 + Math.random() * 9000)}</p>
                </div>
                <button 
                  onClick={handleCopy} 
                  className="text-[9px] bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer outline-none focus:outline-none"
                >
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            )}

            <button 
              onClick={handleShareWhatsApp} 
              className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none focus:outline-none"
            >
              <Share2 size={13} /> {t.shareReceipt}
            </button>
          </motion.div>
        )}
      </div>

      {/* Primary bottom routing controls */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }} 
        className="w-full max-w-sm space-y-3 mt-6"
      >
        <button 
          onClick={() => router.push("/voice")}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none transition-colors"
        >
          {t.recordMore} <ArrowRight size={14} />
        </button>
        <button 
          onClick={() => router.push("/dashboard")}
          className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-855 text-slate-650 dark:text-slate-400 font-bold text-xs rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-all outline-none focus:outline-none"
        >
          {t.goToDashboard}
        </button>

        {cancelError && (
          <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider p-2.5 rounded-xl text-center">
            {cancelError}
          </div>
        )}

        {txData.id && (
          <button 
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 border border-rose-100/50 dark:border-rose-950/40 text-rose-550 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors outline-none focus:outline-none border-0"
          >
            {isCancelling ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-3.5 h-3.5 border-2 border-rose-500/20 border-t-rose-550 rounded-full" />
            ) : (
              <><Trash2 size={13} /> {t.cancelTransaction}</>
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
}
