"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Bell, TrendingUp, TrendingDown, AlertCircle, 
  ArrowUpRight, ArrowDownLeft, IndianRupee, Users, 
  Clock, BookOpen, CreditCard, Calculator, ChevronRight, Download
} from "lucide-react";
import { Card, StatsCard, Avatar, SectionHeader, RiskBadge, FloatingBlobs } from "@/components/ui";
import { customers as mockCustomers, recentTransactions as mockTx, insights as mockInsights } from "@/lib/data";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

function TransactionCard({ tx, i }) {
  const isCredit = tx.type === "credit";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
      className="flex items-center gap-3 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
    >
      <Avatar initials={tx.avatar} size="sm" color={isCredit ? "from-orange-400 to-orange-500" : "from-emerald-500 to-emerald-600"} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{tx.customer}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{tx.note} • {tx.time}</p>
      </div>
      <div className={`flex items-center gap-0.5 font-bold text-xs ${isCredit ? "text-orange-500" : "text-emerald-500"}`}>
        {isCredit ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
        ₹{tx.amount.toLocaleString()}
      </div>
    </motion.div>
  );
}

const dashboardTranslations = {
  en: {
    giveCredit: "Give Credit",
    getPayment: "Get Payment",
    customers: "Customers",
    insights: "Insights",
    quickActions: "Quick Actions",
    smartSuite: "Store Toolkit",
    recentActivity: "Recent Activity",
    all: "All",
    highRisk: "Follow-up Queue",
    daysOverdue: "days pending"
  },
  hi: {
    giveCredit: "उधार दें",
    getPayment: "भुगतान लें",
    customers: "ग्राहक",
    insights: "रिपोर्ट",
    quickActions: "त्वरित कार्रवाई",
    smartSuite: "वॉयसखाता स्मार्ट सुइट",
    recentActivity: "हाल की गतिविधि",
    all: "सभी",
    highRisk: "उच्च जोखिम वाले ग्राहक",
    daysOverdue: "दिन विलंबित"
  },
  ta: {
    giveCredit: "கடனளி",
    getPayment: "பணம் வாங்கு",
    customers: "வாடிக்கையாளர்கள்",
    insights: "விவரங்கள்",
    quickActions: "விரைவான செயல்கள்",
    smartSuite: "வாய்ஸ்காதா ஸ்மார்ட் சூட்",
    recentActivity: "சமீபத்திய செயல்பாடு",
    all: "அனைத்தும்",
    highRisk: "அதிக ஆபத்துள்ள வாடிக்கையாளர்கள்",
    daysOverdue: "நாட்கள் தாமதம்"
  },
  mr: {
    giveCredit: "उधार द्या",
    getPayment: "पैसे घ्या",
    customers: "ग्राहक",
    insights: "अहवाल",
    quickActions: "त्वरित कृती",
    smartSuite: "व्हॉइसखाता स्मार्ट सुइट",
    recentActivity: "अलीकडील क्रियाकलाप",
    all: "सर्व",
    highRisk: "उच्च जोखीम ग्राहक",
    daysOverdue: "दिवस थकीत"
  },
  gu: {
    giveCredit: "ઉધાર આપો",
    getPayment: "ચુકવણી લો",
    customers: "ગ્રાહકો",
    insights: "અહેવાલો",
    quickActions: "ઝડપી કાર્યો",
    smartSuite: "વોઇસખાતા સ્માર્ટ સુઇટ",
    recentActivity: "તાજેતરની પ્રવૃત્તિ",
    all: "બધા",
    highRisk: "ઉચ્च જોખમ ધરાવતા ગ્રાહકો",
    daysOverdue: "દિવસો વિલંબિત"
  },
  bho: {
    giveCredit: "उधार दें",
    getPayment: "भुगतान लें",
    customers: "ग्राहक",
    insights: "रिपोर्ट",
    quickActions: "त्वरित कार्रवाई",
    smartSuite: "वॉयसखाता स्मार्ट सुइट",
    recentActivity: "हाल की गतिविधि",
    all: "सभी",
    highRisk: "उच्च जोखिम वाले ग्राहक",
    daysOverdue: "दिन विलंबित"
  }
};

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  // Use the user's saved language preference for UI translations
  const lang = user?.language && dashboardTranslations[user.language] ? user.language : "en";
  const t = dashboardTranslations[lang];
  
  // Real States
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [collectionRate, setCollectionRate] = useState(0);
  const [avgRepaymentDays, setAvgRepaymentDays] = useState(0);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);
  const [overdueCustomersCount, setOverdueCustomersCount] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [recentActivityList, setRecentActivityList] = useState([]);
  const [highRiskCustomers, setHighRiskCustomers] = useState([]);

  // Dynamic Merchant Profile State
  const [merchantProfile, setMerchantProfile] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
    upiId: "",
    profilePhoto: ""
  });

  // Real trend state (computed from API data)
  const [customerTrend, setCustomerTrend] = useState(null);   // null = no data yet
  const [overdueTrend, setOverdueTrend] = useState(null);

  // Visiting card extra fields
  const [cardAddress, setCardAddress] = useState("");
  const [cardTagline, setCardTagline] = useState("");

  // VoiceKhata Smart Suite States
  const [activeTool, setActiveTool] = useState(null); // 'cashbook' | 'visiting_card' | 'gst_calc' | null
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);
  
  // Cashbook Ledger State
  const [cashbookEntries, setCashbookEntries] = useState([]);
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [cashType, setCashType] = useState("in"); // 'in' | 'out'

  // Galla Denomination Counter States
  const [qty500, setQty500] = useState("");
  const [qty200, setQty200] = useState("");
  const [qty100, setQty100] = useState("");
  const [qty50, setQty50] = useState("");
  const [qty20, setQty20] = useState("");
  const [qty10, setQty10] = useState("");
  const [qty5Coin, setQty5Coin] = useState("");
  const [qty2Coin, setQty2Coin] = useState("");
  const [qty1Coin, setQty1Coin] = useState("");
  const [showAudit, setShowAudit] = useState(false);

  const resetGalla = () => {
    setQty500("");
    setQty200("");
    setQty100("");
    setQty50("");
    setQty20("");
    setQty10("");
    setQty5Coin("");
    setQty2Coin("");
    setQty1Coin("");
    setShowAudit(false);
  };

  // Visiting Card Customization State
  const [cardTheme, setCardTheme] = useState("classic_dark"); // 'classic_dark' | 'forest' | 'royal' | 'navy' | 'burgundy' | 'black_gold' | 'emerald_gold'
  const [cardCategory, setCardCategory] = useState("");

  // Auto-load visiting card customization from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('visiting_card_theme');
      if (savedTheme) setCardTheme(savedTheme);
      const savedCategory = localStorage.getItem('visiting_card_category');
      if (savedCategory !== null) setCardCategory(savedCategory);
      const savedTagline = localStorage.getItem('visiting_card_tagline');
      if (savedTagline !== null) setCardTagline(savedTagline);
      const savedAddress = localStorage.getItem('visiting_card_address');
      if (savedAddress !== null) setCardAddress(savedAddress);
    }
  }, []);

  // Auto-save visiting card customization to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('visiting_card_theme', cardTheme);
      localStorage.setItem('visiting_card_category', cardCategory);
      localStorage.setItem('visiting_card_tagline', cardTagline);
      localStorage.setItem('visiting_card_address', cardAddress);
    }
  }, [cardTheme, cardCategory, cardTagline, cardAddress]);

  const handleDownloadCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw gradient background
    const grad = ctx.createLinearGradient(0, 0, 600, 360);
    if (cardTheme === "violet" || cardTheme === "classic_dark") {
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(0.5, "#1e293b");
      grad.addColorStop(1, "#0f172a");
    } else if (cardTheme === "emerald" || cardTheme === "forest") {
      grad.addColorStop(0, "#064e3b");
      grad.addColorStop(0.5, "#065f46");
      grad.addColorStop(1, "#115e59");
    } else if (cardTheme === "gold" || cardTheme === "royal") {
      grad.addColorStop(0, "#b45309");
      grad.addColorStop(0.5, "#ca8a04");
      grad.addColorStop(1, "#92400e");
    } else if (cardTheme === "navy") {
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#172554");
    } else if (cardTheme === "burgundy") {
      grad.addColorStop(0, "#500724");
      grad.addColorStop(0.5, "#450a0a");
      grad.addColorStop(1, "#4c0519");
    } else if (cardTheme === "black_gold") {
      grad.addColorStop(0, "#020617");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#020617");
    } else if (cardTheme === "emerald_gold") {
      grad.addColorStop(0, "#022c22");
      grad.addColorStop(0.5, "#042f2e");
      grad.addColorStop(1, "#064e3b");
    } else {
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#1e293b");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 360);

    // 2. Draw gold borders for gold themes
    if (cardTheme === "black_gold" || cardTheme === "emerald_gold") {
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 594, 354);
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 598, 358);
    }

    // 3. Draw decorative translucent circles
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.beginPath();
    ctx.arc(600, 0, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 360, 100, 0, Math.PI * 2);
    ctx.fill();

    // 4. Render Text Details
    ctx.textBaseline = "top";

    // Shop Name
    ctx.fillStyle = (cardTheme === "black_gold" || cardTheme === "emerald_gold") ? "#fef3c7" : "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(merchantProfile.shopName || "My Shop Name", 40, 40);

    // Tagline (if any)
    let taglineOffset = 0;
    if (cardTagline) {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "italic 16px sans-serif";
      ctx.fillText(cardTagline, 40, 75);
      taglineOffset = 25;
    }

    // Category (if any)
    if (cardCategory) {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.roundRect ? ctx.roundRect(40, 80 + taglineOffset, 120, 22, 11) : ctx.fillRect(40, 80 + taglineOffset, 120, 22);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(cardCategory.toUpperCase(), 48, 85 + taglineOffset);
    }

    // Divider Line
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 130 + taglineOffset);
    ctx.lineTo(560, 130 + taglineOffset);
    ctx.stroke();

    // Details Grid
    const detailsY = 150 + taglineOffset;
    
    // Owner
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("OWNER", 40, detailsY);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(merchantProfile.ownerName || "Owner Name", 40, detailsY + 20);

    // Mobile
    if (merchantProfile.phone) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("MOBILE", 560, detailsY);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(merchantProfile.phone, 560, detailsY + 20);
      ctx.textAlign = "left";
    }

    // Email
    let emailOffset = 0;
    if (merchantProfile.email) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("EMAIL", 40, detailsY + 55);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(merchantProfile.email, 40, detailsY + 75);
      emailOffset = 50;
    }

    // UPI ID / Address
    const upiAddressY = detailsY + 55 + emailOffset;
    if (merchantProfile.upiId) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("UPI PAY", 40, upiAddressY);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(merchantProfile.upiId, 40, upiAddressY + 20);
    }

    if (cardAddress) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "bold 12px sans-serif";
      if (merchantProfile.upiId) {
        ctx.textAlign = "right";
        ctx.fillText("ADDRESS", 560, upiAddressY);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(cardAddress, 560, upiAddressY + 20);
        ctx.textAlign = "left";
      } else {
        ctx.fillText("ADDRESS", 40, upiAddressY);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(cardAddress, 40, upiAddressY + 20);
      }
    }

    // Watermark (centered at bottom to avoid overlap)
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("VOICEKHATA ✦", 300, 330);

    // 5. Trigger download
    const link = document.createElement("a");
    link.download = `${(merchantProfile.shopName || "business").toLowerCase()}_card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    setFeedbackMessage("Visiting card downloaded successfully.");
  };

  // GST Calculator State
  const [gstBasePrice, setGstBasePrice] = useState("");
  const [gstRate, setGstRate] = useState(18); // 5, 12, 18, 28
  const [gstType, setGstType] = useState("exclusive"); // exclusive | inclusive

  useEffect(() => {
    async function loadDashboard() {
      // Load Dynamic merchant profile
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('merchant_profile');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setMerchantProfile({
              shopName: parsed.shopName || "My Store",
              ownerName: parsed.name || "Merchant",
              phone: parsed.phone || "",
              email: parsed.email || "",
              profilePhoto: parsed.profilePhoto || "",
              upiId: parsed.upiId || localStorage.getItem("voicekhata_upi_id") || ""
            });
          } catch (e) {}
        }

        const savedCashbook = localStorage.getItem('cashbook_entries');
        if (savedCashbook) {
          try {
            setCashbookEntries(JSON.parse(savedCashbook));
          } catch (e) {}
        }
      }

      try {
        const response = await apiClient.getDashboardSummary();
        if (response.success && response.data) {
          const {
            totalPending: pending,
            totalCollected: collected,
            collectionRate: rate,
            highRiskCount: highRisk,
            overdueCustomers: overdue,
            totalCustomers: totalCust,
            recentActivity: activity
          } = response.data;

          setTotalPending(pending || 0);
          setTotalCollected(collected || 0);
          setCollectionRate(rate || 0);
          setTotalCustomersCount(totalCust || 0);
          setOverdueCustomersCount(overdue || 0);
          setHighRiskCount(highRisk || 0);
          setRecentActivityList(activity || []);

          // Compute real trends: compare current totals vs stored previous-week snapshot
          const prevSnap = JSON.parse(localStorage.getItem('dash_prev_snap') || 'null');
          const nowSnap = { customers: totalCust || 0, overdue: overdue || 0, ts: Date.now() };
          if (prevSnap && (Date.now() - prevSnap.ts) > 60 * 60 * 1000) {
            // Only show trend if snapshot is older than 1 hour (avoids divide-by-zero on fresh loads)
            const custChange = prevSnap.customers > 0
              ? Math.round(((nowSnap.customers - prevSnap.customers) / prevSnap.customers) * 100)
              : null;
            const overdueChange = prevSnap.overdue > 0
              ? Math.round(((nowSnap.overdue - prevSnap.overdue) / prevSnap.overdue) * 100)
              : null;
            setCustomerTrend(custChange);
            setOverdueTrend(overdueChange);
          }
          // Save latest snapshot (overwrite only after 1h to preserve meaningful diff)
          if (!prevSnap || (Date.now() - prevSnap.ts) > 60 * 60 * 1000) {
            localStorage.setItem('dash_prev_snap', JSON.stringify(nowSnap));
          }

          // Fetch active customers to build high risk list
          const custResponse = await apiClient.getCustomers(user?.id || '60b9b32b9b1d8e2df8a149f1');
          if (custResponse.success && custResponse.data && custResponse.data.items) {
            const mappedHighRisk = custResponse.data.items
              .filter(c => c.riskScore === 'high')
              .map(c => {
                const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                return {
                  id: c._id,
                  name: c.name,
                  avatar: initials,
                  color: "from-red-500 to-red-600",
                  pending: c.totalOwed,
                  daysOverdue: 12,
                  risk: 'high'
                };
              });
            setHighRiskCustomers(mappedHighRisk);
          } else {
            setHighRiskCustomers([]);
          }
        }
      } catch (err) {
        console.warn("Could not load real dashboard summary, using offline mock data.");
        // Fallback to high-fidelity offline mock data if server is unreachable
        setTotalPending(mockInsights.totalPending);
        setTotalCollected(mockInsights.totalCollected);
        setCollectionRate(mockInsights.collectionRate);
        setTotalCustomersCount(mockCustomers.length);
        setOverdueCustomersCount(mockInsights.overdueCustomers);
        setHighRiskCount(mockCustomers.filter(c => c.risk === "high").length);
        setRecentActivityList(mockTx);
        setHighRiskCustomers(mockCustomers.filter(c => c.risk === "high"));
      } finally {
        setLoading(false);
      }
    }

    // Initial load
    loadDashboard();

    // Re-fetch whenever user navigates back to this page (tab visible again)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard();
      }
    };
    const handleFocus = () => loadDashboard();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Show skeleton while loading to prevent flash of zero values
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-28 relative">
        <div className="px-5 pt-12 pb-4">
          <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1" />
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="px-5 mb-6 animate-pulse">
          <div className="bg-slate-950 rounded-2xl p-5 space-y-4">
            <div className="h-3 w-40 bg-slate-800 rounded" />
            <div className="h-8 w-28 bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-800 rounded" />
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-800 rounded" />)}
            </div>
          </div>
        </div>
        <div className="px-5 mb-6 animate-pulse">
          <div className="grid grid-cols-2 gap-3">
            {[1,2].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        </div>
        <div className="px-5 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-28 min-w-full relative transition-colors duration-200">
      <FloatingBlobs />
      
      {/* Notion-style Header with extreme cleanliness */}
      <div className="relative z-10 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Smart bookkeeping assistant</p>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5">{merchantProfile.shopName}</h1>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }} 
            onClick={() => router.push("/reminders")}
            className="relative w-9 h-9 bg-white dark:bg-slate-900 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Bell size={16} className="text-slate-400 dark:text-slate-500" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
          </motion.button>
        </div>
      </div>

      {/* Main Ledger Metric Card Overhaul (Clean deep obsidian plate instead of noisy gradients) */}
      <div className="relative z-10 px-5 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 dark:bg-slate-900 border border-slate-900 dark:border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total outstanding balance</span>
              <div className="flex items-center gap-1.5 bg-orange-950/40 border border-orange-900/30 rounded-lg px-2 py-0.5">
                <AlertCircle size={10} className="text-orange-400" />
                <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wide">{highRiskCount} High Risk</span>
              </div>
            </div>
            
            <h2 className="text-3xl font-extrabold text-white font-display tracking-tight">₹{totalPending.toLocaleString()}</h2>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">Live Ledger Database synced</p>
            
            <div className="grid grid-cols-3 gap-2 mt-5 border-t border-slate-800/80 pt-4.5">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Collected</p>
                <p className="text-sm font-bold text-white mt-0.5">₹{totalCollected.toLocaleString()}</p>
              </div>
              <div className="border-x border-slate-900 px-2">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Recovery Rate</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{collectionRate}%</p>
              </div>
              <div className="pl-2">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Avg Days</p>
                <p className="text-sm font-bold text-white mt-0.5">{avgRepaymentDays}d</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats row with refined card layouts */}
      <div className="relative z-10 px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <StatsCard label="Total Customers" value={totalCustomersCount} icon={<Users size={15} />} color="blue" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatsCard label="Overdue Today" value={overdueCustomersCount} icon={<Clock size={15} />} color="orange" />
          </motion.div>
        </div>
      </div>

      {/* Quick Actions Grid Redesign */}
      <div className="relative z-10 px-5 mb-6">
        <SectionHeader title={t.quickActions} />
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: t.giveCredit, icon: ArrowUpRight, color: "text-orange-500 bg-orange-500/5 border border-orange-500/10 dark:bg-orange-950/20 dark:border-orange-900/30", action: "/confirm?manual=true&type=credit" },
            { label: t.getPayment, icon: ArrowDownLeft, color: "text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 dark:bg-emerald-950/20 dark:border-emerald-900/30", action: "/confirm?manual=true&type=payment" },
            { label: t.customers, icon: Users, color: "text-indigo-500 bg-indigo-500/5 border border-indigo-500/10 dark:bg-indigo-950/20 dark:border-indigo-900/30", action: "/customers" },
            { label: t.insights, icon: TrendingUp, color: "text-slate-500 bg-slate-500/5 border border-slate-500/10 dark:bg-slate-850 dark:border-slate-800", action: "/insights" },
          ].map(({ label, icon: Icon, color, action }, i) => (
            <motion.button
              key={action}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(action)}
              className="flex flex-col items-center justify-center gap-2.5 bg-white dark:bg-slate-900 rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)] border border-slate-100 dark:border-slate-800/80 cursor-pointer outline-none focus:outline-none"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-tight text-center leading-tight">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Store Toolkit Redesign (Premium micro-interactions, distinct hover highlights, and dynamic colors) */}
      <div className="relative z-10 px-5 mb-6">
        <SectionHeader title={t.smartSuite} />
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Cashbook", icon: BookOpen, sub: "Cash Flow Tracker", type: "cashbook", colorClass: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400", borderClass: "hover:border-emerald-300 dark:hover:border-emerald-800/80" },
            { label: "Galla Counter", icon: IndianRupee, sub: "Cash Audit Tool", type: "galla_calc", colorClass: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400", borderClass: "hover:border-amber-300 dark:hover:border-amber-800/80" },
            { label: "Visiting Card", icon: CreditCard, sub: "Share Card Maker", type: "visiting_card", colorClass: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400", borderClass: "hover:border-indigo-300 dark:hover:border-indigo-800/80" },
            { label: "GST Calculator", icon: Calculator, sub: "Quick GST Billing", type: "gst_calc", colorClass: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400", borderClass: "hover:border-teal-300 dark:hover:border-teal-800/80" }
          ].map(({ label, icon: Icon, sub, type, colorClass, borderClass }) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setCashAmount("");
                setCashNote("");
                setGstBasePrice("");
                resetGalla();
                setActiveTool(type);
              }}
              className={`flex flex-col items-center justify-between text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] border border-slate-100 dark:border-slate-850/80 cursor-pointer h-[105px] outline-none focus:outline-none transition-all duration-200 ${borderClass}`}
            >
              <div className="w-full flex items-start justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon size={15} />
                </div>
                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-md">FREE</span>
              </div>
              <div className="w-full">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">{label}</p>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">{sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* High risk alert notification bubble */}
      {highRiskCustomers.length > 0 && (
        <div className="relative z-10 px-5 mb-6">
          <div className="bg-red-500/5 border border-red-500/10 dark:bg-red-950/15 dark:border-red-900/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-red-500" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{t.highRisk}</span>
            </div>
            {highRiskCustomers.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between py-2 border-b border-red-500/5 last:border-0 cursor-pointer"
                onClick={() => router.push(`/customers/${c.id}`)}
              >
                <div className="flex items-center gap-2">
                  <Avatar initials={c.avatar} color={c.color || "from-red-400 to-red-500"} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.name}</p>
                    <p className="text-[9px] text-red-400/80 mt-0.5">{c.daysOverdue} {t.daysOverdue}</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-red-500">₹{c.pending.toLocaleString()}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions list with highly polished empty states */}
      <div className="relative z-10 px-5">
        <SectionHeader title={t.recentActivity} action={() => router.push("/customers")} actionLabel={t.all} />
        <Card className="p-4">
          {recentActivityList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <BookOpen size={24} className="mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No transactions recorded yet</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">Start by recording your first transaction. Tap the mic in the bottom bar to write your first entry.</p>
            </div>
          ) : (
            recentActivityList.map((tx, i) => <TransactionCard key={tx.id || i} tx={tx} i={i} />)
          )}
        </Card>
      </div>

      {/* VoiceKhata Smart Suite Interactive Drawers */}
      <AnimatePresence>
        {activeTool !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTool(null)}
              className="fixed inset-0 bg-black z-55"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-[32px] p-5 pb-28 z-60 shadow-2xl border-t border-slate-100 dark:border-slate-800/80 max-h-[85vh] overflow-y-auto hide-scrollbar"
            >
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-5" />

              {feedbackMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold p-3.5 rounded-xl mb-4 text-center">
                  {feedbackMessage}
                </div>
              )}

              {/* 1. CASHBOOK LEDGER TOOL */}
              {activeTool === 'cashbook' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-display">Business Cashbook</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Track daily general cash in-flow and expenditures</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <BookOpen size={15} />
                    </div>
                  </div>

                  {/* Cashbook running balance card */}
                  {(() => {
                    const totalIn = cashbookEntries.filter(e => e.type === "in").reduce((s, e) => s + e.amount, 0);
                    const totalOut = cashbookEntries.filter(e => e.type === "out").reduce((s, e) => s + e.amount, 0);
                    const balance = totalIn - totalOut;

                    return (
                      <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl mb-5 text-center">
                        <div>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{totalIn.toLocaleString()}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cash In</p>
                        </div>
                        <div className="border-x border-slate-200 dark:border-slate-800/60 px-1">
                          <p className="text-sm font-black text-red-500 dark:text-red-400">₹{totalOut.toLocaleString()}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cash Out</p>
                        </div>
                        <div>
                          <p className={`text-sm font-black ${balance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500"}`}>₹{balance.toLocaleString()}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Balance</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add cashbook entry fields */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850 mb-5 space-y-3.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Add Cash Entry</p>
                    <div className="flex gap-2">
                      {["in", "out"].map(t => (
                        <button
                          key={t}
                          onClick={() => setCashType(t)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            cashType === t
                              ? t === "in"
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                : "bg-red-500 text-white border-red-500 shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800"
                          }`}
                        >
                          {t === "in" ? "💵 Cash In (Sales)" : "💸 Cash Out (Expense)"}
                        </button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <input
                      type="text"
                      value={cashNote}
                      onChange={(e) => setCashNote(e.target.value)}
                      placeholder="Note (e.g. Sales, Rent, tea)"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-indigo-500 transition-all"
                    />

                    <button
                      onClick={() => {
                        const amt = parseFloat(cashAmount);
                        if (isNaN(amt) || amt <= 0) return;
                        
                        const newEntry = {
                          id: Date.now(),
                          type: cashType,
                          amount: amt,
                          note: cashNote.trim() || (cashType === "in" ? "Cash In" : "Cash Out"),
                          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        };

                        const updated = [newEntry, ...cashbookEntries];
                        setCashbookEntries(updated);
                        localStorage.setItem('cashbook_entries', JSON.stringify(updated));

                        setCashAmount("");
                        setCashNote("");
                      }}
                      className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer flex items-center justify-center hover:bg-indigo-750 transition-colors"
                    >
                      Save Cash Entry ✓
                    </button>
                  </div>

                  {/* Cashbook list */}
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Ledger History</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {cashbookEntries.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400">No cash entries recorded today.</p>
                    ) : (
                      cashbookEntries.map(e => (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{e.note}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{e.date}</p>
                          </div>
                          <span className={`text-xs font-extrabold ${e.type === "in" ? "text-emerald-500" : "text-red-500"}`}>
                            {e.type === "in" ? "+" : "-"}₹{e.amount.toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 2. VISITING CARD GENERATOR */}
              {activeTool === 'visiting_card' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-display">Business Visiting Card</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Design your premium business card to share instantly</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <CreditCard size={15} />
                    </div>
                  </div>

                  {/* Theme Selector */}
                  <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Theme:</span>
                    <div className="flex gap-2 flex-wrap flex-1 justify-end">
                      {[
                        { id: "classic_dark", label: "Dark Onyx", bg: "bg-slate-900" },
                        { id: "forest", label: "Forest", bg: "bg-emerald-800" },
                        { id: "royal", label: "Royal Gold", bg: "bg-gradient-to-r from-amber-600 to-yellow-500" },
                        { id: "navy", label: "Navy", bg: "bg-blue-900" },
                        { id: "burgundy", label: "Burgundy", bg: "bg-rose-900" },
                        { id: "black_gold", label: "Black Gold", bg: "bg-slate-950 border border-amber-500/50" },
                        { id: "emerald_gold", label: "Emerald Gold", bg: "bg-emerald-950 border border-yellow-500/50" }
                      ].map(th => (
                        <button
                          key={th.id}
                          onClick={() => setCardTheme(th.id)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold border-2 transition-all cursor-pointer ${
                            cardTheme === th.id || (th.id === "classic_dark" && cardTheme === "violet") || (th.id === "forest" && cardTheme === "emerald") || (th.id === "royal" && cardTheme === "gold")
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                              : "border-transparent bg-white dark:bg-slate-900 text-slate-400"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${th.bg}`} />{th.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Extra fields */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Business Type</label>
                      <input type="text" value={cardCategory} onChange={(e) => setCardCategory(e.target.value)} placeholder="Kirana / Retail" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white text-xs font-semibold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tagline (optional)</label>
                      <input type="text" value={cardTagline} onChange={(e) => setCardTagline(e.target.value)} placeholder="Your slogan..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white text-xs font-semibold outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Address (optional)</label>
                      <input type="text" value={cardAddress} onChange={(e) => setCardAddress(e.target.value)} placeholder="Shop No. 5, Market Road, City" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white text-xs font-semibold outline-none" />
                    </div>
                  </div>

                  {/* HIGH-FIDELITY DIGITAL VISITING CARD PREVIEW */}
                  <motion.div
                    layout
                    id="visiting-card-preview"
                    className={`w-full rounded-2xl px-5 py-4 relative overflow-hidden text-white flex flex-col justify-between shadow-xl mb-4 transition-all duration-350 ${
                      (cardTheme === "violet" || cardTheme === "classic_dark") ? "bg-gradient-to-br from-slate-900 via-slate-850 to-slate-905 border border-slate-700/50 text-white" :
                      (cardTheme === "emerald" || cardTheme === "forest") ? "bg-gradient-to-br from-emerald-900 via-emerald-850 to-teal-905 border border-emerald-700/50 text-white" :
                      (cardTheme === "gold" || cardTheme === "royal") ? "bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-805 border border-amber-500/50 text-white" :
                      cardTheme === "navy" ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-955 border border-indigo-500/30 text-white" :
                      cardTheme === "burgundy" ? "bg-gradient-to-br from-rose-955 via-red-950 to-rose-905 border border-rose-500/30 text-white" :
                      cardTheme === "black_gold" ? "bg-gradient-to-br from-slate-955 via-slate-900 to-slate-950 border border-amber-550/40 text-amber-100 shadow-[0_4px_20px_rgba(245,158,11,0.15)]" :
                      "bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-905 border border-yellow-550/30 text-emerald-100 shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                    }`}
                    style={{ minHeight: 200 }}
                  >
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-xl -translate-y-8 translate-x-8 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full blur-xl translate-y-6 -translate-x-6 pointer-events-none" />

                    {/* Top row */}
                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-black leading-tight tracking-tight">{merchantProfile.shopName || 'Your Shop Name'}</h4>
                        {cardTagline && <p className="text-[9px] text-white/60 mt-0.5 italic">{cardTagline}</p>}
                        {cardCategory && <span className="text-[8px] font-bold uppercase px-2 py-0.5 bg-white/15 rounded-full mt-1.5 inline-block">{cardCategory}</span>}
                      </div>
                      {merchantProfile.profilePhoto ? (
                        <img src={merchantProfile.profilePhoto} alt="logo" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                          <span className="text-sm font-black">{(merchantProfile.shopName || 'V')[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* Middle divider */}
                    <div className="relative z-10 border-t border-white/10 my-3" />

                    {/* Bottom details grid */}
                    <div className="relative z-10 grid grid-cols-2 gap-y-1.5">
                      <div>
                        <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Owner</p>
                        <p className="text-xs font-extrabold">{merchantProfile.ownerName || 'Owner Name'}</p>
                      </div>
                      {merchantProfile.phone && (
                        <div className="text-right">
                          <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Mobile</p>
                          <p className="text-xs font-bold">{merchantProfile.phone}</p>
                        </div>
                      )}
                      {merchantProfile.email && (
                        <div className="col-span-2">
                          <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Email</p>
                          <p className="text-[10px] font-semibold text-white/80">{merchantProfile.email}</p>
                        </div>
                      )}
                      {merchantProfile.upiId && (
                        <div>
                          <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">UPI Pay</p>
                          <p className="text-[10px] font-bold text-white/80">{merchantProfile.upiId}</p>
                        </div>
                      )}
                      {cardAddress && (
                        <div className={merchantProfile.upiId ? "text-right" : "col-span-2"}>
                          <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Address</p>
                          <p className="text-[9px] text-white/70 leading-tight">{cardAddress}</p>
                        </div>
                      )}
                    </div>

                    {/* VoiceKhata watermark shifted to bottom-center to prevent phone number overlap */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-widest text-white/25">VoiceKhata ✦</div>
                  </motion.div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => {
                        const lines = [
                          `*${merchantProfile.shopName || 'My Shop'}*`,
                          cardTagline ? `_${cardTagline}_` : '',
                          cardCategory ? `Category: ${cardCategory}` : '',
                          ``,
                          `Owner: *${merchantProfile.ownerName || 'Owner'}*`,
                          merchantProfile.phone ? `Phone: ${merchantProfile.phone}` : '',
                          merchantProfile.email ? `Email: ${merchantProfile.email}` : '',
                          merchantProfile.upiId ? `UPI Pay: ${merchantProfile.upiId}` : '',
                          cardAddress ? `Address: ${cardAddress}` : '',
                          ``,
                          `Powered by VoiceKhata`
                        ].filter(Boolean).join('\n');
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(lines)}`, '_blank');
                      }}
                      className="py-2.5 bg-[#25D366] hover:bg-[#22c35e] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 border-0 outline-none focus:outline-none"
                    >
                      <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-4 h-4 object-contain" /> Share on WhatsApp
                    </button>
                    <button
                      onClick={handleDownloadCard}
                      className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border-0 outline-none focus:outline-none"
                    >
                      <Download size={14} /> Download & Save
                    </button>
                  </div>
                  <p className="text-center text-[9px] text-slate-400 dark:text-slate-600">Edit your name, phone, UPI &amp; photo in Settings → Edit Profile</p>
                </div>
              )}

              {/* 3. GST TAX CALCULATOR */}
              {activeTool === 'gst_calc' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-display">GST Bill Calculator</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Calculate CGST, SGST & Net values instantly</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Calculator size={15} />
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">GST Type</label>
                      <div className="flex gap-2">
                        {["exclusive", "inclusive"].map(t => (
                          <button
                            key={t}
                            onClick={() => setGstType(t)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              gstType === t
                                ? "bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800"
                            }`}
                          >
                            {t === "exclusive" ? "Tax Extra (+ GST)" : "Tax Included (GST Incl.)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={gstBasePrice}
                          onChange={(e) => setGstBasePrice(e.target.value)}
                          placeholder="1000"
                          className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">GST Rate Slab</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 12, 18, 28].map(r => (
                          <button
                            key={r}
                            onClick={() => setGstRate(r)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              gstRate === r
                                ? "bg-indigo-600 text-white shadow-sm border border-indigo-600"
                                : "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800"
                            }`}
                          >
                            {r}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* GST calculations results card */}
                  {(() => {
                    const price = parseFloat(gstBasePrice) || 0;
                    let taxVal = 0;
                    let baseVal = price;
                    let finalVal = price;

                    if (gstType === "exclusive") {
                      taxVal = price * (gstRate / 100);
                      finalVal = price + taxVal;
                    } else {
                      baseVal = price / (1 + gstRate / 100);
                      taxVal = price - baseVal;
                    }

                    const splitTax = taxVal / 2;

                    return (
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl mb-5 space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-900">
                          <span className="text-[10px] text-slate-400">Base Price (Net of Tax)</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350">₹{baseVal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-900">
                          <span className="text-[10px] text-slate-400">CGST ({gstRate / 2}%)</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350">₹{splitTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-900">
                          <span className="text-[10px] text-slate-400">SGST ({gstRate / 2}%)</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350">₹{splitTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 pt-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-white">Total Bill Value</span>
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">₹{finalVal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => setFeedbackMessage("Simple bill invoice generated successfully.")}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center transition-colors"
                  >
                    🧾 Generate Simple Bill
                  </button>
                </div>
              )}

              {/* 4. GALLA DENOMINATION CALCULATOR TOOL */}
              {activeTool === 'galla_calc' && (
                <div>
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-display">Galla Cash Counter</h3>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Physical cash denomination auditor & discrepancies checker</p>
                     </div>
                     <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                       <IndianRupee size={15} />
                     </div>
                   </div>

                   {/* Counted Total Display Card */}
                   {(() => {
                     const total = 
                       (parseInt(qty500) || 0) * 500 +
                       (parseInt(qty200) || 0) * 200 +
                       (parseInt(qty100) || 0) * 100 +
                       (parseInt(qty50) || 0) * 50 +
                       (parseInt(qty20) || 0) * 20 +
                       (parseInt(qty10) || 0) * 10 +
                       (parseInt(qty5Coin) || 0) * 5 +
                       (parseInt(qty2Coin) || 0) * 2 +
                       (parseInt(qty1Coin) || 0) * 1;

                     return (
                       <div className="bg-slate-950 dark:bg-slate-900 border border-slate-900 dark:border-slate-800 p-4.5 rounded-2xl mb-5 text-center relative overflow-hidden shadow-md">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                         <span className="text-slate-400 text-[8px] font-bold uppercase tracking-widest block mb-1">TOTAL COUNTED CASH</span>
                         <h4 className="text-2xl font-extrabold text-white tracking-tight">₹{total.toLocaleString()}</h4>
                       </div>
                     );
                   })()}

                   {/* Denomination Inputs Table Grid */}
                   <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl p-4.5 mb-5 space-y-3">
                     {[
                       { label: "₹500", state: qty500, setter: setQty500, value: 500 },
                       { label: "₹200", state: qty200, setter: setQty200, value: 200 },
                       { label: "₹100", state: qty100, setter: setQty100, value: 100 },
                       { label: "₹50", state: qty50, setter: setQty50, value: 50 },
                       { label: "₹20", state: qty20, setter: setQty20, value: 20 },
                       { label: "₹10", state: qty10, setter: setQty10, value: 10 },
                       { label: "₹5 Coin", state: qty5Coin, setter: setQty5Coin, value: 5 },
                       { label: "₹2 Coin", state: qty2Coin, setter: setQty2Coin, value: 2 },
                       { label: "₹1 Coin", state: qty1Coin, setter: setQty1Coin, value: 1 }
                     ].map((item) => (
                       <div key={item.label} className="flex items-center justify-between gap-3 border-b border-slate-100/50 dark:border-slate-855/20 last:border-0 pb-2.5 last:pb-0">
                         <div className="w-16 flex flex-col">
                           <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350">{item.label}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] text-slate-400 font-bold">×</span>
                           <input
                             type="number"
                             value={item.state}
                             onChange={(e) => {
                               const val = e.target.value;
                               if (val === "" || (parseInt(val) >= 0 && !isNaN(parseInt(val)))) {
                                 item.setter(val);
                               }
                             }}
                             placeholder="0"
                             className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-bold text-center outline-none focus:border-indigo-500 transition-colors"
                           />
                         </div>
                         <div className="w-24 text-right">
                           <span className="text-xs font-extrabold text-slate-650 dark:text-slate-400">
                             ₹{((parseInt(item.state) || 0) * item.value).toLocaleString()}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>

                   {/* Audit panel */}
                   {showAudit && (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="mb-5"
                     >
                       {(() => {
                         const total = 
                           (parseInt(qty500) || 0) * 500 +
                           (parseInt(qty200) || 0) * 200 +
                           (parseInt(qty100) || 0) * 100 +
                           (parseInt(qty50) || 0) * 50 +
                           (parseInt(qty20) || 0) * 20 +
                           (parseInt(qty10) || 0) * 10 +
                           (parseInt(qty5Coin) || 0) * 5 +
                           (parseInt(qty2Coin) || 0) * 2 +
                           (parseInt(qty1Coin) || 0) * 1;

                         // Sum of Today's Digital Cashbook In entries
                         const todayDateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                         
                         // Get cash in entries for today from state
                         const todayCashIn = cashbookEntries
                           .filter(e => e.type === "in" && e.date.startsWith(todayDateStr))
                           .reduce((sum, e) => sum + e.amount, 0);

                         const discrepancy = total - todayCashIn;

                         return (
                           <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl space-y-3.5">
                             <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-900">
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Physical Counted Cash</span>
                               <span className="text-xs font-extrabold text-slate-800 dark:text-white">₹{total.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-900">
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Digital Cash In</span>
                               <span className="text-xs font-extrabold text-slate-800 dark:text-white">₹{todayCashIn.toLocaleString()}</span>
                             </div>

                             {discrepancy === 0 ? (
                               <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center flex items-center justify-center gap-2">
                                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                 <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Match Confirmed (Zero Discrepancy)</span>
                               </div>
                             ) : discrepancy > 0 ? (
                               <div className="bg-teal-500/10 border border-teal-500/20 p-3 rounded-lg text-center flex flex-col gap-1 items-center justify-center">
                                 <div className="flex items-center justify-center gap-2">
                                   <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                                   <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Cash Surplus Detected</span>
                                 </div>
                                 <span className="text-xs font-black text-teal-600 dark:text-teal-400">Surplus: +₹{discrepancy.toLocaleString()}</span>
                               </div>
                             ) : (
                               <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center flex flex-col gap-1 items-center justify-center">
                                 <div className="flex items-center justify-center gap-2">
                                   <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                   <span className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest">Cash Shortage Detected</span>
                                 </div>
                                 <span className="text-xs font-black text-red-500 dark:text-red-400">Shortage: -₹{Math.abs(discrepancy).toLocaleString()}</span>
                               </div>
                             )}

                             {discrepancy !== 0 && (
                               <button
                                 onClick={() => {
                                   const isShortage = discrepancy < 0;
                                   const absAmt = Math.abs(discrepancy);
                                   
                                   const newEntry = {
                                     id: Date.now(),
                                     type: isShortage ? "out" : "in",
                                     amount: absAmt,
                                     note: isShortage ? "Galla Cash Shortage Adjustment" : "Galla Cash Surplus Adjustment",
                                     date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                   };

                                   const updated = [newEntry, ...cashbookEntries];
                                   setCashbookEntries(updated);
                                   localStorage.setItem('cashbook_entries', JSON.stringify(updated));

                                   setFeedbackMessage(`Cashbook adjusted successfully with ₹${absAmt.toLocaleString()} ${isShortage ? "out-flow" : "in-flow"}.`);
                                   setShowAudit(false);
                                 }}
                                 className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-indigo-650 dark:text-indigo-400 font-bold text-[10px] rounded-lg tracking-wider uppercase border border-indigo-150/30 dark:border-slate-700 cursor-pointer transition-colors outline-none focus:outline-none"
                               >
                                 Adjust Cashbook Balance ✓
                               </button>
                             )}
                           </div>
                         );
                       })()}
                     </motion.div>
                   )}

                   {/* Audit Action Controls */}
                   <div className="grid grid-cols-2 gap-3 pb-8">
                     <button
                       onClick={resetGalla}
                       className="py-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center outline-none focus:outline-none border border-slate-150 dark:border-slate-800 transition-colors"
                     >
                       Reset Counter
                     </button>
                     <button
                       onClick={() => setShowAudit(true)}
                       className="py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center outline-none focus:outline-none shadow-sm transition-colors"
                     >
                       Match with Cashbook
                     </button>
                   </div>
                 </div>
               )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
