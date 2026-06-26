"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Globe, Bell, Mic, Shield, ChevronRight, Store, Phone, LogOut, Moon, Zap, CreditCard, Mail, X } from "lucide-react";
import { Toggle, FloatingBlobs } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/apiClient";

const languages = ["English", "Hindi", "Marathi"];

function SettingSection({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">{title}</p>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, value, action, toggle, onToggle, last, color = "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" }) {
  return (
    <motion.div whileTap={action ? { backgroundColor: "rgba(0,0,0,0.02)" } : undefined}
      onClick={action}
      className={`flex items-center gap-3 px-4 py-3.5 ${!last ? "border-b border-slate-50 dark:border-slate-700/30" : ""} ${action ? "cursor-pointer" : ""}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        {value && <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{value}</p>}
      </div>
      {toggle !== undefined ? (
        <Toggle enabled={toggle} onChange={onToggle} />
      ) : action ? (
        <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
      ) : null}
    </motion.div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, completeMerchantOnboarding, logout } = useAuth();
  const [lang, setLang] = useState("English");
  const [notifications, setNotifications] = useState(true);
  const [autoReminder, setAutoReminder] = useState(true);
  const [voiceConfirm, setVoiceConfirm] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  // Dynamic Merchant Profile State
  const [profile, setProfile] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
    profilePhoto: "",
    upiId: ""
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editShopName, setEditShopName] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editUpiId, setEditUpiId] = useState("");
  const [editProfilePhoto, setEditProfilePhoto] = useState("");

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // Sync settings states with authenticated user profile from backend
  useEffect(() => {
    if (user) {
      const languageMap = {
        en: "English",
        hi: "Hindi",
        mr: "Marathi"
      };
      setLang(languageMap[user.language] || "English");
      setProfile({
        shopName: user.shopName || "",
        ownerName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        profilePhoto: user.profilePhoto || "",
        upiId: user.upiId || localStorage.getItem("voicekhata_upi_id") || ""
      });
    }
  }, [user]);

  useEffect(() => {
    // Load active dark theme class
    if (typeof window !== 'undefined') {
      const activeTheme = localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
      setDarkMode(activeTheme);
      
      const savedConfirm = localStorage.getItem('voicekhata_voice_confirm');
      if (savedConfirm !== null) {
        setVoiceConfirm(savedConfirm === 'true');
      }
    }
  }, []);

  const handleDarkToggle = (val) => {
    setDarkMode(val);
    if (typeof window !== 'undefined') {
      if (val) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  const handleLanguageChange = async (selectedLang) => {
    setLang(selectedLang);
    const resolvedLanguage = 
      selectedLang === "English" ? "en" :
      selectedLang === "Hindi" ? "hi" :
      selectedLang === "Marathi" ? "mr" : "en";

    if (completeMerchantOnboarding && user) {
      try {
        await completeMerchantOnboarding({
          name: profile.ownerName || user.name || "Merchant",
          shopName: profile.shopName || "My Store",
          language: resolvedLanguage,
          businessType: user.businessType || "Kirana"
        });
        console.log(`[Settings] Language updated successfully on backend to: ${resolvedLanguage}`);
      } catch (err) {
        console.error("Failed to update language on backend:", err.message);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!editShopName.trim() || !editOwnerName.trim()) return;
    
    const resolvedLanguage = 
      lang === "English" ? "en" :
      lang === "Hindi" ? "hi" :
      lang === "Marathi" ? "mr" : "en";

    const updated = {
      ...profile,
      shopName: editShopName.trim(),
      ownerName: editOwnerName.trim(),
      phone: editPhone.trim(),
      upiId: editUpiId.trim(),
      profilePhoto: editProfilePhoto
    };

    setProfile(updated);
    if (updated.upiId) {
      localStorage.setItem("voicekhata_upi_id", updated.upiId);
    } else {
      localStorage.removeItem("voicekhata_upi_id");
    }
    setIsEditingProfile(false);

    if (completeMerchantOnboarding && user) {
      try {
        await completeMerchantOnboarding({
          name: updated.ownerName,
          shopName: updated.shopName,
          language: resolvedLanguage,
          phone: updated.phone || undefined,
          email: user.email || undefined,
          profilePhoto: updated.profilePhoto || undefined,
          upiId: updated.upiId || undefined,
          businessType: user.businessType || "Kirana"
        });
        console.log("[Settings] Profile updated successfully on backend.");
      } catch (err) {
        console.error("Failed to update profile on backend:", err.message);
      }
    }
  };

  const handleClearDemoData = async () => {
    if (window.confirm("Are you sure you want to clear all demo data? This will delete all your entries, customers, and reminders.")) {
      setIsClearing(true);
      try {
        await apiClient.clearDemoData();
        alert("Demo data cleared successfully. Logging out...");
        logout();
      } catch (err) {
        alert("Failed to clear data: " + err.message);
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-28 relative transition-colors duration-200">
      <FloatingBlobs />
      <div className="relative z-10 px-4 pt-12 pb-4">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-1">Settings</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">App preferences & account</p>

        {/* Profile card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-violet-600 to-indigo-800 rounded-3xl p-5 mb-6 relative overflow-hidden shadow-lg shadow-violet-200/40 dark:shadow-none"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="Profile Photo" className="w-full h-full object-cover" />
                ) : (
                  <Store size={26} className="text-white" />
                )}
              </div>
              <div>
                <p className="text-slate-800 dark:text-white font-black text-base leading-tight">{profile.shopName || "My Store"}</p>
                <p className="text-violet-200 text-xs mt-1 truncate max-w-[170px]">{profile.phone || profile.email || "No contact info"}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setEditShopName(profile.shopName);
                setEditOwnerName(profile.ownerName);
                setEditPhone(profile.phone);
                setEditUpiId(profile.upiId);
                setEditProfilePhoto(profile.profilePhoto || "");
                setIsEditingProfile(true);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer outline-none"
            >
              Edit Profile
            </button>
          </div>
        </motion.div>

        {/* Shop info */}
        <SettingSection title="Shop Information">
          <SettingRow icon={Store} label="Shop Name" value={profile.shopName || "Not set"} action={() => setIsEditingProfile(true)} />
          <SettingRow icon={User} label="Owner Name" value={profile.ownerName || "Not set"} action={() => setIsEditingProfile(true)} />
          {profile.email && <SettingRow icon={Mail} label="Email Address" value={profile.email} action={null} />}
          <SettingRow icon={Phone} label="Mobile Number" value={profile.phone || "Not set"} action={() => setIsEditingProfile(true)} />
          <SettingRow icon={CreditCard} label="UPI ID" value={profile.upiId || "Not set"} action={() => setIsEditingProfile(true)} last color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
        </SettingSection>

        {/* Language */}
        <SettingSection title="Preferred Language">
          <div className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-semibold">Select your ledger interface language</p>
            <div className="grid grid-cols-3 gap-2">
              {languages.map(l => (
                <button key={l} onClick={() => handleLanguageChange(l)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    lang === l
                      ? "bg-gradient-to-r from-violet-600 to-[#3367D6] text-white shadow-md shadow-violet-100 dark:shadow-none"
                      : "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </SettingSection>

        {/* Appearance */}
        <SettingSection title="Appearance">
          <SettingRow 
            icon={Moon} 
            label="Dark Mode" 
            toggle={darkMode} 
            onToggle={handleDarkToggle}
            color="bg-slate-800 text-white dark:bg-slate-700 dark:text-slate-200" 
            last 
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingRow icon={Bell} label="Push Notifications" value="Payment alerts, reminders" toggle={notifications} onToggle={setNotifications} color="bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400" />
          <SettingRow icon={Zap} label="Auto Reminders" value="WhatsApp & SMS" toggle={autoReminder} onToggle={setAutoReminder} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" last />
        </SettingSection>

        {/* Voice settings */}
        <SettingSection title="Voice Settings">
          <SettingRow icon={Mic} label="Voice Confirmation" value="Confirm before saving" toggle={voiceConfirm} onToggle={(val) => {
            setVoiceConfirm(val);
            if (typeof window !== 'undefined') {
              localStorage.setItem('voicekhata_voice_confirm', val.toString());
            }
          }} color="bg-violet-50 text-violet-500 dark:bg-violet-950/40 dark:text-violet-400" />
          <SettingRow icon={Globe} label="Voice Language" value={lang} action={() => {}} last />
        </SettingSection>


        {/* Clear Demo Data - Only visible to demo accounts */}
        {user?.isDemo && (
          <div className="mb-4">
            <motion.button 
              whileTap={{ scale: 0.97 }}
              onClick={handleClearDemoData}
              disabled={isClearing}
              className="w-full py-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-950/40 text-orange-600 dark:text-orange-500 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none"
            >
              <Shield size={16} /> {isClearing ? "Clearing Data..." : "Clear Demo Data"}
            </motion.button>
            <p className="text-center text-[10px] text-slate-400 mt-2 px-4">
              Demo Mode Disclaimer: This clears all your entries, customers, and reminders for instant demo reset. This action cannot be undone.
            </p>
          </div>
        )}

        {/* Logout */}
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          className="w-full py-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40 text-red-500 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 mb-4 cursor-pointer outline-none focus:outline-none border-0"
        >
          <LogOut size={16} /> Logout
        </motion.button>

        <p className="text-center text-[10px] text-slate-300 dark:text-slate-600">VoiceKhata • Made with ❤️ for Bharat</p>
      </div>

      {/* Edit Profile Drawer */}
      <AnimatePresence>
        {isEditingProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingProfile(false)}
              className="fixed inset-0 bg-black/60 z-55"
            />
            <motion.div
              initial={{ y: "100%", x: "-50%" }}
              animate={{ y: 0, x: "-50%" }}
              exit={{ y: "100%", x: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-1/2 w-full max-w-[430px] bg-white dark:bg-slate-800 rounded-t-[32px] p-6 pb-10 z-60 shadow-2xl border-t border-slate-100 dark:border-slate-700/50 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Edit Merchant Profile</h3>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 cursor-pointer border-0"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">Update your business info below.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Shop Name</label>
                  <input
                    type="text"
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    placeholder="Enter shop name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white text-sm font-semibold outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Owner Name</label>
                  <input
                    type="text"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    placeholder="Enter owner name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white text-sm font-semibold outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Enter mobile number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white text-sm font-semibold outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">UPI ID</label>
                  <input
                    type="text"
                    value={editUpiId}
                    onChange={(e) => setEditUpiId(e.target.value)}
                    placeholder="merchant@upi"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white text-sm font-semibold outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Profile Photo</label>
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                    <div className="w-14 h-14 bg-white/20 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-slate-600 flex-shrink-0">
                      {editProfilePhoto ? (
                        <img src={editProfilePhoto} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Store size={22} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        id="profile-photo-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditProfilePhoto(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="profile-photo-upload"
                        className="px-3.5 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-750 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors inline-block"
                      >
                        Choose Photo
                      </label>
                      {editProfilePhoto && (
                        <button
                          type="button"
                          onClick={() => setEditProfilePhoto("")}
                          className="ml-2.5 text-xs font-bold text-red-500 hover:text-red-600 cursor-pointer border-0 bg-transparent outline-none"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3.5 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors bg-transparent border-solid"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-[#3367D6] text-slate-800 dark:text-white font-bold text-xs rounded-xl shadow-md shadow-violet-100 hover:from-violet-700 hover:to-indigo-800 transition-all cursor-pointer flex items-center justify-center border-0 outline-none"
                >
                  Save Profile ✓
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
