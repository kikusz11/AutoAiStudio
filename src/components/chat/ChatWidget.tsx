"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { useLanguage } from "../LanguageProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [sessionId] = useState(() => typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Set welcome message when language changes or on first open
  useEffect(() => {
    if (!initialized.current || messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: t.chat.welcome,
      }]);
      initialized.current = true;
    }
  }, [t.chat.welcome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setMessageCount((c) => c + 1);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Chat error");
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.content },
      ]);
      if (messageCount >= 3 && !showLeadForm) {
        setTimeout(() => setShowLeadForm(true), 1500);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: t.chat.error },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (lead: { name: string; email: string; company: string }) => {
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lead,
          sessionId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      setShowLeadForm(false);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Thank you, ${lead.name}! 🎉 We'll contact you at ${lead.email} soon.`,
        },
      ]);
    } catch { /* silent */ }
  };

  return (
    <>


      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(212, 175, 55, 0.3)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-linear-to-r from-primary/20 to-primary/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.chat.title}</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-foreground/40">{t.chat.online}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all">
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-lg bg-linear-to-br from-primary/20 to-accent-light/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={12} className="text-primary-dark" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-linear-to-r from-primary to-accent text-white rounded-br-md" : "bg-black/5 text-foreground/80 rounded-bl-md"}`}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={12} className="text-primary-dark" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-linear-to-br from-primary/20 to-accent-light/20 flex items-center justify-center shrink-0">
                    <Bot size={12} className="text-primary-dark" />
                  </div>
                  <div className="bg-black/5 px-3 py-2.5 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              {showLeadForm && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <LeadCaptureForm onSubmit={handleLeadSubmit} />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-black/5 bg-surface">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.chat.placeholder}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/5 border border-black/5 text-sm text-foreground placeholder:text-foreground/45 focus:outline-none focus:border-primary/50 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-9 h-9 rounded-xl bg-linear-to-r from-primary to-accent flex items-center justify-center text-white disabled:opacity-40 transition-all"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
