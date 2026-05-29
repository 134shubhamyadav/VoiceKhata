"use client";
import { motion } from "framer-motion";

export default function PulseWave() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
      {[1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute rounded-[18px] border border-indigo-500/5 dark:border-indigo-400/5"
          style={{ width: "62px", height: "62px" }}
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{
            scale: [1, 1.25],
            opacity: [0.25, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: (index - 1) * 1.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
