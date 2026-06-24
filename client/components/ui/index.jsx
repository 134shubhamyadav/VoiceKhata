"use client";
import { motion } from "framer-motion";

// Premium Button Component
export function Button({ children, variant = "primary", className = "", onClick, disabled, size = "md" }) {
  const variants = {
    primary: "bg-[#4285F4] hover:bg-[#3367D6] text-white shadow-sm shadow-[#4285F4]/10 active:shadow-none border border-[#3367D6]/20 dark:bg-[#4285F4] dark:hover:bg-[#4285F4]",
    secondary: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/80",
    ghost: "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/10 border border-red-600/20",
    accent: "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/10 border border-orange-600/20",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/10 border border-emerald-600/20",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs font-semibold rounded-lg",
    md: "px-4.5 py-2.5 text-sm font-semibold rounded-xl",
    lg: "px-6 py-3.5 text-base font-semibold rounded-2xl",
  };
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all cursor-pointer outline-none focus:outline-none select-none ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </motion.button>
  );
}

// Flat Minimalist Card
export function Card({ children, className = "", onClick, glass = false }) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`rounded-2xl transition-all ${
        glass 
          ? "glass shadow-sm" 
          : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      } ${onClick ? "cursor-pointer hover:border-slate-200 dark:hover:border-slate-700/80" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Stats Card Redesign
export function StatsCard({ label, value, sub, icon, color = "blue", trend }) {
  const colors = {
    blue: "text-[#4285F4] bg-indigo-50 border-indigo-100/50 dark:text-[#4285F4] dark:bg-indigo-950/20 dark:border-indigo-900/30",
    orange: "text-orange-600 bg-orange-50 border-orange-100/50 dark:text-orange-400 dark:bg-orange-950/20 dark:border-orange-900/30",
    green: "text-emerald-600 bg-emerald-50 border-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30",
    red: "text-red-600 bg-red-50 border-red-100/50 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/30",
    violet: "text-[#4285F4] bg-indigo-50 border-indigo-100/50 dark:text-[#4285F4] dark:bg-indigo-950/20 dark:border-indigo-900/30",
  };
  return (
    <Card className="p-4.5">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[color] || colors.blue}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            trend > 0 
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
              : "bg-red-50 text-red-500 border border-red-100/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
          }`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-slate-800 dark:text-slate-800 dark:text-white font-display mt-3.5 tracking-tight">{value}</div>
      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
    </Card>
  );
}

// Risk Badge Redesign
export function RiskBadge({ level }) {
  const cfg = {
    high: "bg-red-50/50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
    medium: "bg-amber-50/50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    low: "bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
  };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${cfg[level] || cfg.low}`}>
      {level} risk
    </span>
  );
}

// Rounded-Square Avatar
export function Avatar({ initials, color = "from-[#4285F4] to-[#4285F4]", size = "md" }) {
  const sizes = { 
    sm: "w-8 h-8 text-xs rounded-lg", 
    md: "w-10 h-10 text-sm rounded-xl", 
    lg: "w-12 h-12 text-base rounded-2xl" 
  };
  return (
    <div className={`bg-gradient-to-br ${color} flex items-center justify-center font-bold text-slate-800 dark:text-white flex-shrink-0 select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${sizes[size]}`}>
      {initials}
    </div>
  );
}

// Section Header Redesign
export function SectionHeader({ title, action, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display">{title}</h2>
      {action && (
        <button 
          onClick={action} 
          className="text-xs font-semibold text-[#4285F4] dark:text-[#4285F4] hover:text-[#3367D6] cursor-pointer transition-colors"
        >
          {actionLabel || "See all"}
        </button>
      )}
    </div>
  );
}

// Page Header Redesign
export function PageHeader({ title, subtitle, back, action }) {
  return (
    <div className="flex items-center justify-between mb-5 px-1">
      <div className="flex items-center gap-3">
        {back && (
          <button 
            onClick={back} 
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:border-slate-200 dark:hover:border-slate-700/80 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-400">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-base font-black text-slate-800 dark:text-slate-800 dark:text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// Thin Hairline Spinner Loader
export function Loader() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-6 h-6 border-2 border-indigo-100 border-t-[#4285F4] rounded-full animate-spin dark:border-indigo-900/30 dark:border-t-[#4285F4]" />
    </div>
  );
}

// Flat Toggle Component
export function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${enabled ? "bg-[#4285F4]" : "bg-slate-200 dark:bg-slate-800"}`}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-5 h-5 bg-white dark:bg-slate-300 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.1)] absolute top-0.5"
      />
    </button>
  );
}

// Modern Clean Input Component
export function Input({ label, placeholder, value, onChange, type = "text", icon }) {
  return (
    <div className="mb-4.5">
      {label && <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 flex items-center justify-center">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-slate-50/50 focus:bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] focus:outline-none focus:border-[#4285F4]/70 focus:ring-2 focus:ring-[#4285F4]/5 transition-all ${icon ? "pl-11 pr-4.5" : "px-4.5"}`}
        />
      </div>
    </div>
  );
}

// Flat Ambient Backdrop Layer (CRED/Notion style - opacity scaled down dramatically)
export function FloatingBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="blob w-72 h-72 bg-[#4285F4]/10 -top-20 -right-20 dark:bg-[#4285F4]/5" />
      <div className="blob w-56 h-56 bg-orange-500/10 bottom-20 -left-20 dark:bg-orange-500/5" />
    </div>
  );
}
