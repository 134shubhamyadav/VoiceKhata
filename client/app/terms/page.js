"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Scale, Globe, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingBlobs } from "@/components/ui";

export default function TermsOfServicePage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: Scale,
      content: "By creating an account, accessing, or using VoiceKhata, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the services. These terms apply to all merchants, shop owners, and users of the application."
    },
    {
      title: "2. Description of Service",
      icon: BookOpen,
      content: "VoiceKhata provides an AI-powered voice-first bookkeeping assistant for modern Indian merchants. The service enables voice transcription of transaction entries, ledger recording, automated WhatsApp payment reminder generations, and business visiting card creation. We reserve the right to modify, suspend, or discontinue any feature at our discretion."
    },
    {
      title: "3. User Account Security",
      icon: ShieldCheck,
      content: "You are responsible for maintaining the confidentiality of your mobile authentication codes, Google accounts, and Firebase login credentials. You agree to accept responsibility for all bookkeeping entries, transactions, and WhatsApp reminders sent or recorded under your merchant profile."
    },
    {
      title: "4. Permitted Use & Data Accuracy",
      icon: Globe,
      content: "Merchant ledger entries must reflect genuine credit (udhaar) and payment details. You represent that all transaction entries recorded by voice or manual inputs are accurate and lawfully recorded. VoiceKhata does not assume liability for customer balance disputes resulting from incorrect merchant inputs."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pb-16 relative overflow-hidden transition-colors duration-200">
      <FloatingBlobs />
      
      {/* Radial overlay */}
      <div className="absolute w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] top-10 right-10 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-slate-500/5 rounded-full blur-[80px] bottom-10 left-10 pointer-events-none" />

      <div className="relative z-10 px-6 pt-12 pb-4 max-w-[500px] mx-auto">
        {/* Header toolbar */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/")} 
            className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-all hover:bg-white/10"
          >
            <ArrowLeft size={15} className="text-slate-400" />
          </button>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Legal Framework</span>
        </div>

        {/* Hero title */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white leading-tight font-display tracking-tight">
            Terms of Service
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
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4.5"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Icon size={14} />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">{content}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom signoff */}
        <div className="text-center bg-slate-950 border border-slate-900 rounded-2xl p-4">
          <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
            If you have any questions regarding these merchant terms, please email our security team at legal@voicekhata.in
          </p>
        </div>
      </div>
    </div>
  );
}
