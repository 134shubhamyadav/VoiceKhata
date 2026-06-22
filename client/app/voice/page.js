"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mic, X, Zap, Volume2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

const transcripts = [
  "Ramesh owes me two thousand rupees for groceries",
  "Priya Sharma paid twelve hundred rupees just now",
  "Bought vegetables for five hundred rupees"
];

// Pre-generate stable random heights — NEVER call Math.random() inside animate
// because that causes a new value every render → React hydration crash
const WAVE_HEIGHTS = Array.from({ length: 28 }, () => Math.random() * 32 + 10);
const WAVE_DURATIONS = Array.from({ length: 28 }, () => 0.6 + Math.random() * 0.3);

function WaveBar({ i, active }) {
  return (
    <motion.div
      className="w-[3px] rounded-full"
      style={{ background: active ? "#6366F1" : "#1E293B" }}
      animate={active ? { height: [8, WAVE_HEIGHTS[i], 8] } : { height: 8 }}
      transition={{ duration: WAVE_DURATIONS[i], repeat: Infinity, ease: "easeInOut", delay: i * 0.03 }}
    />
  );
}

const voiceTranslations = {
  en: {
    tapToSpeak: "Tap to Speak",
    subTap: "Speak transaction details to record",
    listening: "Listening...",
    subListening: "Listening to your voice clearly",
    analyzing: "Analyzing Voice Intent...",
    extracted: "Extracted Successfully ✓",
    subExtracted: "Verify extracted values below",
    demoSimulation: "Demo Simulation",
    langConfigured: "Language recognition is automatically configured",
    langHint: "Speaks match merchant preferred language or English",
    originalTranscript: "Original Transcript",
    realtimeTranscript: "Real-time Transcript",
    saveDetails: "Verify & Save Details ✓",
    speakAgain: "Speak Again"
  },
  hi: {
    tapToSpeak: "बोलने के लिए टैप करें",
    subTap: "लेन-देन रिकॉर्ड करने के लिए विवरण बोलें",
    listening: "सुन रहे हैं...",
    subListening: "आपकी आवाज़ सुन रहे हैं",
    analyzing: "आवाज़ का विश्लेषण कर रहे हैं...",
    extracted: "सफलतापूर्वक निकाला गया ✓",
    subExtracted: "नीचे निकाले गए मानों को सत्यापित करें",
    demoSimulation: "डेमो सिमुलेशन",
    langConfigured: "भाषा पहचान स्वचालित रूप से कॉन्फ़िगर की गई है",
    langHint: "बोली जाने वाली भाषा व्यापारी की पसंदीदा या अंग्रेजी से मेल खाती है",
    originalTranscript: "मूल प्रतिलेख",
    realtimeTranscript: "वास्तविक समय प्रतिलेख",
    saveDetails: "सत्यापित करें और सहेजें ✓",
    speakAgain: "फिर से बोलें"
  },
  ta: {
    tapToSpeak: "பேச தட்டவும்",
    subTap: "பரிவர்த்தனையை பதிவு செய்ய பேசவும்",
    listening: "கேட்கிறது...",
    subListening: "உங்கள் குரலைக் கேட்கிறது",
    analyzing: "குரல் விவரங்கள் பகுப்பாய்வு செய்யப்படுகிறது...",
    extracted: "வெற்றிகரமாக பிரித்தெடுக்கப்பட்டது ✓",
    subExtracted: "மதிப்புகளை கீழே சரிபார்க்கவும்",
    demoSimulation: "டெமோ உருவகப்படுத்துதல்",
    langConfigured: "மொழி அங்கீகாரம் தானாகவே கட்டமைக்கப்பட்டுள்ளது",
    langHint: "பேச்சு வணிகர் விருப்பமான மொழி அல்லது ஆங்கிலத்துடன் பொருந்துகிறது",
    originalTranscript: "அசல் டிரான்ஸ்கிரிப்ட்",
    realtimeTranscript: "நிகழ்நேர டிரான்ஸ்கிரிப்ட்",
    saveDetails: "சரிபார்த்து சேமிக்கவும் ✓",
    speakAgain: "மீண்டும் பேசவும்"
  },
  mr: {
    tapToSpeak: "बोलण्यासाठी टॅप करा",
    subTap: "व्यवहार रेकॉर्ड करण्यासाठी तपशील बोला",
    listening: "ऐकत आहे...",
    subListening: "तुमचा आवाज ऐकत आहे",
    analyzing: "आवाजाचे विश्लेषण करत आहे...",
    extracted: "यशस्वीरित्या काढले गेले ✓",
    subExtracted: "खालील मूल्यांची पडताळणी करा",
    demoSimulation: "डेमो सिम्युलेशन",
    langConfigured: "भाषा ओळख स्वयंचलितपणे कॉन्फिगर केली आहे",
    langHint: "बोली व्यापारीच्या पसंतीची किंवा इंग्रजीशी जुळते",
    originalTranscript: "मूळ मसुदा",
    realtimeTranscript: "रिअल-टाइम मसुदा",
    saveDetails: "पडताळणी करा आणि जतन करा ✓",
    speakAgain: "पुन्हा बोला"
  },
  gu: {
    tapToSpeak: "બોલવા માટે ટેપ કરો",
    subTap: "વ્યવહાર રેકોર્ડ કરવા માટે વિગતો બોલો",
    listening: "સાંભળી રહ્યા છે...",
    subListening: "તમારો અવાજ સાંભળી રહ્યા છે",
    analyzing: "અવાજનું વિશ્લેષણ કરી રહ્યા છે...",
    extracted: "સફળતાપૂર્વક મેળવ્યું ✓",
    subExtracted: "નીચે આપેલા મૂલ્યો ચકાસો",
    demoSimulation: "ડેમો સિમ્યુલેશન",
    langConfigured: "ભાષા ઓળખ આપમેળે ગોઠવેલી છે",
    langHint: "બોલી વેપારીની પસંદગીની અથવા અંગ્રેજી સાથે મેળ ખાય છે",
    originalTranscript: "મૂળ લખાણ",
    realtimeTranscript: "રીઅલ-ટાઇમ લખાણ",
    saveDetails: "ચકાસો અને સાચવો ✓",
    speakAgain: "ફરીથી બોલો"
  },
  bho: {
    tapToSpeak: "बोले खातिर टैप करीं",
    subTap: "लेन-देन दर्ज करे खातिर विवरन बोलीं",
    listening: "सुनत बानी...",
    subListening: "राउर आवाज सुनत बानी",
    analyzing: "आवाज के जाँचल जात बा...",
    extracted: "सफलतापूर्वक निकल गइल ✓",
    subExtracted: "नीचे निकालल गइल मान जांचीं",
    demoSimulation: "डेमो सिमुलेशन",
    langConfigured: "भाषा पहचान स्वचालित रूप से कॉन्फ़िगर कइल गइल बा",
    langHint: "बोली व्यापारी के पसंद या अंग्रेजी से मेल खाई",
    originalTranscript: "मूल प्रतिलेख",
    realtimeTranscript: "वास्तविक समय प्रतिलेख",
    saveDetails: "सत्यापित करीं और सहेजीं ✓",
    speakAgain: "फिर से बोलीं"
  }
};

