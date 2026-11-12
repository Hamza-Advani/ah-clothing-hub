"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [messages.length]);
  if (!messages.length) return null;
  return (
    <div className="relative z-50 h-9 overflow-hidden bg-primary text-primary-foreground" role="region" aria-label="Announcements">
      <div className="container-x flex h-full items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={i}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center text-[11px] font-semibold uppercase tracking-[0.2em]"
          >
            {messages[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
