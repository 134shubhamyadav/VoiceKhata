const fs = require('fs');
const content = fs.readFileSync('client/app/page.js', 'utf8');
const parts = content.split('// Loading gate showing premium loader');
const prefix = parts[0];

const suffix = `// Loading gate showing premium loader
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
    <div className="relative min-h-screen not-sm:min-w-full bg-white text-slate-800 flex flex-col justify-start overflow-hidden">
      
      {/* Top Graphic Area (Visible on Auth Steps) */}
      {(step === "auth-selector" || step === "mobile-input" || step === "otp-verify") && (
        <div className="w-full bg-[#F5F8FF] pt-12 pb-4 rounded-b-[40px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
          <HeroGraphic />
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col px-6 py-4 pb-12">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SPLASH INTRO BRAND VIEW */}
          {step === "splash" && (
            <motion.div {...transitionConfig} key="splash" className="flex-1 flex flex-col items-center justify-center text-center mt-20">
              <div className="relative mb-8">
                <div className="relative w-24 h-24 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center shadow-lg overflow-hidden p-1">
                  <img src="/logo.png" alt="VoiceKhata Logo" className="w-full h-full object-contain rounded-2xl select-none" />
                </div>
              </div>

              <div className="space-y-3.5 max-w-sm mb-8">
                <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight font-display">
                  Welcome Back :)<br />
                </h1>
                <p className="text-slate-500 text-xs leading-relaxed max-w-[260px] mx-auto font-medium">
                  To keep connected with us please login with your personal information.
                </p>
              </div>

              <button 
                onClick={() => setStep("auth-selector")}
                className="w-full max-w-[280px] py-3.5 bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md outline-none focus:outline-none mx-auto"
              >
                Get Started <ChevronRight size={13} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: AUTHENTICATION OPTIONS SELECTOR */}
          {step === "auth-selector" && (
            <motion.div {...transitionConfig} key="auth-selector" className="flex-1 flex flex-col">
              <div className="mb-8">
                <h2 className="text-2xl font-black font-display tracking-tight text-slate-900 mb-2">Welcome Back :)</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Choose your preferred login channel to continue.</p>
              </div>

              {otpError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-[10px] font-bold uppercase tracking-wider p-3 rounded-lg mb-5 text-center">
                  {otpError}
                </div>
              )}

              <div className="space-y-4">
                <button 
                  onClick={triggerGoogleAuth}
                  className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-full flex items-center justify-center gap-2.5 cursor-pointer transition-colors outline-none shadow-sm"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="w-4 h-4" />
                  Continue with Google
                </button>

                <button 
                  onClick={() => setStep("mobile-input")}
                  className="w-full py-3.5 bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2.5 cursor-pointer transition-colors outline-none shadow-md"
                >
                  <Phone size={14} /> Continue with Mobile Number
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-medium uppercase tracking-wider">Hackathon Demo</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button 
                  onClick={handleDemoLogin}
                  className="w-full py-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 font-bold text-xs rounded-full flex items-center justify-center gap-2.5 cursor-pointer transition-colors outline-none shadow-sm"
                >
                  <Sparkles size={14} /> Instant Demo Login
                </button>
              </div>
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
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\\D/g, "").slice(0, 10))}
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

          {/* STEP 4: OTP VERIFICATION VIEW */}
          {step === "otp-verify" && (
            <motion.div {...transitionConfig} key="otp-verify" className="flex-1 flex flex-col">
              <button 
                onClick={() => setStep("mobile-input")} 
                className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-pointer mb-6 shadow-sm"
              >
                <ArrowLeft size={14} className="text-slate-500" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black font-display tracking-tight text-slate-900 mb-2">Verify Mobile</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Enter the 6-digit verification code sent to <span className="text-slate-700 font-bold">+91 {mobileNumber}</span>.
                </p>
              </div>

              {otpError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-[10px] font-bold uppercase tracking-wider p-3 rounded-lg mb-5 text-center">
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
                        className="w-10 h-12 bg-[#F8FAFC] border border-slate-200 focus:border-[#4285F4] focus:ring-4 focus:ring-[#4285F4]/10 rounded-xl text-center text-base font-black text-slate-800 focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resend OTP in {resendTimer}s</p>
                  ) : (
                    <button 
                      onClick={handleResendOtp}
                      className="text-[10px] text-[#4285F4] font-bold uppercase tracking-widest cursor-pointer hover:text-[#3367D6] bg-transparent border-0 outline-none"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => handleVerifyOtp()}
                  disabled={otp.some(digit => digit === "") || isVerifyingOtp}
                  className="w-full py-3.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md outline-none"
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
                        className={\`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer outline-none focus:outline-none \${
                          businessType === type
                            ? "bg-[#4285F4] border-[#4285F4] text-white shadow-md"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }\`}
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
                        className={\`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer outline-none focus:outline-none \${
                          language === langCode
                            ? "bg-[#4285F4] border-[#4285F4] text-white shadow-md"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }\`}
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
      <div className="relative z-10 text-center pb-8 px-6 mt-auto">
        <p className="text-slate-400 text-[10px] max-w-xs mx-auto leading-relaxed font-medium">
          By logging in, you agree to our <span onClick={() => router.push('/terms')} className="text-[#4285F4] underline cursor-pointer">Terms of Service</span> and <span onClick={() => router.push('/privacy')} className="text-[#4285F4] underline cursor-pointer">Privacy Policies</span>
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
`;

fs.writeFileSync('client/app/page.js', prefix + suffix);
console.log('Successfully updated page.js');
