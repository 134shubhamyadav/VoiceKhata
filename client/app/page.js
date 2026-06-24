"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Sparkles, ChevronRight, ArrowLeft, Mail, Phone, Store, Check } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/apiClient";
import HeroGraphic from "@/components/HeroGraphic";

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
    completeMerchantOnboarding,
    logout
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

  // Wake up server on mount
  useEffect(() => {
    apiClient.ping();
  }, []);

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

  const handleDemoLogin = async () => {
    try {
      setOtpError("");
      const idToken = "demo-demouser@voicekhata.com";
      console.log("[Auth] Invoking Hackathon Demo Login Bypass...");
      
      const profile = await loginWithFirebaseToken(idToken);
      
      if (profile.onboardingIncomplete) {
        setAuthMethod("google");
        setOwnerName(profile.name || "Demo Merchant");
        setStep("merchant-setup");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("[Auth Error] Demo Login failed:", err.message);
      setOtpError("Demo Login failed: " + err.message);
    }
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) return;
    setOtpError("");
    setLoadingVerify(true);

    const DEMO_NUMBERS = ["9999999999", "8888888888", "1234567890", "1111111111", "0000000000"];

    try {
      if (typeof window === "undefined") return;

      // Hackathon Demo Mode Bypass
      if (DEMO_NUMBERS.includes(mobileNumber)) {
        console.log("[Auth] Demo number detected, skipping SMS verification.");
        window.confirmationResult = {
          confirm: async (code) => {
            return {
              user: {
                getIdToken: async () => `demo-${mobileNumber}`
              }
            };
          }
        };
        setAuthMethod("mobile");
        setResendTimer(30);
        setOtp(["1", "2", "3", "4", "5", "6"]); // Pre-fill OTP for convenience
        setStep("otp-verify");
        setLoadingVerify(false);
        return;
      }

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
  // Standard Framer Motion screen transition layouts - Upgraded to premium scale & slide
  const transitionConfig = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -15, scale: 0.98 },
    transition: { type: "spring", stiffness: 400, damping: 30 }
  };

  // Loading gate showing premium loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full max-w-md mx-auto sm:max-w-none bg-white text-slate-800 flex flex-col justify-start overflow-hidden">
      
      {/* Top Graphic Area (Visible on Auth Steps) */}
      {(step === "auth-selector" || step === "mobile-input" || step === "otp-verify") && (
        <div className="w-full relative mb-8 shrink-0 rounded-b-[36px] overflow-hidden shadow-sm">
          <button 
            onClick={() => {
              if (step === "otp-verify") setStep("mobile-input");
              else if (step === "mobile-input") setStep("auth-selector");
              else if (step === "auth-selector") setStep("splash");
            }}
            className="absolute top-4 left-4 z-10 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md text-slate-800 hover:text-black transition-colors"
            aria-label="Go Back"
          >
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <HeroGraphic />
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col px-6 py-4 pb-6 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SPLASH INTRO BRAND VIEW */}
          {step === "splash" && (
            <>

              {/* Full Screen Faded Background Image */}
              <div className="absolute inset-0 z-0 overflow-hidden bg-white pointer-events-none">
                 <Image 
                    src="/splash-graphic.png" 
                    alt="VoiceKhata Splash Background" 
                    fill 
                    priority
                    className="object-cover object-top opacity-90"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
              </div>

              <motion.div {...transitionConfig} key="splash" className="flex-1 flex flex-col justify-between w-full h-full relative z-10 px-6 py-8">
                
                {/* Top Section: Logo in top-center */}
                <div className="flex flex-col items-center mt-2 text-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="relative mb-4"
                  >
                    {/* Pulsing ring behind logo */}
                    <div className="absolute inset-0 bg-[#4285F4]/30 rounded-[20px] blur-xl animate-ping" style={{ animationDuration: '3s' }} />
                    
                    {/* Premium Glassmorphic Logo Presentation */}
                    <div className="relative w-20 h-20 rounded-[20px] bg-white/70 backdrop-blur-md border border-white/80 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden p-1.5 z-10">
                      <img src="/logo.png" alt="VoiceKhata Logo" className="w-full h-full object-contain rounded-[16px] select-none" />
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ y: -20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
                    className="space-y-2 max-w-sm relative z-10"
                  >
                    <h1 className="text-[36px] font-black leading-tight tracking-tight font-display text-slate-900 drop-shadow-md">
                      VoiceKhata
                    </h1>
                    <p className="text-slate-800 text-[15px] leading-relaxed max-w-[240px] mx-auto font-bold drop-shadow-md">
                      Bolke Rakho Hisaab.
                    </p>
                  </motion.div>
                </div>

                {/* Bottom Section: Button near the table */}
                <div className="w-full mt-auto pb-4 relative flex justify-center shrink-0">
                  <motion.button 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep("auth-selector")}
                    className="group relative w-full max-w-[320px] py-3.5 bg-gradient-to-r from-[#4285F4] to-[#3367D6] hover:from-[#3367D6] hover:to-[#2857b8] text-white font-bold text-[16px] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-[0_8px_25px_0_rgba(66,133,244,0.5)] hover:shadow-[0_12px_30px_rgba(66,133,244,0.4)] hover:-translate-y-1 outline-none mx-auto z-10 border-[3px] border-[#1e3a8a]"
                  >
                    Get Started 
                    <ChevronRight size={20} className="transition-transform duration-300 group-hover:translate-x-1 text-white" />
                  </motion.button>
                </div>

              </motion.div>
            </>
          )}

          {/* STEP 2: AUTHENTICATION OPTIONS SELECTOR */}
          {step === "auth-selector" && (
            <motion.div {...transitionConfig} key="auth-selector" className="flex-1 flex flex-col justify-center py-4">
              <div className="mb-8">
                <h2 className="text-[28px] font-black font-display tracking-tight text-slate-900 mb-2">Welcome Back :)</h2>
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed">Choose your preferred login channel to continue.</p>
              </div>

              {otpError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-[13px] rounded-xl font-medium border border-red-100 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {otpError}
                </div>
              )}

              <div className="space-y-4">
                {/* Google Button */}
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[15px] rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all shadow-sm outline-none"
                >
                  <FcGoogle size={22} />
                  Continue with Google
                </button>

                {/* Mobile Button */}
                <button 
                  onClick={() => {
                    setOtpError("");
                    setStep("mobile-input");
                  }}
                  disabled={loading}
                  className="w-full py-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md outline-none"
                >
                  <Phone size={18} />
                  Continue with Mobile Number
                </button>
              </div>

              {/* Demo Login Option */}
              <div className="relative my-8 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative bg-white px-4 text-[11px] font-bold text-slate-300 tracking-widest uppercase">
                  Hackathon Demo
                </div>
              </div>

              <button 
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors outline-none"
              >
                <Sparkles size={18} />
                Instant Demo Login
              </button>
            </motion.div>
          )}

          {/* STEP 3: INDIAN MOBILE NUMBER ENTRY */}
          {step === "mobile-input" && (
            <motion.div {...transitionConfig} key="mobile-input" className="flex-1 flex flex-col">
              <button 
                onClick={() => setStep("auth-selector")} 
                className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-pointer mb-6 shadow-sm"
              >
                <ArrowLeft size={14} className="text-slate-500" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black font-display tracking-tight text-slate-900 mb-2">Enter Mobile</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">We will send a 6-digit verification code to confirm your number.</p>
              </div>

              <form onSubmit={handleMobileSubmit} className="space-y-6">
                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs border-r border-slate-200 pr-3">+91</span>
                    <input 
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-full py-3.5 pl-16 pr-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all"
                    />
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Use <strong className="text-slate-700">9999999999</strong>, <strong className="text-slate-700">8888888888</strong>, or <strong className="text-slate-700">1234567890</strong> for instant demo access.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={mobileNumber.length !== 10 || loadingVerify}
                  className="w-full py-3.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md outline-none"
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

          {/* STEP 4: OTP VERIFICATION */}
          {step === "otp-verify" && (
            <motion.div {...transitionConfig} key="otp-verify" className="flex-1 flex flex-col justify-center py-4">
              <div className="mb-8">
                <h2 className="text-[28px] font-black font-display tracking-tight text-slate-900 mb-2">Verify OTP</h2>
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                  Sent to <span className="font-bold text-slate-800">+91 {mobileNumber}</span>
                  <button onClick={() => setStep("mobile-input")} className="ml-2 text-[#4285F4] font-bold hover:underline">Edit</button>
                </p>
              </div>

              {otpError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-[13px] rounded-xl font-medium border border-red-100 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {otpError}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex gap-2 justify-between">
                    {otp.map((digit, i) => (
                      <input 
                        key={i}
                        ref={otpRefs[i]}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 bg-slate-50 border border-slate-200 focus:border-[#4285F4] focus:ring-4 focus:ring-[#4285F4]/10 rounded-xl text-center text-xl sm:text-2xl font-black text-slate-800 focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-[11px] sm:text-[12px] text-slate-400 font-bold uppercase tracking-widest">Resend OTP in {resendTimer}s</p>
                  ) : (
                    <button 
                      onClick={handleResendOtp}
                      className="text-[11px] sm:text-[12px] text-[#4285F4] font-bold uppercase tracking-widest cursor-pointer hover:text-[#3367D6] bg-transparent border-0 outline-none"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => handleVerifyOtp()}
                  disabled={otp.some(digit => digit === "") || isVerifyingOtp}
                  className="w-full py-4 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md outline-none"
                >
                  {isVerifyingOtp ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Verify & Secure Login"}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: MERCHANT PROFILE CONFIGURATION SETUP */}
          {step === "merchant-setup" && (
            <motion.div {...transitionConfig} key="merchant-setup" className="flex-1 flex flex-col justify-center mt-12">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 mb-2.5">
                  <Check size={10} className="text-emerald-500" />
                  <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wide">Account Verified</span>
                </div>
                <h2 className="text-2xl font-black font-display tracking-tight text-slate-900 mb-2">Merchant Customization</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Let's align the AI bookkeeping assistant parameters for your shop.</p>
              </div>

              {otpError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-[10px] font-bold uppercase tracking-wider p-3 rounded-lg mb-5 text-center">
                  {otpError}
                </div>
              )}

              <div className="space-y-4 mb-8">
                {/* Owner Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Owner Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Justin"
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-full py-3.5 pl-12 pr-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4285F4] transition-all"
                    />
                  </div>
                </div>

                {/* Shop Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Shop Name</label>
                  <div className="relative">
                    <Store size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Ghostlamp Kirana"
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-full py-3.5 pl-12 pr-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4285F4] transition-all"
                    />
                  </div>
                </div>

                {/* Business Type Selector Pills */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Business Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["Kirana", "Pharmacy", "Restaurant", "Apparel", "Salon", "Other"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBusinessType(type)}
                        className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer outline-none focus:outline-none ${
                          businessType === type
                            ? "bg-[#4285F4] border-[#4285F4] text-white shadow-md"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selector pills */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Bookkeeping Language</label>
                  <div className="flex flex-wrap gap-2">
                    {["English", "Hindi", "Tamil", "Marathi", "Gujarati", "Bhojpuri"].map((langCode) => (
                      <button
                        key={langCode}
                        type="button"
                        onClick={() => setLanguage(langCode)}
                        className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer outline-none focus:outline-none ${
                          language === langCode
                            ? "bg-[#4285F4] border-[#4285F4] text-white shadow-md"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
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
                className="w-full py-3.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md outline-none"
              >
                Confirm & Enter Ledger <ChevronRight size={13} />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer secure policy tag */}
      {step !== "splash" && (
        <div className="relative z-10 text-center pb-4 px-6 mt-auto shrink-0">
          <p className="text-slate-400 text-[10px] max-w-xs mx-auto leading-relaxed font-medium">
            By logging in, you agree to our <span onClick={() => router.push('/terms')} className="text-[#4285F4] underline cursor-pointer">Terms of Service</span> and <span onClick={() => router.push('/privacy')} className="text-[#4285F4] underline cursor-pointer">Privacy Policies</span>
          </p>
        </div>
      )}
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
