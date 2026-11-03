"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp?: string;
}

let msgSeq = 0;
function createMessageId(role: string) {
  msgSeq += 1;
  return `${role}-${msgSeq}`;
}

const initialMessages: Message[] = [
  {
    id: "welcome",
    sender: "assistant",
    text: "Witaj w Galacti! Jestem Twoim edukacyjnym asystentem kosmicznym. Odpowiadam na pytania dotyczące Układu Słonecznego, misji NASA/ESA, astrofizyki i eksploracji Wszechświata w oparciu o zweryfikowane fakty naukowe. O co chciałbyś zapytać?",
  },
];

const sampleQuestions = [
  "Czy na Marsie kiedykolwiek było życie?",
  "Dlaczego Wenus jest cieplejsza od Merkurego?",
  "Z jaką prędkością porusza się stacja kosmiczna ISS?",
  "Dlaczego z czarnej dziury nic nie może uciec?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || isSubmitting) return;

    const userMsg: Message = {
      id: createMessageId("user"),
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMsg: Message = {
          id: createMessageId("assistant"),
          sender: "assistant",
          text: data.reply || data.text,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error("Błąd odpowiedzi API");
      }
    } catch {
      // Intelligent fallback answer if backend route is in development
      const fallbackReply = `Odpowiedź na pytanie: "${textToSend}"
      
W Galacti łączymy wiedzę naukową z najświeższymi danymi z misji kosmicznych. 
Endpoint AI Chat jest w trakcie przygotowywania przez Backend Developera zgodnie ze specyfikacją z chatbot_prompt.md.`;

      const assistantMsg: Message = {
        id: createMessageId("assistant"),
        sender: "assistant",
        text: fallbackReply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col overflow-hidden px-3 py-3 sm:px-6 sm:py-4">
      {/* Header - Fixed top */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15 shadow-inner shrink-0">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
              Galacti AI Kosmonauta
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1">
              Zweryfikowana wiedza astrofizyczna i misje kosmiczne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-2.5 py-1 text-[11px] sm:text-xs text-zinc-300 shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Online</span>
        </div>
      </div>

      {/* Messages Scroll Area - Takes all available space, scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4 sm:py-6 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 sm:gap-3 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                msg.sender === "user"
                  ? "bg-white text-black shadow-md shadow-white/10"
                  : "bg-white/10 text-white border border-white/15"
              }`}
            >
              {msg.sender === "user" ? (
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-zinc-800 text-white border border-zinc-700/80 rounded-tr-none shadow-md"
                  : "bg-zinc-900/80 border border-white/10 text-zinc-100 rounded-tl-none shadow-md"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isSubmitting && (
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white/10 text-white border border-white/15 shrink-0">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-zinc-900/80 border border-white/10 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-zinc-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>Generowanie odpowiedzi na podstawie danych naukowych...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sample Quick Questions - Scrollable horizontally on mobile, wrapping on sm+ */}
      {messages.length <= 2 && (
        <div className="shrink-0 pb-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:flex-wrap">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs text-zinc-300 hover:border-white/30 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
            >
              <Sparkles className="inline h-3 w-3 mr-1 text-zinc-300" />
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Box - Pinned to bottom, with mobile safe-area padding */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="shrink-0 flex items-center gap-2 border-t border-white/10 pt-2.5 sm:pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:pb-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Zadaj pytanie o kosmos, planety, misje..."
          className="flex-1 min-w-0 rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSubmitting}
          aria-label="Wyślij zapytanie do asystenta AI"
          className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white transition-colors active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
