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
      <div className="h-2 bg-slate-105 dark:bg-slate-900 rounded-full overflow-hidden">
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

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit customer details drawer states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Reminder review drawer states
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTone, setReminderTone] = useState("friendly");
  const [reminderMsg, setReminderMsg] = useState("");

  const generatePresetMessage = (customerName, amount, tone) => {
    const shopName = user?.shopName || "Our Store";
    const userLang = user?.language || "en";

    // Multilingual message templates
    const langTemplates = {
      en: {
        friendly: `Namaste ${customerName},\n\nThis is a reminder from ${shopName}.\n\nYour pending amount is ₹${amount.toLocaleString()}.\n\nPlease complete the payment.\n\nSupported by VoiceKhata`,
        firm: `Namaste ${customerName},\n\nThis is an important reminder from ${shopName}.\n\nYour outstanding balance of ₹${amount.toLocaleString()} is overdue. Please settle this payment today to maintain your credit record.\n\nSupported by VoiceKhata`,
        urgent: `Namaste ${customerName},\n\nThis is an URGENT notice from ${shopName}.\n\nYour pending amount of ₹${amount.toLocaleString()} is severely overdue. Please complete the payment immediately.\n\nSupported by VoiceKhata`
      },
      hi: {
        friendly: `नमस्ते ${customerName},\n\nयह ${shopName} की तरफ से एक रिमाइंडर है।\n\nआपकी लंबित राशि ₹${amount.toLocaleString()} है।\n\nकृपया भुगतान पूरा करें।\n\nSupported by VoiceKhata`,
        firm: `नमस्ते ${customerName},\n\nयह ${shopName} की तरफ से एक महत्वपूर्ण रिमाइंडर है।\n\nआपका बकाया ₹${amount.toLocaleString()} अभी तक नहीं चुका है। कृपया आज ही भुगतान करें।\n\nSupported by VoiceKhata`,
        urgent: `नमस्ते ${customerName},\n\n${shopName} की तरफ से अत्यावश्यक सूचना।\n\nआपकी बकाया राशि ₹${amount.toLocaleString()} बहुत अधिक समय से लंबित है। तुरंत भुगतान करें।\n\nSupported by VoiceKhata`
      },
      ta: {
        friendly: `வணக்கம் ${customerName},\n\nஇது ${shopName} இலிருந்து ஒரு நினைவூட்டல் ஆகும்.\n\nஉங்கள் நிலுவையில் உள்ள தொகை ₹${amount.toLocaleString()} ஆகும்.\n\nதயவுசெய்து கட்டணத்தை முடிக்கவும்.\n\nSupported by VoiceKhata`,
        firm: `வணக்கம் ${customerName},\n\nஇது ${shopName} இலிருந்து முக்கியமான நினைவூட்டல்.\n\nஉங்கள் நிலுவை ₹${amount.toLocaleString()} இன்னும் செலுத்தப்படவில்லை. இன்றே செலுத்தவும்.\n\nSupported by VoiceKhata`,
        urgent: `வணக்கம் ${customerName},\n\n${shopName} இலிருந்து அவசர அறிவிப்பு.\n\nஉங்கள் நிலுவை ₹${amount.toLocaleString()} உடனடியாக செலுத்தவும்.\n\nSupported by VoiceKhata`
      },
      mr: {
        friendly: `नमस्ते ${customerName},\n\nहा ${shopName} कडून एक स्मरणपत्र आहे.\n\nतुमची प्रलंबित रक्कम ₹${amount.toLocaleString()} आहे.\n\nकृपया पेमेंट पूर्ण करा.\n\nSupported by VoiceKhata`,
        firm: `नमस्ते ${customerName},\n\nहे ${shopName} कडून महत्त्वाचे स्मरणपत्र आहे.\n\nतुमची थकबाकी ₹${amount.toLocaleString()} अद्याप भरली नाही. कृपया आज भरा.\n\nSupported by VoiceKhata`,
        urgent: `नमस्ते ${customerName},\n\n${shopName} कडून तातडीची सूचना.\n\nतुमची थकबाकी ₹${amount.toLocaleString()} खूप उशीर झालेली आहे. ताबडतोब भरा.\n\nSupported by VoiceKhata`
      },
      gu: {
        friendly: `નમસ્તે ${customerName},\n\nઆ ${shopName} તરફથી રીમાઇન્ડર છે.\n\nતમારી બાકી રકમ ₹${amount.toLocaleString()} છે.\n\nકૃપા કરીને ચુકવણી પૂર્ણ કરો.\n\nSupported by VoiceKhata`,
        firm: `નમસ્તે ${customerName},\n\nઆ ${shopName} તરફથી મહત્વપૂર્ણ રીમાઇન્ડર છે.\n\nતમારી બાકી ₹${amount.toLocaleString()} હજુ ચૂકવાઈ નથી. આજે ચૂકવો.\n\nSupported by VoiceKhata`,
        urgent: `નમસ્તે ${customerName},\n\n${shopName} તરફથી તાત્કાલિક સૂચના.\n\nતમારી બાકી ₹${amount.toLocaleString()} તરત ચૂકવો.\n\nSupported by VoiceKhata`
      },
      bho: {
        friendly: `प्रणाम ${customerName},\n\nई ${shopName} के तरफ से एगो रिमाइंडर बा।\n\nराउर बाकी रुपया ₹${amount.toLocaleString()} बा।\n\nकृपया भुगतान पूरा करीं।\n\nSupported by VoiceKhata`,
        firm: `प्रणाम ${customerName},\n\nई ${shopName} के तरफ से जरूरी संदेश बा।\n\nराउर ₹${amount.toLocaleString()} के बकाया अभियो ना भरल गइल। आज भरीं।\n\nSupported by VoiceKhata`,
        urgent: `प्रणाम ${customerName},\n\n${shopName} के तरफ से तुरंत सूचना।\n\nराउर ₹${amount.toLocaleString()} के बकाया तुरंते चुकाईं।\n\nSupported by VoiceKhata`
      }
    };

    const selectedLang = langTemplates[userLang] ? userLang : "en";
    return langTemplates[selectedLang][tone] || langTemplates[selectedLang].friendly;
  };

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
      const response = await apiClient.updateCustomer(id, { name: editName.trim(), phone: cleanPhone || null });
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

  const handleWhatsAppReminder = () => {
    setReminderTone("friendly");
    const initialMsg = generatePresetMessage(customer.name, customer.pending || 0, "friendly");
    setReminderMsg(initialMsg);
    setIsReminderOpen(true);
  };

  const handleToneChange = (tone) => {
    setReminderTone(tone);
    const updatedMsg = generatePresetMessage(customer.name, customer.pending || 0, tone);
    setReminderMsg(updatedMsg);
  };

  const handleSendReminder = async () => {
    try {
      const pendingCredit = customer.transactions && customer.transactions.find(
        tx => tx.type === 'credit' && tx.status !== 'paid'
      );
      const entryId = pendingCredit ? pendingCredit.id : undefined;
      const response = await apiClient.sendReminder(id, entryId, reminderTone, reminderMsg);
      
      if (response.success && response.data && response.data.whatsappLink) {
        window.open(response.data.whatsappLink, '_blank');
      } else {
        const cleanPhone = customer.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMsg)}`, '_blank');
      }
    } catch (err) {
      console.warn("Could not save live reminder to DB, opening native WhatsApp directly.", err);
      const cleanPhone = customer.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMsg)}`, '_blank');
    } finally {
      setIsReminderOpen(false);
      loadCustomerDetails();
    }
  };

  const loadCustomerDetails = async () => {
    try {
      const custRes = await apiClient.getCustomerById(id);
      if (custRes.success && custRes.data) {
        const c = custRes.data;
        const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        const entriesRes = await apiClient.getEntries({ customerId: id });
        let txs = [];
        const entriesList = entriesRes.data && (entriesRes.data.items || entriesRes.data.entries || entriesRes.data);
        
        if (entriesRes.success && Array.isArray(entriesList)) {
          txs = entriesList.map(e => {
            return {
              id: e._id,
              type: e.type,
              amount: e.amount,
              remainingAmount: e.remainingAmount,
              date: new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              note: e.note || (e.type === 'credit' ? 'Grocery items' : 'Payment received'),
              status: e.status
            };
          });
        }

        // Load active reminders history from server to show in reminders timeline
        let remindersList = [];
        try {
          const remindersRes = await apiClient.getCustomerReminders(id);
          if (remindersRes.success && Array.isArray(remindersRes.data)) {
            remindersList = remindersRes.data.map(r => ({
              id: r._id,
              sentAt: new Date(r.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ", " + new Date(r.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              status: r.status,
              message: r.message
            }));
          }
        } catch (e) {
          console.warn("Could not fetch reminders history");
        }

        // Calculate cycle-based active/settled balances
        const unpaidCredits = txs.filter(tx => tx.type === 'credit' && tx.status !== 'paid');
        let pendingBal = c.totalOwed || 0;
        let paidBal = 0;
        let totalCreditBal = 0;

        if (unpaidCredits.length > 0) {
          totalCreditBal = unpaidCredits.reduce((sum, tx) => sum + tx.amount, 0);
          paidBal = Math.max(0, totalCreditBal - pendingBal);
        } else {
          // All credits are paid, show the most recent credit's details as the last settled cycle
          const creditTxs = txs.filter(tx => tx.type === 'credit');
          if (creditTxs.length > 0) {
            const lastCredit = creditTxs[0]; // transactions are sorted newest first
            totalCreditBal = lastCredit.amount;
            paidBal = lastCredit.amount;
          }
        }

        setCustomer({
          id: c._id,
          name: c.name,
          phone: c.phone || 'No phone number',
          avatar: initials,
          color: "from-[#4285F4] to-indigo-650",
          pending: pendingBal,
          totalPaid: paidBal,
          totalCredit: totalCreditBal,
          risk: c.riskScore || 'low',
          daysOverdue: c.riskScore === 'high' ? 12 : 0,
          transactions: txs,
          reminders: remindersList
        });
      }
    } catch (err) {
      console.warn("Could not fetch customer details from API, using offline mock data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerDetails();
  }, [id]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-28 relative">
        {/* Skeleton Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-900 px-5 pt-12 pb-7">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.back()} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer">
              <ArrowLeft size={15} className="text-slate-400" />
            </button>
          </div>
          <div className="flex items-center gap-3.5 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-slate-800" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-slate-800 rounded" />
              <div className="w-24 h-3 bg-slate-800 rounded" />
            </div>
          </div>
        </div>
        {/* Skeleton Body */}
        <div className="px-5 pt-5 space-y-4 animate-pulse">
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-28 overflow-hidden relative transition-colors duration-200">
      
      {/* Sleek Flat Obsidian Panel Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-900 dark:border-slate-800/80 px-5 pt-12 pb-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4285F4]/5 rounded-full blur-2xl pointer-events-none" />
        
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
                <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight font-display">{customer.name}</h1>
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
            { label: "Total Credit", val: `₹${customer.totalCredit.toLocaleString()}`, color: "text-[#4285F4]", bg: "bg-[#4285F4]/5 border-[#4285F4]/10" },
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
            className="py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-800 dark:text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none transition-colors"
          >
            <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-3.5 h-3.5 object-contain" /> Remind
          </button>
          <button 
            onClick={() => {
              setPaymentAmount("");
              setPaymentNotes("");
              setPaymentError("");
              setEntryType("payment");
              setIsRecordingPayment(true);
            }} 
            className="py-3 bg-[#4285F4] hover:bg-[#3367D6] text-slate-800 dark:text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer outline-none focus:outline-none transition-colors"
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
            className="py-3 bg-orange-500 hover:bg-orange-600 text-slate-800 dark:text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer outline-none focus:outline-none transition-colors"
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
            className={`py-2.5 bg-slate-900 border border-slate-800 text-slate-800 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none ${simulatingUPI ? "opacity-60" : ""}`}
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
            className="mb-5 bg-[#4285F4]/5 border border-[#4285F4]/10 rounded-xl p-3 flex items-center gap-2.5"
          >
            <span className="w-3.5 h-3.5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-[10px] text-[#3367D6] dark:text-[#4285F4] font-bold uppercase tracking-wider">Simulating Paytm webhook auto-update for ₹500...</p>
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
                      r.status === "delivered" ? "bg-indigo-50/50 text-[#4285F4] border-indigo-100 dark:bg-indigo-950/20 dark:text-[#4285F4] dark:border-indigo-900/30" :
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
              className="fixed inset-0 bg-black z-55"
            />
            <motion.div
              initial={{ y: "100%", x: "-50%" }}
              animate={{ y: 0, x: "-50%" }}
              exit={{ y: "100%", x: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-1/2 w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-[24px] p-5 pb-16 z-60 shadow-2xl border-t border-slate-100 dark:border-slate-800/80 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-slate-250 dark:bg-slate-800 rounded-full mx-auto mb-5" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-800 dark:text-white uppercase tracking-wider font-display mb-0.5">Edit Customer Details</h3>
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-[#4285F4] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-855 dark:text-white text-xs font-semibold outline-none focus:border-[#4285F4] transition-colors"
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
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-[#3367D6] text-slate-800 dark:text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center outline-none focus:outline-none transition-colors"
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
              className="fixed inset-0 bg-black z-55"
            />
            <motion.div
              initial={{ y: "100%", x: "-50%" }}
              animate={{ y: 0, x: "-50%" }}
              exit={{ y: "100%", x: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-1/2 w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-[24px] p-5 pb-16 z-60 shadow-2xl border-t border-slate-100 dark:border-slate-800/80 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-slate-250 dark:bg-slate-800 rounded-full mx-auto mb-5" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-800 dark:text-white uppercase tracking-wider font-display mb-0.5">
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-400 text-xs font-semibold outline-none cursor-not-allowed"
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
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-[#4285F4] transition-all"
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-[#4285F4] transition-all"
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
                  className={`flex-1 py-2.5 text-slate-800 dark:text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center outline-none focus:outline-none transition-colors ${
                    entryType === 'payment' ? 'bg-[#4285F4] hover:bg-[#3367D6]' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {savingPayment ? "Saving..." : entryType === 'payment' ? "Save Payment ✓" : "Save Credit ✓"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-Up Message Review & Verification Drawer */}
      <AnimatePresence>
        {isReminderOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReminderOpen(false)}
              className="fixed inset-0 bg-black z-45"
            />
            <motion.div
              initial={{ y: "100%", x: "-50%" }}
              animate={{ y: 0, x: "-50%" }}
              exit={{ y: "100%", x: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-1/2 w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-[24px] p-5 pb-16 z-50 shadow-2xl border-t border-slate-100 dark:border-slate-800/80 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-slate-250 dark:bg-slate-800 rounded-full mx-auto mb-5" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-800 dark:text-white uppercase tracking-wider font-display mb-0.5">Verify Reminder Message</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mb-5">Review, select tone and verify the message before sending on WhatsApp.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Select Message Tone</label>
                  <div className="flex gap-2">
                    {["friendly", "firm", "urgent"].map(tone => (
                      <button
                        key={tone}
                        onClick={() => handleToneChange(tone)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer capitalize outline-none focus:outline-none ${
                          reminderTone === tone
                            ? "bg-[#4285F4] text-white border-[#4285F4] shadow-sm"
                            : "bg-slate-50 dark:bg-slate-955 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Reminder Text (Editable)</label>
                  <textarea
                    rows={6}
                    value={reminderMsg}
                    onChange={(e) => setReminderMsg(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white text-xs font-semibold outline-none focus:border-[#4285F4] transition-colors resize-none leading-relaxed font-sans"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsReminderOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 font-bold text-xs rounded-lg cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReminder}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-800 dark:text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5 outline-none transition-colors border-0"
                >
                  <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-3.5 h-3.5 object-contain" /> Confirm & Send
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
