"use client";
import { motion } from "framer-motion";
import { whatsappLink } from "@/lib/utils";

export function WhatsAppButton({ number, storeName }: { number: string; storeName: string }) {
  if (!number) return null;
  return (
    <motion.a
      href={whatsappLink(number, `Assalam o Alaikum ${storeName}! I have a question.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2.8, type: "spring", stiffness: 260, damping: 20 }}
      className="no-print group fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-lift transition hover:pr-5 md:bottom-7 md:right-7"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.6s]" />
      <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
        <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1112 21.8zm0-21.6A11.8 11.8 0 001.9 18l-1.7 6 6.2-1.6A11.8 11.8 0 1012 .2z" />
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-500 group-hover:max-w-40">Chat with us</span>
    </motion.a>
  );
}
