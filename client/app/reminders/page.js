"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MessageCircle, Check, CheckCheck, Clock, Send, Bell, Zap, Plus, X, Edit3, ArrowRight, User, Trash2 } from "lucide-react";
import { Avatar, FloatingBlobs } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/apiClient";

function StatusIcon({ status }) {
  if (status === "delivered") return <CheckCheck size={13} className="text-blue-400" />;
  if (status === "read") return <CheckCheck size={13} className="text-emerald-500" />;
  if (status === "sent") return <Check size={13} className="text-slate-400" />;
  return <Clock size={13} className="text-amber-400" />;
}

function ReminderCard({ r, i, onEdit, onRefresh, onDelete }) {
  const statusColors = {
    delivered: "border-l-blue-400",
    read: "border-l-emerald-400",
    sent: "border-l-slate-300",
    pending: "border-l-amber-400",
  };

  const handleResend = async () => {
    try {
      if (r.customerId) {
        const response = await apiClient.sendReminder(r.customerId, r.entryId, r.tone || "friendly", r.message);
        if (response.success && response.data && response.data.whatsappLink) {
          window.open(response.data.whatsappLink, '_blank');
          if (onRefresh) onRefresh();
        }
      }
    } catch (err) {
      console.warn("Could not resend live reminder.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.08 }}
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden border-l-4 ${statusColors[r.status] || "border-l-slate-300"} mb-3`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar initials={r.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.customer}</p>
              <div className="flex items-center gap-1">
                <StatusIcon status={r.status} />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{r.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black text-orange-500 dark:text-orange-400">₹{r.amount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[10px] text-red-400 dark:text-red-500 font-medium">{r.daysOverdue}d overdue</span>
              <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1">
                <MessageCircle size={9} className="text-green-500 dark:text-green-400" />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{r.channel}</span>
              </div>
            </div>

            {/* WhatsApp-style bubble */}
            <div className="bg-green-50/50 dark:bg-emerald-950/20 rounded-2xl rounded-tl-sm p-3 mb-2 border border-green-50/30 dark:border-emerald-900/10">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{r.message}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[9px] text-slate-400 dark:text-slate-500">{r.sentAt}</span>
                <StatusIcon status={r.status} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={handleResend} 
                className="flex-[2] py-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors outline-none focus:outline-none"
              >
                <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-3.5 h-3.5 object-contain" /> Resend
              </button>
              <button 
                onClick={() => onEdit(r)} 
                className="flex-[2] py-2 text-[11px] font-bold text-[#4285F4] dark:text-[#4285F4] bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors outline-none focus:outline-none"
              >
                <Edit3 size={11} /> Edit & Send
              </button>
              <button 
                onClick={() => onDelete(r.id)} 
                className="flex-[0.6] py-2 text-[11px] font-bold text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl flex items-center justify-center cursor-pointer transition-colors border-0 outline-none focus:outline-none"
                title="Delete Reminder Log"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RemindersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Creation States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  const [custBalance, setCustBalance] = useState(0);
  const [createTone, setCreateTone] = useState("friendly");
  const [createMsg, setCreateMsg] = useState("");

  // Manual Editing States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editMsg, setEditMsg] = useState("");

  async function loadReminders() {
    try {
      const response = await apiClient.getReminders();
      const items = response.data && response.data.items ? response.data.items : null;
      if (response.success && items) {
        const mapped = items.map(r => {
          const customerName = r.customerId ? r.customerId.name : 'Unknown';
          const initials = customerName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2);
          return {
            id: r._id,
            customerId: r.customerId ? r.customerId._id : null,
            entryId: r.entryId ? r.entryId._id : null,
            customer: customerName,
            avatar: initials,
            amount: r.snapshot && r.snapshot.amount !== null ? r.snapshot.amount : (r.customerId ? (r.customerId.totalOwed || 0) : 0),
            message: r.message,
            channel: r.channel || 'WhatsApp',
            sentAt: new Date(r.sentAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
            status: r.status || 'sent',
            tone: r.tone || 'friendly',
            daysOverdue: r.customerId && r.customerId.riskScore === 'high' ? 12 : 2
          };
        });
        setReminders(mapped);
      }
    } catch (err) {
      console.warn("Could not fetch sent reminders.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const response = await apiClient.getCustomers();
      if (response.success && response.data) {
        const list = Array.isArray(response.data) ? response.data : (response.data.items || []);
        setCustomers(list.filter(c => c.isActive !== false));
      }
    } catch (err) {
      console.warn("Could not load customers for dropdown");
    }
  }

  useEffect(() => {
    loadReminders();
    loadCustomers();
  }, []);

  // Preset Message Generator
  const generatePresetMessage = (customerName, amount, tone) => {
    const shopName = user?.shopName || "Our Store";
    const templates = {
      friendly: `Namaste ${customerName},\n\nThis is a reminder from ${shopName}.\n\nYour pending amount is ₹${amount}.\n\nPlease complete the payment.\n\nSupported by VoiceKhata`,
      firm: `Namaste ${customerName},\n\nThis is an important reminder from ${shopName}.\n\nYour outstanding balance of ₹${amount} is overdue. Please settle this payment today to maintain your credit record.\n\nSupported by VoiceKhata`,
      urgent: `Namaste ${customerName},\n\nThis is an URGENT notice from ${shopName}.\n\nYour pending amount of ₹${amount} is severely overdue. Please complete the payment immediately to avoid suspension of credit.\n\nSupported by VoiceKhata`
    };
    return templates[tone] || templates.friendly;
  };

  const handleSelectCustomer = (custId) => {
    const cust = customers.find(c => c._id === custId);
    if (cust) {
      setSelectedCust(cust);
      setCustBalance(cust.totalOwed || 0);
      const initialMsg = generatePresetMessage(cust.name, cust.totalOwed || 0, createTone);
      setCreateMsg(initialMsg);
    } else {
      setSelectedCust(null);
      setCustBalance(0);
      setCreateMsg("");
    }
  };

  const handleToneChange = (tone) => {
    setCreateTone(tone);
    if (selectedCust) {
      const updatedMsg = generatePresetMessage(selectedCust.name, custBalance, tone);
      setCreateMsg(updatedMsg);
    }
  };

  const handleCustomBalanceChange = (val) => {
    const amountNum = parseFloat(val) || 0;
    setCustBalance(amountNum);
    if (selectedCust) {
      const updatedMsg = generatePresetMessage(selectedCust.name, amountNum, createTone);
      setCreateMsg(updatedMsg);
    }
  };

  const handleCreateSubmit = async () => {
    if (!selectedCust) return;
    try {
      const response = await apiClient.sendReminder(selectedCust._id, null, createTone, createMsg);
      if (response.success && response.data) {
        if (response.data.whatsappLink) {
          window.open(response.data.whatsappLink, '_blank');
        }
        setIsCreateOpen(false);
        // Reset states
        setSelectedCust(null);
        setCustBalance(0);
        setCreateMsg("");
        // Reload history
        loadReminders();
      }
    } catch (err) {
      console.error("Failed to create reminder:", err.message);
    }
  };

  const handleEditClick = (reminder) => {
    setEditingReminder(reminder);
    setEditMsg(reminder.message);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingReminder) return;
    try {
      const response = await apiClient.sendReminder(
        editingReminder.customerId,
        editingReminder.entryId,
        editingReminder.tone,
        editMsg
      );
      if (response.success && response.data) {
        if (response.data.whatsappLink) {
          window.open(response.data.whatsappLink, '_blank');
        }
        setIsEditOpen(false);
        setEditingReminder(null);
        setEditMsg("");
        // Reload history
        loadReminders();
      }
    } catch (err) {
      console.error("Failed to update and send reminder:", err.message);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm("Are you sure you want to delete this reminder log manually?")) return;
    try {
      const response = await apiClient.deleteReminder(reminderId);
      if (response.success) {
        loadReminders();
      }
    } catch (err) {
      console.error("Failed to delete reminder:", err.message);
    }
  };

  const stats = [
    { label: "Sent Today", value: reminders.length, icon: Send, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { label: "Delivered", value: reminders.filter(r=>r.status==="delivered").length, icon: CheckCheck, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Pending", value: reminders.filter(r=>r.status==="pending").length, icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-28 relative transition-colors duration-200">
      <FloatingBlobs />
      <div className="relative z-10 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Reminders</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">{reminders.length} reminder{reminders.length !== 1 ? 's' : ''} today</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-[#3367D6] hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md shadow-blue-200 dark:shadow-none cursor-pointer border-0 outline-none focus:outline-none"
          >
            <Plus size={14} /> New Reminder
          </motion.button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-5">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-800/80 text-center">
              <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mx-auto mb-1.5`}>
                <Icon size={15} />
              </div>
              <p className="text-lg font-black text-slate-800 dark:text-white">{value}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* AI suggestion */}
        <div className="bg-gradient-to-r from-[#4285F4] to-blue-700 rounded-2xl p-4 mb-5 relative overflow-hidden shadow-md shadow-indigo-100 dark:shadow-none">
          <div className="absolute right-0 top-0 w-20 h-20 bg-white/10 rounded-full -translate-y-4 translate-x-4" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/25 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell size={17} className="text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-bold mb-0.5">AI Suggestion</p>
              <p className="text-blue-100 dark:text-blue-200 text-[11px] leading-relaxed font-semibold">Sending reminders on Tuesday mornings gets 34% better response rates</p>
            </div>
          </div>
        </div>

        {/* Reminder list with zero-state checker */}
        {loading ? (
          <div className="text-center py-16">
            <Clock size={28} className="mx-auto mb-3 animate-spin text-slate-400" />
            <p className="text-xs font-bold text-slate-450 dark:text-slate-500">Loading history...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 mb-5">
            <Bell size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-xs font-bold text-slate-750 dark:text-slate-200">No reminders pending</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">All customer accounts are perfectly settled and organized.</p>
          </div>
        ) : (
          reminders.map((r, i) => (
            <ReminderCard 
              key={r.id || i} 
              r={r} 
              i={i} 
              onEdit={handleEditClick} 
              onRefresh={loadReminders} 
              onDelete={handleDeleteReminder}
            />
          ))
        )}
      </div>

      {/* Slide-Up Drawer for Create Reminder */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-black/60 z-55"
            />
            <motion.div
              initial={{ y: "100%", x: "-50%" }}
              animate={{ y: 0, x: "-50%" }}
              exit={{ y: "100%", x: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-1/2 w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-10 z-60 shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Create Custom Reminder</h3>
                <button 
                  onClick={() => setIsCreateOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 cursor-pointer border-0"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">Manually dispatch reminders with full edit control.</p>

              <div className="space-y-4 mb-6">
                {/* Customer Dropdown */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Select Customer</label>
                  <select
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    defaultValue=""
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-white text-sm font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-400">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {c.name} {c.phone ? `(${c.phone})` : ""} - Pending: ₹{(c.totalOwed || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCust && (
                  <>
                    {/* Amount Input */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Remind Amount (Rupees)</label>
                      <input
                        type="number"
                        value={custBalance}
                        onChange={(e) => handleCustomBalanceChange(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Tone Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Reminder Tone</label>
                      <div className="flex gap-2">
                        {["friendly", "firm", "urgent"].map(t => (
                          <button
                            key={t}
                            onClick={() => handleToneChange(t)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer capitalize outline-none focus:outline-none ${
                              createTone === t
                                ? "bg-gradient-to-r from-blue-600 to-[#3367D6] text-white border-transparent shadow-sm"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-250 dark:border-slate-800/80"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Editable Custom Message */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Reminder Message (Editable)</label>
                      <textarea
                        rows={6}
                        value={createMsg}
                        onChange={(e) => setCreateMsg(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs font-semibold outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed font-sans"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-3.5 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent border-solid outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubmit}
                  disabled={!selectedCust}
                  className={`flex-1 py-3.5 text-slate-800 dark:text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all border-0 outline-none focus:outline-none ${
                    selectedCust
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-100 dark:shadow-none"
                      : "bg-slate-200 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-800/60 shadow-none cursor-not-allowed"
                  }`}
                >
                  <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-3.5 h-3.5 object-contain" /> Send & Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-Up Drawer for Edit Reminder */}
      <AnimatePresence>
        {isEditOpen && editingReminder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditOpen(false)}
              className="fixed inset-0 bg-black/60 z-55"
            />
            <motion.div
              initial={{ y: "100%", x: "-50%" }}
              animate={{ y: 0, x: "-50%" }}
              exit={{ y: "100%", x: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-1/2 w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-10 z-60 shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Edit & Resend Reminder</h3>
                <button 
                  onClick={() => setIsEditOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 cursor-pointer border-0"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">Modify the reminder text manually before resending.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Customer</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-4 py-3.5 rounded-xl border border-slate-250 dark:border-slate-800">
                    <User size={14} className="text-slate-400" /> {editingReminder.customer} (Pending: ₹{editingReminder.amount.toLocaleString()})
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Reminder Message (Editable)</label>
                  <textarea
                    rows={6}
                    value={editMsg}
                    onChange={(e) => setEditMsg(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-white text-xs font-semibold outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed font-sans"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-3.5 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent border-solid outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-1.5 cursor-pointer border-0 outline-none focus:outline-none"
                >
                  <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-3.5 h-3.5 object-contain" /> Send & Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
