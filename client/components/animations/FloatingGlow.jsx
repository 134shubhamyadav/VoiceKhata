"use client";
import { motion } from "framer-motion";

export default function FloatingGlow() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
      {/* Refined hyper-minimal background glow */}
      <motion.div
        animate={{
          scale: [0.99, 1.02, 0.99],
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-16 h-16 rounded-full bg-[#4285F4] blur-md absolute opacity-5"
      />
    </div>
  );
}
