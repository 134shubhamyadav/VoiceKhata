"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Plus, Clock, AlertCircle, Users } from "lucide-react";
import { Avatar, RiskBadge, FloatingBlobs } from "@/components/ui";
import { customers as mockCustomers } from "@/lib/data";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

function CustomerCard({ c, i, onClick }) {
  const isOverdue = c.daysOverdue > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex items-center gap-3.5 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] border border-slate-100 dark:border-slate-800/80 mb-3 cursor-pointer"
    >
      <div className="relative">
        <Avatar initials={c.avatar} color={c.color} size="md" />
        {isOverdue && c.risk === "high" && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
            <AlertCircle size={8} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{c.name}</p>
          <RiskBadge level={c.risk} />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
          {isOverdue && (
            <>
              <Clock size={9} className="text-orange-400" />
              <span className="text-orange-500 font-bold">{c.daysOverdue}d overdue</span>
            </>
          )}
          {!isOverdue && <span className="text-emerald-500 font-bold">On time</span>}
          <span className="text-slate-200 dark:text-slate-800">•</span>
          <span>{c.lastTransaction}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {c.pending > 0 ? (
          <>
            <p className="text-xs font-extrabold text-orange-500">₹{c.pending.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">pending</p>
          </>
        ) : (
          <>
            <p className="text-xs font-extrabold text-emerald-500">Clear</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">settled</p>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadCustomers() {
      try {
        const userId = user?.id || '60b9b32b9b1d8e2df8a149f1';
        const response = await apiClient.getCustomers(userId);
        if (response.success && response.data && response.data.items) {
          const mapped = response.data.items.map((c, i) => {
            const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const avatars = ["from-[#4285F4] to-indigo-650", "from-slate-700 to-slate-850", "from-orange-500 to-orange-600", "from-emerald-500 to-emerald-600", "from-pink-500 to-pink-600"];
            
            return {
              id: c._id,
              name: c.name,
              phone: c.phone || '',
              avatar: initials,
              color: avatars[i % avatars.length],
              pending: (c.totalOwed || 0),
              totalCredit: (c.totalOwed || 0),
              totalPaid: 0,
              risk: c.riskScore || 'low',
              daysOverdue: c.riskScore === 'high' ? 12 : 0,
              lastTransaction: 'Recently',
            };
          });
          setCustomers(mapped);
        }
      } catch (err) {
        console.warn("Could not load real customers, using offline mock data instead.");
      } finally {
        setLoading(false);
      }
    }

    // Initial load
    loadCustomers();

    // Re-fetch when user navigates back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCustomers();
      }
    };
    const handleFocus = () => loadCustomers();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filtered = customers.filter(c => {
    const matchesQ = c.name.toLowerCase().includes(query.toLowerCase());
    const matchesF = filter === "all" || c.risk === filter || (filter === "overdue" && c.daysOverdue > 0);
    return matchesQ && matchesF;
  });

  const totalPending = customers.reduce((s, c) => s + c.pending, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-28 relative transition-colors duration-200">
      <FloatingBlobs />
      
      {/* Header */}
      <div className="relative z-10 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4.5">
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-800 dark:text-white tracking-tight font-display">Customers</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">{customers.length} customers • ₹{totalPending.toLocaleString()} pending</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.93 }}
            onClick={() => router.push("/confirm?manual=true")}
            className="w-9 h-9 bg-[#4285F4] hover:bg-[#3367D6] rounded-xl flex items-center justify-center cursor-pointer shadow-sm border border-white/5 outline-none focus:outline-none"
          >
            <Plus size={16} className="text-white" />
          </motion.button>
        </div>

        {/* Premium Input Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search business accounts..."
            className="w-full bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-350 dark:placeholder:text-slate-655 focus:outline-none focus:border-[#4285F4]/70 focus:ring-2 focus:ring-[#4285F4]/5 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
          />
        </div>

        {/* Minimal filters tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {[["all","All"], ["overdue","Pending"], ["high","Follow-ups"], ["medium","Active"], ["low","Settled"]].map(([val, label]) => (
            <button 
              key={val} 
              onClick={() => setFilter(val)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border outline-none focus:outline-none ${
                filter === val 
                  ? "bg-[#4285F4] text-white border-[#4285F4] shadow-sm" 
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-850"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary count tiles */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "High Risk", count: customers.filter(c=>c.risk==="high").length, color: "text-red-500 bg-red-500/5 border-red-500/10 dark:bg-red-950/15 dark:border-red-900/30" },
            { label: "Overdue", count: customers.filter(c=>c.daysOverdue>0).length, color: "text-orange-500 bg-orange-500/5 border-orange-500/10 dark:bg-orange-950/15 dark:border-orange-900/30" },
            { label: "Cleared", count: customers.filter(c=>c.pending===0).length, color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10 dark:bg-emerald-950/15 dark:border-emerald-900/30" },
          ].map(({label,count,color}) => (
            <div key={label} className={`flex-1 rounded-xl p-3 border text-center ${color}`}>
              <p className="text-sm font-extrabold font-display leading-tight">{count}</p>
              <p className="text-[8px] font-bold uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Customers List container with zero-state empty states */}
      <div className="relative z-10 px-5">
        {loading ? (
          <div className="flex flex-col gap-3 mt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-2xl animate-pulse shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <Users size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No customers yet</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Start by recording your first transaction or tapping the plus button above.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
              <Search className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-slate-700 dark:text-slate-200 font-bold mb-1">No customers found</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs">Try adjusting your search or add a new customer to your khata.</p>
          </div>
        ) : (
          filtered.map((c, i) => (
            <CustomerCard key={c.id} c={c} i={i} onClick={() => router.push(`/customers/${c.id}`)} />
          ))
        )}
      </div>
    </div>
  );
}
