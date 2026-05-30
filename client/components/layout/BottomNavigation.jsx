"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, Users, Bell, Settings } from "lucide-react";
import VoiceMicButton from "../voice/VoiceMicButton";

const tabs = [
  { label: "Home", icon: LayoutGrid, path: "/dashboard" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Voice", icon: null, path: "/voice" }, // Center custom AI voice centerpiece
  { label: "Reminders", icon: Bell, path: "/reminders" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide nav on pages that use full-screen drawers or don't need it
  const hiddenPaths = ["/", "/confirm", "/success", "/login", "/voice", "/terms", "/privacy"];
  if (hiddenPaths.includes(pathname)) return null;
  // Also hide on dynamic customer detail pages
  if (pathname.startsWith("/customers/") && pathname !== "/customers") return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-5 pb-5">
      {/* High-fidelity ultra-thin floating bar */}
      <div className="bg-white/90 dark:bg-slate-950/95 backdrop-blur-xl rounded-[24px] shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-slate-200/50 dark:border-slate-900 px-3.5 py-1.5 relative flex items-center justify-between">
        
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.path) || (tab.path === "/dashboard" && pathname === "/dashboard");
          const Icon = tab.icon;
          const isVoice = tab.path === "/voice";

          if (isVoice) {
            return (
              <div key={tab.path} className="relative flex flex-col items-center justify-center -translate-y-4">
                <VoiceMicButton 
                  onClick={() => router.push("/voice")} 
                  isActive={pathname === "/voice"}
                />
              </div>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className="relative flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-xl transition-all cursor-pointer outline-none focus:outline-none"
            >
              {/* Soft spring micro-pill background */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              
              <Icon
                size={18}
                className={`relative z-10 mb-1 transition-all duration-200 ${
                  isActive 
                    ? "text-indigo-600 dark:text-indigo-400 scale-102" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-500"
                }`}
              />
              
              <span
                className={`relative z-10 text-[9px] font-bold tracking-tight transition-colors ${
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
