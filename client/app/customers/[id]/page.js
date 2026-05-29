"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Bell, Phone, MessageCircle, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, IndianRupee } from "lucide-react";
import { Avatar, RiskBadge, Card, Button } from "@/components/ui";
import { customers as mockCustomers } from "@/lib/data";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

function RiskMeter({ level }) {
  const pct = level === "high" ? 80 : level === "medium" ? 50 : 20;
  const color = level === "high" ? "from-red-450 to-red-600" : level === "medium" ? "from-amber-400 to-amber-500" : "from-emerald-450 to-emerald-500";
  return (
    <div>
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Risk Level</span>
        <RiskBadge level={level} />
      </div>
      <div className="h-2 bg-slate-105 dark:bg-slate-950 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.8 }}
          className={`h-full bg-gradient-to-r ${color} rounded-full`} />
      </div>
      <div className="flex justify-between text-[9px] font-extrabold uppercase text-slate-300 dark:text-slate-700 mt-1.5 tracking-wider">
        <span>Low</span><span>Medium</span><span>High</span>
      </div>
    </div>
  );
}

function TxRow({ tx }) {
  const isCredit = tx.type === "credit";
  const statusIcons = { pending: Clock, paid: CheckCircle, overdue: AlertCircle, disputed: AlertCircle };
  const StatusIcon = statusIcons[tx.status] || Clock;
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100 dark:border-slate-850 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
        isCredit 
          ? "bg-orange-500/5 border-orange-500/10 text-orange-500" 
          : "bg-emerald-500/5 border-emerald-500/10 text-emerald-500"
      }`}>
        {isCredit ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{tx.note}</p>
        <p className="text-[9px] text-slate-450 dark:text-slate-550 font-medium mt-0.5">{tx.date}</p>
      </div>
      <div className="text-right">
        <p className={`text-xs font-extrabold ${isCredit ? "text-orange-500" : "text-emerald-500"}`}>
          {isCredit ? "-" : "+"}₹{tx.amount.toLocaleString()}
        </p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <StatusIcon size={9} className={tx.status === "paid" ? "text-emerald-500" : tx.status === "overdue" ? "text-red-500" : "text-amber-500"} />
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{tx.status}</span>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const router = useRouter();

  const mockC = mockCustomers.find(x => x.id === id) || mockCustomers[0];

  const [customer, setCustomer] = useState(mockC);
  const [loading, setLoading] = useState(true);

  // Edit customer details drawer states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Record Cash Payment / Give Credit drawer states
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [entryType, setEntryType] = useState("payment"); // 'payment' | 'credit'
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // UPI Callback Auto-Update Simulation state
  const [simulatingUPI, setSimulatingUPI] = useState(false);

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setEditError("Name is required");
      return;
    }
    
    const cleanPhone = editPhone.trim();
    if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setEditError("Phone must be a valid 10-digit Indian mobile number");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const response = await apiClient.updateCustomer(id, editName.trim(), cleanPhone || undefined);
      if (response.success && response.data) {
        const updated = response.data;
        const initials = updated.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        setCustomer(prev => ({
          ...prev,
          name: updated.name,
          phone: updated.phone || 'No phone number',
          avatar: initials
        }));
        
        setIsEditing(false);
      } else {
        throw new Error(response.message || "Failed to update customer details");
      }
    } catch (err) {
      console.error("Could not update customer on backend:", err);
      setEditError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSavePayment = async () => {
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError("Please enter a valid amount");
      return;
    }

    setSavingPayment(true);
    setPaymentError("");

    try {
      const isPayment = entryType === 'payment';
      const payload = {
        customerId: id,
        userId: user?.id || '60b9b32b9b1d8e2df8a149f1',
        amount: amountNum,
        type: entryType,
        status: isPayment ? 'paid' : 'pending',
        note: paymentNotes.trim() || (isPayment ? `Cash payment received` : `Credit given`),
      };

      const response = await apiClient.createEntry(payload);
      if (response.success) {
        localStorage.setItem('recent_transaction', JSON.stringify({
          customer: customer.name,
          amount: amountNum,
          type: entryType,
          dueDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          note: payload.note,
          raw: isPayment ? `Paid ₹${amountNum} in cash` : `Credit of ₹${amountNum} given`
        }));
        
        setIsRecordingPayment(false);
        router.push("/success");
      } else {
        throw new Error(response.message || "Failed to record entry");
      }
    } catch (err) {
      console.error("Could not save entry to backend:", err);
      setPaymentError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSimulateUPI = () => {
    setSimulatingUPI(true);
    
    setTimeout(async () => {
      try {
        const amountNum = 500;
        const payload = {
          customerId: id,
          userId: user?.id || '60b9b32b9b1d8e2df8a149f1',
          amount: amountNum,
          type: 'payment',
          status: 'paid',
          note: 'Payment received via Paytm UPI',
        };

        const response = await apiClient.createEntry(payload);
        if (response.success) {
          localStorage.setItem('recent_transaction', JSON.stringify({
            customer: customer.name,
            amount: amountNum,
            type: 'payment',
            dueDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            note: payload.note,
            raw: `Paytm UPI payment of ₹500`
          }));
          router.push("/success");
        } else {
          throw new Error("Failed simulation");
        }
      } catch (err) {
        localStorage.setItem('recent_transaction', JSON.stringify({
          customer: customer.name,
          amount: 500,
          type: 'payment',
          dueDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          note: 'Payment received via Paytm UPI',
          raw: 'Paytm UPI payment of ₹500'
        }));
        router.push("/success");
      } finally {
        setSimulatingUPI(false);
      }
    }, 2000);
  };

  const handleWhatsAppReminder = async () => {
    try {
      const pendingCredit = customer.transactions && customer.transactions.find(
        tx => tx.type === 'credit' && tx.status !== 'paid'
      );

      const entryId = pendingCredit ? pendingCredit.id : undefined;
      const response = await apiClient.sendReminder(id, entryId);
      
      if (response.success && response.data && response.data.whatsappLink) {
        window.open(response.data.whatsappLink, '_blank');
      } else {
        const msg = pendingCredit 
          ? `Namaste ${customer.name} ji! 🙏 Aapka ₹${pendingCredit.amount.toLocaleString()} ka pending udhaar record hai. Kripya samay pe wapas settle karein. — VoiceKhata`
          : `Namaste ${customer.name} ji! 🙏 VoiceKhata pe aapka account balance fully clear hai. Dhanyawad!`;
        window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      console.warn("Could not trigger live WhatsApp link, using mock WhatsApp redirection.", err);
      const msg = `Namaste ${customer.name} ji! 🙏 Aapka pending udhaar ₹${customer.pending.toLocaleString()} hai. Kripya jald hi clear karein. — VoiceKhata`;
      window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  useEffect(() => {
    async function loadCustomerDetails() {
      try {
        const custRes = await apiClient.getCustomerById(id);
        if (custRes.success && custRes.data) {
          const c = custRes.data;
          const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
          
          const entriesRes = await apiClient.getEntries({ customerId: id });
          let txs = [];
          let totalPaidRupees = 0;
          const entriesList = entriesRes.data && (entriesRes.data.items || entriesRes.data.entries || entriesRes.data);
          
          if (entriesRes.success && Array.isArray(entriesList)) {
            txs = entriesList.map(e => {
              if (e.type === 'payment' && e.status === 'paid') {
                totalPaidRupees += e.amount;
              }
              return {
                id: e._id,
                type: e.type,
                amount: e.amount,
                date: new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                note: e.note || (e.type === 'credit' ? 'Grocery items' : 'Payment received'),
                status: e.status
              };
            });
          }

          setCustomer({
            id: c._id,
            name: c.name,
            phone: c.phone || 'No phone number',
            avatar: initials,
            color: "from-indigo-500 to-indigo-650",
            pending: (c.totalOwed || 0),
            totalPaid: totalPaidRupees,
            totalCredit: ((c.totalOwed || 0)) + totalPaidRupees,
            risk: c.riskScore || 'low',
            daysOverdue: c.riskScore === 'high' ? 12 : 0,
            transactions: txs,
            reminders: []
          });
        }
      } catch (err) {
        console.warn("Could not fetch customer details from API, using offline mock data.");
      } finally {
        setLoading(false);
      }
    }
    loadCustomerDetails();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-28 overflow-hidden relative transition-colors duration-200">
      
      {/* Sleek Flat Obsidian Panel Header */}
      <div className="bg-slate-950 dark:bg-slate-900 border-b border-slate-900 dark:border-slate-800/80 px-5 pt-12 pb-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.back()} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer outline-none focus:outline-none">
              <ArrowLeft size={15} className="text-slate-400" />
            </button>
            <div className="flex gap-2">
              <button onClick={() => router.push("/voice")} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer outline-none focus:outline-none">
                <Mic size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Avatar initials={customer.avatar} color={customer.color} size="lg" />
              <div>
                <h1 className="text-base font-black text-white leading-tight font-display">{customer.name}</h1>
                <p className="text-slate-400 text-xs mt-0.5">{customer.phone}</p>
                <div className="mt-1.5">
                  <RiskBadge level={customer.risk} />
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditName(customer.name);
                setEditPhone(customer.phone === 'No phone number' ? '' : customer.phone);
                setEditError("");
                setIsEditing(true);
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer outline-none focus:outline-none"
            >
              Edit Info
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        
        {/* Balance cards Overhaul */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Pending", val: `₹${customer.pending.toLocaleString()}`, color: "text-orange-500", bg: "bg-orange-500/5 border-orange-500/10" },
            { label: "Paid", val: `₹${customer.totalPaid.toLocaleString()}`, color: "text-emerald-500", bg: "bg-emerald-500/5 border-emerald-500/10" },
            { label: "Total Credit", val: `₹${customer.totalCredit.toLocaleString()}`, color: "text-indigo-500", bg: "bg-indigo-500/5 border-indigo-500/10" },
          ].map(({ label, val, color, bg }) => (
            <div key={label} className={`rounded-xl p-3 border text-center ${bg}`}>
              <p className={`text-sm font-extrabold font-display leading-tight ${color}`}>{val}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Risk meter indicator */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900 rounded-xl p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] border border-slate-100 dark:border-slate-800/80 mb-4"
        >
          <RiskMeter level={customer.risk} />
          {customer.daysOverdue > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-red-500/5 rounded-lg p-2 border border-red-500/10">
              <AlertCircle size={12} className="text-red-500" />
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{customer.daysOverdue} days overdue</span>
            </div>
          )}
        </motion.div>

        {/* Unified actions grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-2 mb-3.5">
          <button 
            onClick={handleWhatsAppReminder} 
            className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer outline-none focus:outline-none transition-colors"
          >
            <MessageCircle size={12} /> Remind
          </button>
          <button 
            onClick={() => {
              setPaymentAmount("");
              setPaymentNotes("");
              setPaymentError("");
              setEntryType("payment");
              setIsRecordingPayment(true);
            }} 
            className="py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer outline-none focus:outline-none transition-colors"
          >
            <IndianRupee size={12} /> Got Payment
          </button>
          <button 
            onClick={() => {
              setPaymentAmount("");
              setPaymentNotes("");
              setPaymentError("");
              setEntryType("credit");
              setIsRecordingPayment(true);
            }} 
            className="py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer outline-none focus:outline-none transition-colors"
          >
            <TrendingDown size={12} /> Give Credit
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="grid grid-cols-2 gap-3 mb-5">
          <button 
            onClick={() => window.open(`tel:${customer.phone}`, '_self')} 
            className="py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-650 dark:text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] cursor-pointer outline-none focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
          >
            <Phone size={12} /> Call Customer
          </button>
          <button 
            onClick={handleSimulateUPI} 
            disabled={simulatingUPI}
            className={`py-2.5 bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none ${simulatingUPI ? "opacity-60" : ""}`}
          >
            {simulatingUPI ? (
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Paying...
              </span>
            ) : (
              <>⚡ Simulate UPI Pay</>
            )}
          </button>
        </motion.div>

        {simulatingUPI && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex items-center gap-2.5"
          >
            <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider">Simulating Paytm webhook auto-update for ₹500...</p>
          </motion.div>
        )}

        {/* Transactions timeline list */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display">Transaction History</h2>
          </div>
          <Card className="p-4 mb-5">
            {customer.transactions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium uppercase tracking-widest">No entries recorded</div>
            ) : (
              customer.transactions.map(tx => <TxRow key={tx.id} tx={tx} />)
            )}
          </Card>
        </motion.div>

        {/* Reminder timeline list */}
        {customer.reminders && customer.reminders.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display mb-3 px-0.5">Reminder History</h2>
            <div className="space-y-3">
              {customer.reminders.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800/80 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">{r.sentAt}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      r.status === "delivered" ? "bg-indigo-50/50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30" :
                      r.status === "read" ? "bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" : 
                      "bg-slate-50 text-slate-550 border-slate-200"
                    }`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-semibold">"{r.message}"</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Edit Drawer slide-up */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="fixed inset-0 bg-black z-45"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[24px] p-5 pb-10 z-50 shadow-2xl border-t border-slate-100 dark:border-slate-800/80"
            >
              <div className="w-12 h-1 bg-slate-250 dark:bg-slate-800 rounded-full mx-auto mb-5" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-display mb-0.5">Edit Customer Details</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Update merchant account metadata parameters.</p>
              
              {editError && (
                <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-xs font-semibold p-3 rounded-lg mb-4">
                  {editError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-855 dark:text-white text-xs font-semibold outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-lg cursor-pointer outline-none focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center outline-none focus:outline-none transition-colors"
                >
                  {savingEdit ? "Saving..." : "Save Changes ✓"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cash Payment Drawer slide-up */}
      <AnimatePresence>
        {isRecordingPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRecordingPayment(false)}
              className="fixed inset-0 bg-black z-45"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[24px] p-5 pb-10 z-50 shadow-2xl border-t border-slate-100 dark:border-slate-800/80"
            >
              <div className="w-12 h-1 bg-slate-250 dark:bg-slate-800 rounded-full mx-auto mb-5" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-display mb-0.5">
                {entryType === 'payment' ? 'Record Cash Payment' : 'Give Credit (Udhaar)'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
                {entryType === 'payment' ? 'Record cash received from this customer.' : 'Record new credit/udhaar given to this customer.'}
              </p>

              {paymentError && (
                <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-xs font-semibold p-3 rounded-lg mb-4">
                  {paymentError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Customer</label>
                  <input
                    type="text"
                    value={customer.name}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-400 text-xs font-semibold outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="500"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Notes (Optional)</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder={`${customer.name} ne 500 cash diye`}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsRecordingPayment(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-lg cursor-pointer outline-none focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={savingPayment}
                  className={`flex-1 py-2.5 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center outline-none focus:outline-none transition-colors ${
                    entryType === 'payment' ? 'bg-indigo-600 hover:bg-indigo-750' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {savingPayment ? "Saving..." : entryType === 'payment' ? "Save Payment ✓" : "Save Credit ✓"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
