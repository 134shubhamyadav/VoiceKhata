"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Sparkles, ChevronRight, ArrowLeft, Mail, Phone, Store, Check } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// Waveform Animation for Splash Hero
function Waveform() {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {[4, 8, 12, 16, 10, 6, 12, 8, 5, 9, 14, 8, 4].map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-slate-700 dark:bg-slate-300"
          style={{ height: h * 2.5 }}
          animate={{ scaleY: [1, 1.4, 0.8, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { 
    user, 
    loading, 
    loginWithFirebaseToken, 
    completeMerchantOnboarding 
  } = useAuth();

  const [step, setStep] = useState("splash"); // splash, auth-selector, mobile-input, otp-verify, merchant-setup
  const [authMethod, setAuthMethod] = useState(""); // google, mobile
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6-digit state
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Merchant Onboarding Profile State
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [language, setLanguage] = useState("English");

  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  // Redirect and load state if already authenticated but onboarding incomplete
  useEffect(() => {
    if (user) {
      if (user.onboardingIncomplete) {
        setStep("merchant-setup");
        setOwnerName(user.name || "");
        setShopName(user.shopName || "");
      } else {
        window.location.href = "/dashboard";
      }
    }
  }, [user]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === "otp-verify" && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, resendTimer]);

  // OTP auto-focus and auto-submit
  const handleOtpChange = async (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Shift focus forward
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }

    // Auto submit once completely filled
    if (newOtp.every(val => val !== "")) {
      const submittedOtp = newOtp.join("");
      handleVerifyOtp(submittedOtp);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  /**
   * triggerGoogleAuth
   * Initiates Google OAuth2 authentication. 
   */
  const triggerGoogleAuth = async () => {
    try {
      setOtpError("");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      console.log("[Auth] Invoking Firebase Google Sign-in popup...");
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      console.log("[Auth] Firebase ID Token successfully retrieved.");

      const profile = await loginWithFirebaseToken(idToken);
      
      if (profile.onboardingIncomplete) {
        setAuthMethod("google");
        setOwnerName(profile.name || "Yaksh Patel");
        setStep("merchant-setup");
      } else {
        console.log("[Auth] Returning Google merchant logged in successfully.");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("[Auth Error] Google Auth rejected:", err.message);
      setOtpError("Authentication failed: " + err.message);
    }
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) return;
    setOtpError("");
    setLoadingVerify(true);

    try {
      if (typeof window === "undefined") return;

      console.log("[Auth] Setting up RecaptchaVerifier...");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
          console.log("[Auth] reCAPTCHA verification passed.");
        }
      });

      const fullPhone = `+91${mobileNumber}`;
      console.log(`[Auth] Requesting SMS OTP for: ${fullPhone}`);
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      console.log("[Auth] SMS verification code sent successfully.");
      setAuthMethod("mobile");
      setResendTimer(30);
      setOtp(["", "", "", "", "", ""]);
      setStep("otp-verify");
    } catch (err) {
      console.error("[Auth Error] Failed to send verification code:", err.message);
      setOtpError("Failed to send OTP: " + err.message);
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleVerifyOtp = async (submittedOtp) => {
    const finalOtp = submittedOtp || otp.join("");
    if (finalOtp.length !== 6) return;

    setOtpError("");
    setIsVerifyingOtp(true);

    try {
      if (!window.confirmationResult) {
        throw new Error("No active confirmation session found. Please re-send the code.");
      }

      console.log(`[Auth] Verifying 6-digit code: ${finalOtp}`);
      const credential = await window.confirmationResult.confirm(finalOtp);
      
      console.log("[Auth] Firebase phone auth verification complete. Extracting token...");
      const idToken = await credential.user.getIdToken();
      
      console.log("[Auth] Verifying ID token with secure backend...");
      const profile = await loginWithFirebaseToken(idToken);

      if (profile.onboardingIncomplete) {
        setAuthMethod("mobile");
        setOwnerName(profile.name || "");
        setStep("merchant-setup");
      } else {
        console.log("[Auth] Phone merchant logged in successfully.");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("[Auth Error] Code verification failed:", err.message);
      setOtpError("Invalid verification code. Please check and try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setResendTimer(30);
    setOtp(["", "", "", "", "", ""]);

    try {
      const fullPhone = `+91${mobileNumber}`;
      console.log(`[Auth] Resending verification code to: ${fullPhone}`);
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      console.log("[Auth] Code resent successfully.");
    } catch (err) {
      console.error("[Auth Error] Failed to resend code:", err.message);
      setOtpError("Failed to resend code: " + err.message);
    }
  };

  const completeOnboarding = async () => {
    if (!shopName.trim()) return;
    
    const resolvedLanguage = 
      language === "English" ? "en" :
      language === "Hindi" ? "hi" :
      language === "Tamil" ? "ta" :
      language === "Marathi" ? "mr" :
      language === "Gujarati" ? "gu" :
      language === "Bhojpuri" ? "bho" : "hi";

    const profileData = {
      name: ownerName.trim() || "Yaksh Patel",
      shopName: shopName.trim(),
      language: resolvedLanguage,
      businessType: businessType
    };

    try {
      setOtpError("");
      await completeMerchantOnboarding(profileData);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("[Onboarding Complete Error]", err.message);
      setOtpError("Failed to save merchant choices: " + err.message);
    }
  };

  // Standard Framer Motion screen transition layouts
  const transitionConfig = {
    initial: { opacity: 0, x: 15 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -15 },
    transition: { type: "spring", stiffness: 350, damping: 30 }
  };

  // Loading gate showing premium loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Syncing Secure Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen not-sm:min-w-full bg-[#0B0F19] text-white flex flex-col justify-between overflow-hidden">
      {/* Subtle clean radial grid overlays */}
      <div className="absolute w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] top-10 right-10 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-slate-500/5 rounded-full blur-[80px] bottom-10 left-10 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SPLASH INTRO BRAND VIEW */}
          {step === "splash" && (
            <motion.div {...transitionConfig} key="splash" className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], opacity: [0.03, 0.07, 0.03] }} 
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} 
                  className="absolute inset-0 bg-indigo-500 rounded-full blur-xl" 
                />
                <div className="relative w-24 h-24 rounded-[24px] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl overflow-hidden p-1">
                  <img src="/logo.png" alt="VoiceKhata Logo" className="w-full h-full object-contain rounded-2xl select-none" />
                </div>
              </div>

              <div className="space-y-3.5 max-w-sm mb-8">
                <div className="inline-flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/50 rounded-full px-3 py-1">
                  <Sparkles size={11} className="text-indigo-400" />
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">AI Voice Bookkeeping</span>
                </div>
                <h1 className="text-2xl font-black text-white leading-tight tracking-tight font-display">
                  AI Voice Bookkeeping<br />
                  <span className="text-slate-400">Assistant for Merchants</span>
                </h1>
                <p className="text-slate-500 text-xs leading-relaxed max-w-[260px] mx-auto font-semibold">
                  AI-powered premium bookkeeping assistant for modern Indian merchants.
                </p>
              </div>

              <div className="w-full opacity-50 mb-10">
                <Waveform />
              </div>

              <button 
                onClick={() => setStep("auth-selector")}
                className="w-full max-w-[280px] py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm outline-none focus:outline-none"
              >
                Get Started <ChevronRight size={13} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: AUTHENTICATION OPTIONS SELECTOR */}
          {step === "auth-selector" && (
            <motion.div {...transitionConfig} key="auth-selector" className="flex-1 flex flex-col justify-center">
              <button 
                onClick={() => setStep("splash")} 
                className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center cursor-pointer mb-6"
              >
                <ArrowLeft size={14} className="text-slate-400" />
              </button>

              <div className="mb-8">
                <h2 className="text-xl font-black font-display tracking-tight text-white mb-2">Create merchant account</h2>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Choose your preferred secure login channel to get started.</p>
              </div>

              {otpError && (
                <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider p-3 rounded-lg mb-5 text-center">
                  {otpError}
                </div>
              )}

              <div className="space-y-3.5">
                {/* Google Authentication */}
                <button 
                  onClick={triggerGoogleAuth}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 cursor-pointer transition-colors outline-none focus:outline-none"
                >
                  Continue with Google
                </button>

                {/* Mobile Authentication */}
                <button 
                  onClick={() => setStep("mobile-input")}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 cursor-pointer transition-colors outline-none focus:outline-none shadow-sm shadow-indigo-650/10"
                >
                  <Phone size={14} /> Continue with Mobile Number
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: INDIAN MOBILE NUMBER ENTRY */}
          {step === "mobile-input" && (
            <motion.div {...transitionConfig} key="mobile-input" className="flex-1 flex flex-col justify-center">
              <button 
                onClick={() => setStep("auth-selector")} 
                className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center cursor-pointer mb-6"
              >
                <ArrowLeft size={14} className="text-slate-400" />
              </button>

              <div className="mb-8">
                <h2 className="text-xl font-black font-display tracking-tight text-white mb-2">Enter Mobile Number</h2>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">We will send a 6-digit verification code to confirm your number.</p>
              </div>

              <form onSubmit={handleMobileSubmit} className="space-y-6">
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-2.5">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs tracking-wider border-r border-slate-800 pr-3">+91</span>
                    <input 
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-16 pr-4 text-xs font-bold text-white placeholder:text-slate-655 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={mobileNumber.length !== 10 || loadingVerify}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm outline-none focus:outline-none"
                >
                  {loadingVerify ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Send Verification Code <ChevronRight size={13} /></>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 4: OTP VERIFICATION VIEW WITH AUTO-FOCUS DIGITS */}
          {step === "otp-verify" && (
            <motion.div {...transitionConfig} key="otp-verify" className="flex-1 flex flex-col justify-center">
              <button 
                onClick={() => setStep("mobile-input")} 
                className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center cursor-pointer mb-6"
              >
                <ArrowLeft size={14} className="text-slate-400" />
              </button>

              <div className="mb-8">
                <h2 className="text-xl font-black font-display tracking-tight text-white mb-2 font-display">Verify Mobile</h2>
                <p className="text-xs text-slate-550 font-semibold leading-relaxed">
                  Enter the 6-digit verification code sent to <span className="text-slate-350 font-bold">+91 {mobileNumber}</span>.
                </p>
              </div>

              {otpError && (
                <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider p-3 rounded-lg mb-5 text-center">
                  {otpError}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input 
                        key={i}
                        ref={otpRefs[i]}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-10 h-12 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl text-center text-base font-black text-white focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Resend OTP in {resendTimer}s</p>
                  ) : (
                    <button 
                      onClick={handleResendOtp}
                      className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest cursor-pointer hover:text-indigo-300 bg-transparent border-0 outline-none"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => handleVerifyOtp()}
                  disabled={otp.some(digit => digit === "") || isVerifyingOtp}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm outline-none focus:outline-none"
                >
                  {isVerifyingOtp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Verify & Continue"}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: MERCHANT PROFILE CONFIGURATION SETUP */}
          {step === "merchant-setup" && (
            <motion.div {...transitionConfig} key="merchant-setup" className="flex-1 flex flex-col justify-center">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2 py-0.5 mb-2.5">
                  <Check size={10} className="text-emerald-500" />
                  <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-wide">Account Verified</span>
                </div>
                <h2 className="text-xl font-black font-display tracking-tight text-white mb-2">Merchant Customization</h2>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Let's align the AI bookkeeping assistant parameters for your shop.</p>
              </div>

              {otpError && (
                <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider p-3 rounded-lg mb-5 text-center">
                  {otpError}
                </div>
              )}

              <div className="space-y-4 mb-8">
                {/* Owner Name */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Owner Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550" />
                    <input 
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Yaksh Patel"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-655 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Shop Name */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-widest mb-1.5">Shop Name</label>
                  <div className="relative">
                    <Store size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550" />
                    <input 
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Yaksh Kirana Store"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-655 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Business Type Selector Pills */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-2">Business Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["Kirana", "Pharmacy", "Restaurant", "Apparel", "Salon", "Other"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBusinessType(type)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer outline-none focus:outline-none ${
                          businessType === type
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-slate-950 border-slate-900 text-slate-550 hover:bg-slate-900"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selector pills */}
                {/* WIP Note: Visual language codes placeholder list. Multi-lingual system is under development. */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-2">Bookkeeping Language</label>
                  <div className="flex flex-wrap gap-2">
                    {["English", "Hindi", "Tamil", "Marathi", "Gujarati", "Bhojpuri"].map((langCode) => (
                      <button
                        key={langCode}
                        type="button"
                        onClick={() => setLanguage(langCode)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer outline-none focus:outline-none ${
                          language === langCode
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-slate-950 border-slate-900 text-slate-550 hover:bg-slate-900"
                        }`}
                      >
                        {langCode === "Bhojpuri" ? "Bhojpuri/Awadhi" : langCode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={completeOnboarding}
                disabled={!shopName.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-800 disabled:text-slate-550 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm outline-none focus:outline-none"
              >
                Confirm & Enter Ledger <ChevronRight size={13} />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer secure policy tag */}
      <div className="relative z-10 text-center pb-8 px-6">
        <div className="flex items-center justify-center gap-1 text-[9px] text-slate-600 mb-1">
          <Shield size={10} />
          <span>Secured by enterprise-grade ledger validation</span>
        </div>
        <p className="text-slate-650 text-[8px] max-w-xs mx-auto leading-relaxed">
          By logging in, you agree to VoiceKhata's <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policies</span>
        </p>
      </div>
      {/* Invisible ReCAPTCHA Anchor */}
      <div id="recaptcha-container" className="absolute bottom-0 right-0 pointer-events-none opacity-0 select-none z-0"></div>
    </div>
  );
}

// User Icon helper component
function UserIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