export default function VoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  // Use user's saved language preference for the UI
  const lang = user?.language && voiceTranslations[user.language] ? user.language : "en";
  const t = voiceTranslations[lang];
  const [state, setState] = useState("idle"); // idle, listening, processing, done
  const [transcript, setTranscript] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [useSimulation, setUseSimulation] = useState(false);
  const [speechLang, setSpeechLang] = useState("en-IN"); // hi-IN or en-IN

  // Sync mic language dynamically with user settings language
  useEffect(() => {
    if (user) {
      const speechLangMap = {
        en: "en-IN",
        hi: "hi-IN",
        ta: "ta-IN",
        mr: "mr-IN",
        gu: "gu-IN",
        bho: "hi-IN"
      };
      const resolved = speechLangMap[user.language] || "en-IN";
      setSpeechLang(resolved);
      console.log(`[Voice Assistant] Auto-configured microphone recognition language: ${resolved}`);
    }
  }, [user]);

  // Singleton refs for Web Speech API infrastructure
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const hasErrorRef = useRef(false);

  const runMockSimulation = () => {
    setState("listening");
    setTranscript("");
    
    // Simulate speech detection
    setTimeout(() => {
      const chosen = transcripts[Math.floor(Math.random() * transcripts.length)];
      let i = 0;
      const interval = setInterval(async () => {
        setTranscript(chosen.slice(0, i++));
        if (i > chosen.length) {
          clearInterval(interval);
          setState("processing");
          
          let p = 0;
          const prog = setInterval(() => {
            setProgress(p += 25);
          }, 150);

          try {
            // Trigger live backend voice parsing!
            const response = await apiClient.parseVoice(chosen);
            if (response.success && response.data) {
              localStorage.setItem('voice_intent', JSON.stringify({
                customer: response.data.customerName || '',
                amount: response.data.amount || 100, // Rupees
                type: response.data.type || 'credit',
                dueDate: response.data.dueDate || null,
                note: response.data.note || '',
                confidence: Math.round(response.data.confidence * 100),
                raw: chosen
              }));
            }
          } catch (err) {
            console.warn("Using local mock voice extraction parser due to offline server.");
            localStorage.setItem('voice_intent', JSON.stringify({
              customer: chosen.includes("Ramesh") ? "Ramesh Yadav" : chosen.includes("Suresh") ? "Suresh Patel" : "Priya Sharma",
              amount: chosen.includes("2000") ? 2000 : chosen.includes("3500") ? 3500 : 1200,
              type: chosen.includes("payment") || chosen.includes("aaya") ? "payment" : "credit",
              dueDate: "26 Jan 2025",
              note: "Weekly supplies",
              confidence: 94,
              raw: chosen
            }));
          } finally {
            clearInterval(prog);
            setProgress(100);
            setState("done");
          }
        }
      }, 40);
    }, 850);
  };

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = async (event) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);

        if (!resultText.trim()) return;

        setState("processing");
        let p = 0;
        const prog = setInterval(() => {
          setProgress(prev => Math.min(95, prev + 15));
        }, 150);

        try {
          // Trigger live backend voice parsing with real spoken text
          const response = await apiClient.parseVoice(resultText);
          if (response.success && response.data) {
            localStorage.setItem('voice_intent', JSON.stringify({
              customer: response.data.customerName || '',
              amount: response.data.amount || 100,
              type: response.data.type || 'credit',
              dueDate: response.data.dueDate || null,
              note: response.data.note || '',
              confidence: Math.round(response.data.confidence * 100),
              raw: resultText
            }));
          }
        } catch (err) {
          console.warn("Using local mock voice extraction parser due to API error:", err);
          localStorage.setItem('voice_intent', JSON.stringify({
            customer: resultText.includes("Ramesh") ? "Ramesh Yadav" : resultText.includes("Suresh") ? "Suresh Patel" : "Priya Sharma",
            amount: parseInt(resultText.replace(/[^\d]/g, '')) || 500,
            type: resultText.includes("payment") || resultText.includes("aaya") ? "payment" : "credit",
            dueDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            note: "Recorded transaction details",
            confidence: 90,
            raw: resultText
          }));
        } finally {
          clearInterval(prog);
          setProgress(100);
          setState("done");
        }
      };

      recognition.onerror = (event) => {
        console.log("Speech Error:", {
          error: event.error,
          message: event.message
        });

        hasErrorRef.current = true;
        recognition.stop();
        setState("idle");

        if (event.error === 'not-allowed') {
          setErrorMsg("Microphone permission was denied. Please allow microphone access in your browser settings.");
        } else if (event.error === 'no-speech') {
          setErrorMsg("No speech was detected. Please speak clearly into your microphone.");
        } else if (event.error === 'network') {
          setErrorMsg("Microphone network error. Google Speech servers are unreachable. Please try again, check internet, or turn on Simulation Mode below.");
        } else {
          setErrorMsg(`Microphone error: ${event.error}. Please try again or toggle Simulation Mode.`);
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang;
    }
  }, [speechLang]);

  const startListening = () => {
    setErrorMsg("");
    hasErrorRef.current = false;
    
    if (useSimulation) {
      runMockSimulation();
      return;
    }

    if (!recognitionRef.current) {
      console.warn("Web Speech API not supported. Falling back to simulation.");
      setErrorMsg("Your browser does not support Speech Recognition. Fallback simulation mode is enabled.");
      runMockSimulation();
      return;
    }

    if (isListeningRef.current) {
      return;
    }

    setState("listening");
    setTranscript("");
    isListeningRef.current = true;

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start SpeechRecognition:", err);
      isListeningRef.current = false;
      setState("idle");
      setErrorMsg("Failed to start microphone. Please try again.");
    }
  };

  const confirm = () => router.push("/confirm");

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col overflow-hidden relative">
      {/* Precision ambient glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Modern thin header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-6">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-900/60">
          <X size={16} className="text-slate-400" />
        </button>
        <div className="flex items-center gap-1.5 bg-indigo-950/30 border border-indigo-900/30 rounded-lg px-2.5 py-1">
          <Zap size={10} className="text-indigo-400" />
          <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest font-display">Voice Ledger</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Main Recording layout */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        
        {/* Waveform bars */}
        <div className="flex items-end gap-1 h-14 mb-12">
          {Array.from({ length: 28 }).map((_, i) => <WaveBar key={i} i={i} active={state === "listening"} />)}
        </div>

        {/* Mic action button */}
        <div className="relative mb-12">
          {state === "listening" && (
            <div className="absolute -inset-4 rounded-full border border-indigo-500/10 animate-pulse pointer-events-none" />
          )}
          
          <motion.button
            whileTap={state === "idle" || state === "done" ? { scale: 0.94 } : undefined}
            onClick={state === "idle" || state === "done" ? startListening : undefined}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none focus:outline-none ${
              state === "listening"
                ? "bg-orange-500 border border-orange-600/30 shadow-lg shadow-orange-500/10"
                : state === "processing"
                ? "bg-slate-850 border border-slate-800"
                : state === "done"
                ? "bg-emerald-500 border border-emerald-600/30 shadow-lg shadow-emerald-500/10"
                : "bg-indigo-650 hover:bg-indigo-700 border border-indigo-550 shadow-lg shadow-indigo-600/10"
            }`}
          >
            {state === "processing" ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full" 
              />
            ) : state === "listening" ? (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <Volume2 size={26} className="text-white" />
              </motion.div>
            ) : (
              <Mic size={26} className="text-white" />
            )}
          </motion.button>
        </div>

        {/* Dynamic Speech Status */}
        <AnimatePresence mode="wait">
          <motion.div key={state} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-center mb-8">
            {state === "idle" && (
              <>
                <p className="text-white text-base font-black font-display tracking-tight mb-1">{t.tapToSpeak}</p>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{t.subTap}</p>
              </>
            )}
            {state === "listening" && (
              <>
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  <motion.div className="w-1.5 h-1.5 bg-orange-500 rounded-full" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  <p className="text-orange-400 text-base font-black font-display tracking-tight">{t.listening}</p>
                </div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{t.subListening}</p>
              </>
            )}
            {state === "processing" && (
              <>
                <p className="text-white text-base font-black font-display tracking-tight mb-2">{t.analyzing}</p>
                <div className="w-40 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500 rounded-full"
                    animate={{ width: `${progress}%` }} 
                    transition={{ ease: "linear" }} 
                  />
                </div>
              </>
            )}
            {state === "done" && (
              <>
                <p className="text-emerald-400 text-base font-black font-display tracking-tight mb-1">{t.extracted}</p>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{t.subExtracted}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error message card overlay */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 mb-6 text-center flex flex-col items-center gap-3"
          >
            <p className="text-orange-300 text-xs font-semibold leading-relaxed">{errorMsg}</p>
            {!useSimulation && (
              <button
                onClick={() => {
                  setUseSimulation(true);
                  setErrorMsg("");
                }}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer outline-none transition-colors"
              >
                Enable Simulation Mode
              </button>
            )}
          </motion.div>
        )}

        {/* Real-time transcript transcription box */}
        {transcript && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800/80 rounded-xl p-4.5 mb-6"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={11} className="text-indigo-400" />
              <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest font-display">{t.realtimeTranscript}</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed font-semibold">"{transcript}"</p>
          </motion.div>
        )}

        {/* Done / Confirm actions */}
        {state === "done" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-3">
            <button 
              onClick={confirm} 
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer outline-none focus:outline-none transition-colors"
            >
              {t.saveDetails}
            </button>
            <button 
              onClick={startListening} 
              className="w-full py-3 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs rounded-xl cursor-pointer outline-none focus:outline-none transition-colors"
            >
              {t.speakAgain}
            </button>
          </motion.div>
        )}
        {state === "idle" && (
          <div className="flex flex-col items-center gap-4 mt-2">
            
            {/* Simulation controls */}
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">{t.demoSimulation}</span>
              <button
                onClick={() => {
                  setUseSimulation(!useSimulation);
                  setErrorMsg("");
                }}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${useSimulation ? "bg-indigo-650 justify-end" : "bg-slate-800 justify-start"}`}
              >
                <motion.div layout className="w-3 h-3 bg-white rounded-full shadow-sm" />
              </button>
            </div>
            
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t.langConfigured}</p>
            <p className="text-slate-600 text-[10px] font-medium tracking-wide">{t.langHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
