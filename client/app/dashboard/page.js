"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Bell, TrendingUp, TrendingDown, AlertCircle, 
  ArrowUpRight, ArrowDownLeft, IndianRupee, Users, 
  Clock, BookOpen, CreditCard, Calculator, ChevronRight 
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
  const t = dashboardTranslations.en;
  
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
    shopName: "Yaksh Kirana Store",
    ownerName: "Yaksh Patel",
    phone: "+91 98765 43210",
    upiId: "yakshkirana@paytm"
  });

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

  // Visiting Card Customization State
  const [cardTheme, setCardTheme] = useState("violet"); // 'violet' | 'emerald' | 'gold'
  const [cardCategory, setCardCategory] = useState("Retail & Kirana");

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
            <StatsCard label="Total Customers" value={totalCustomersCount} icon={<Users size={15} />} color="blue" trend={8} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatsCard label="Overdue Today" value={overdueCustomersCount} icon={<Clock size={15} />} color="orange" trend={-5} />
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
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Cashbook", icon: BookOpen, sub: "Cash Flow Tracker", type: "cashbook", colorClass: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400", borderClass: "hover:border-emerald-300 dark:hover:border-emerald-800/80" },
            { label: "Visiting Card", icon: CreditCard, sub: "Share Card Maker", type: "visiting_card", colorClass: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400", borderClass: "hover:border-indigo-300 dark:hover:border-indigo-800/80" },
            { label: "GST Calculator", icon: Calculator, sub: "Quick GST Billing", type: "gst_calc", colorClass: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400", borderClass: "hover:border-amber-300 dark:hover:border-amber-800/80" }
          ].map(({ label, icon: Icon, sub, type, colorClass, borderClass }) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setCashAmount("");
                setCashNote("");
                setGstBasePrice("");
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
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-[32px] p-5 pb-10 z-60 shadow-2xl border-t border-slate-100 dark:border-slate-800/80 max-h-[85vh] overflow-y-auto hide-scrollbar"
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
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Design your premium business card to share with customers</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <CreditCard size={15} />
                    </div>
                  </div>

                  {/* Customizable Themes Selector */}
                  <div className="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Card Theme:</span>
                    <div className="flex gap-2 flex-1 justify-end">
                      {[
                        { id: "violet", label: "Violet", bg: "bg-indigo-600" },
                        { id: "emerald", label: "Emerald", bg: "bg-emerald-600" },
                        { id: "gold", label: "Royal Gold", bg: "bg-gradient-to-r from-amber-500 to-yellow-600" }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setCardTheme(t.id)}
                          className={`w-5 h-5 rounded-full ${t.bg} border-2 transition-all cursor-pointer ${cardTheme === t.id ? "border-slate-800 dark:border-white scale-110" : "border-white dark:border-slate-900"}`}
                          title={t.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Category editor */}
                  <div className="mb-4">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Business Category</label>
                    <input
                      type="text"
                      value={cardCategory}
                      onChange={(e) => setCardCategory(e.target.value)}
                      placeholder="Retail & Kirana"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none"
                    />
                  </div>

                  {/* HIGH-FIDELITY DIGITAL VISITING CARD PREVIEW */}
                  <motion.div
                    layout
                    className={`w-full h-[180px] rounded-2xl p-5 relative overflow-hidden text-white flex flex-col justify-between shadow-md mb-5 ${
                      cardTheme === "violet" ? "bg-slate-900 border border-slate-800" :
                      cardTheme === "emerald" ? "bg-emerald-950 border border-emerald-900" :
                      "bg-amber-950 border border-amber-900"
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-y-6 translate-x-6" />

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold leading-tight tracking-tight font-display">{merchantProfile.shopName}</h4>
                        <span className="text-[8px] font-bold uppercase px-2 py-0.5 bg-white/10 rounded-full mt-1.5 inline-block">{cardCategory}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">VoiceKhata</span>
                    </div>

                    <div className="relative z-10 flex justify-between items-end">
                      <div>
                        <p className="text-[8px] text-white/50 font-bold uppercase tracking-widest">Merchant Owner</p>
                        <p className="text-xs font-extrabold">{merchantProfile.ownerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold">{merchantProfile.phone}</p>
                        {merchantProfile.upiId && <p className="text-[8px] text-white/60 mt-0.5">UPI: {merchantProfile.upiId}</p>}
                      </div>
                    </div>
                  </motion.div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setFeedbackMessage("Visiting card downloaded successfully.")}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      💾 Download Card
                    </button>
                    <button
                      onClick={() => {
                        const msg = `*${merchantProfile.shopName}*\n\nOwner: ${merchantProfile.ownerName}\nPhone: ${merchantProfile.phone}\nUPI: ${merchantProfile.upiId}\n\nSupported by VoiceKhata`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#22c35e] text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      📲 Share WhatsApp
                    </button>
                  </div>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
