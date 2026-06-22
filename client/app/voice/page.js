"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mic, X, Zap, Volume2, Check } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

export default function VoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I am your VoiceKhata Assistant. How can I help you today?" }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechLang, setSpeechLang] = useState("en-IN");
  const [intentToConfirm, setIntentToConfirm] = useState(null);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (user) {
      const speechLangMap = {
        en: "en-IN", hi: "hi-IN", ta: "ta-IN", mr: "mr-IN", gu: "gu-IN", bho: "hi-IN"
      };
      setSpeechLang(speechLangMap[user.language] || "en-IN");
    }
    
    if (typeof window !== "undefined") {
      synthesisRef.current = window.speechSynthesis;
    }
  }, [user]);

  // Handle TTS
  const speakText = (text) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel();
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(speechLang.split('-')[0]));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  // Initial greeting
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      speakText(messages[0].text);
    }
    return () => {
      if (synthesisRef.current) synthesisRef.current.cancel();
    }
  }, [speechLang]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        if (!transcript.trim()) return;

        setIsListening(false);
        setIsProcessing(true);
        
        setMessages(prev => [...prev, { role: "user", text: transcript }]);
        
        try {
          const historyToSend = messages.filter(m => m.role !== 'system');
          const response = await apiClient.chatVoice(transcript, historyToSend);
          
          if (response.success && response.data) {
            const result = response.data;
            
            if (result.type === 'action') {
              speakText(result.text || "Please confirm this transaction.");
              setMessages(prev => [...prev, { role: "assistant", text: result.text }]);
              setIntentToConfirm(result.intent);
            } else {
              speakText(result.text);
              setMessages(prev => [...prev, { role: "assistant", text: result.text }]);
            }
          }
        } catch (err) {
          console.error("Chat error:", err);
          const errorMsg = "Sorry, I had trouble connecting. Please try again.";
          speakText(errorMsg);
          setMessages(prev => [...prev, { role: "assistant", text: errorMsg }]);
        } finally {
          setIsProcessing(false);
        }
      };

      recognition.onerror = (e) => {
        console.error("Mic error:", e.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [messages, speechLang]);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (synthesisRef.current) synthesisRef.current.cancel();
      setIsSpeaking(false);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleConfirmAction = () => {
    if (intentToConfirm) {
      localStorage.setItem('voice_intent', JSON.stringify(intentToConfirm));
      router.push("/confirm");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col relative overflow-hidden">
      {/* Precision ambient glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-900/60">
          <X size={16} className="text-slate-400" />
        </button>
        <div className="flex items-center gap-1.5 bg-indigo-950/30 border border-indigo-900/30 rounded-lg px-2.5 py-1">
          <Zap size={10} className="text-indigo-400" />
          <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest font-display">AI Assistant</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-32 flex flex-col gap-4 relative z-10">
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? "bg-indigo-600 text-white self-end rounded-br-none" 
                : "bg-slate-800 text-slate-200 self-start rounded-bl-none"
            }`}
          >
            {msg.text}
          </motion.div>
        ))}
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800 text-slate-400 self-start rounded-2xl rounded-bl-none px-4 py-3 max-w-[85%] flex gap-1">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75" />
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150" />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Overlay */}
      <AnimatePresence>
        {intentToConfirm && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-32 left-4 right-4 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-xl z-20"
          >
            <p className="text-sm font-bold text-white mb-1">Ready to Save Transaction</p>
            <p className="text-xs text-slate-400 mb-3">
              {intentToConfirm.type === 'payment' ? 'Payment from ' : 'Credit to '}
              <span className="font-bold text-indigo-400">{intentToConfirm.customerName || "Unknown"}</span> 
              {' for '}<span className="font-bold text-emerald-400">₹{intentToConfirm.amount}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setIntentToConfirm(null)} className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmAction} className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1 transition-colors">
                <Check size={14} /> Review & Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Mic Container */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19] to-transparent flex flex-col items-center pointer-events-none z-10">
        <div className="pointer-events-auto relative">
          {(isListening || isSpeaking) && (
            <div className="absolute -inset-4 rounded-full border border-indigo-500/20 animate-ping pointer-events-none" />
          )}
          <button
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer ${
              isListening 
                ? "bg-orange-500" 
                : isSpeaking 
                ? "bg-emerald-500" 
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSpeaking ? <Volume2 size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </button>
        </div>
        <p className="mt-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap to Speak"}
        </p>
      </div>
    </div>
  );
}
