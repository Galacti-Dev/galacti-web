"use client";

import { useState } from "react";
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
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15 shadow-inner">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Galacti AI Kosmonauta</h1>
            <p className="text-xs text-zinc-400">
              Zweryfikowana wiedza astrofizyczna i misje kosmiczne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Online</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                msg.sender === "user"
                  ? "bg-white text-black shadow-md shadow-white/10"
                  : "bg-white/10 text-white border border-white/15"
              }`}
            >
              {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white border border-white/15">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-zinc-900/80 border border-white/10 px-4 py-3 text-sm text-zinc-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>Generowanie odpowiedzi na podstawie danych naukowych...</span>
            </div>
          </div>
        )}
      </div>

      {/* Sample Quick Questions */}
      {messages.length <= 2 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Sparkles className="inline h-3 w-3 mr-1 text-zinc-300" />
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-white/10 pt-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Zadaj pytanie o kosmos, planety, teleskop Webba..."
          className="flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSubmitting}
          aria-label="Wyślij zapytanie do asystenta AI"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white transition-colors active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
