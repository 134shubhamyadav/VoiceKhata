"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Eye, Lock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingBlobs } from "@/components/ui";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Information We Collect",
      icon: Eye,
      content: "We collect merchant profile metadata (owner name, shop name, business type, language choice) and transaction ledger records (amount, notes, due dates). We also temporarily process voice audio recordings strictly to transcribe them into ledger entries via Google Gemini AI."
    },
    {
      title: "2. How We Use Information",
      icon: RefreshCw,
      content: "All collected data is utilized exclusively to maintain your merchant bookkeeping accounts, generate business visiting cards, run balance self-healing routines, and construct automated payment reminder templates for WhatsApp dispatch."
    },
    {
      title: "3. Data Sharing & Privacy",
      icon: Shield,
      content: "VoiceKhata respects your ledger privacy. We do not sell, rent, or trade merchant ledger logs or contact details. Voice transcription queries are routed securely to AI endpoints, and WhatsApp reminders are triggered entirely client-side via your own device's WhatsApp application."
    },
    {
      title: "4. Security & Persistence",
      icon: Lock,
      content: "Ledger databases are secured using industry-standard encryption protocols. We use ACID transactions to guarantee that credit and payment entries are saved consistently. Your merchant data is retained securely until you request account deletion."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-white pb-16 relative overflow-hidden transition-colors duration-200">
      <FloatingBlobs />
      
      {/* Radial overlay */}
      <div className="absolute w-72 h-72 bg-[#4285F4]/5 rounded-full blur-[80px] top-10 right-10 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-slate-500/5 rounded-full blur-[80px] bottom-10 left-10 pointer-events-none" />

      <div className="relative z-10 px-6 pt-12 pb-4 max-w-[500px] mx-auto">
        {/* Header toolbar */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/")} 
            className="w-8 h-8 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-all hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm dark:shadow-none"
          >
            <ArrowLeft size={15} className="text-slate-400" />
          </button>
          <span className="text-[10px] text-[#4285F4] font-bold uppercase tracking-wider">Legal Framework</span>
        </div>

        {/* Hero title */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight font-display tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1.5">Last Updated: May 2026</p>
        </div>

        {/* Core content */}
        <div className="space-y-5 mb-8">
          {sections.map(({ title, icon: Icon, content }, idx) => (
            <motion.div 
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 bg-[#4285F4]/10 rounded-lg flex items-center justify-center text-[#4285F4] flex-shrink-0">
                  <Icon size={14} />
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{title}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">{content}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom signoff */}
        <div className="text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
          <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
            If you have questions regarding data privacy or want to request account deletion, please email support at 134shubhamyafav@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
