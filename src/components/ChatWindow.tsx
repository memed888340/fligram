// components/ChatWindow.tsx
// Flugram - Sağ panel: Əsas mesajlaşma pəncərəsi

"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, Video, MoreVertical, Paperclip, Smile, Send } from "lucide-react";
import { auth, db } from "../../lib/firebase"; // Yol düzəldildi
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  Timestamp,
} from "firebase/firestore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp | null;
  status: "sent" | "delivered" | "read";
}

// index.tsx-dən gələn datalara uyğunlaşdırıldı
interface ChatWindowProps {
  activeChatId: string | null;
  otherUserName?: string;
  otherUserStatus?: "online" | "away" | "offline";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMsgTime(ts: Timestamp | null): string {
  if (!ts) return "";
  const d = ts.toDate();
  return d.toLocaleTimeString("az", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_LABELS = {
  online: "● Online indi",
  away: "● Az əvvəl aktiv idi",
  offline: "● Oflayn",
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const statusIcon =
    msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓";

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
      {!isMine && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-800 to-teal-400
          flex-shrink-0 flex items-center justify-center text-white text-[11px] font-semibold">
          {getInitials(msg.senderName)}
        </div>
      )}

      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        <div
          className={`max-w-xs md:max-w-sm px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isMine
              ? "flugram-bubble-sent text-white rounded-br-[4px]"
              : "flugram-bubble-recv text-slate-200 rounded-bl-[4px]"
            }`}
        >
          {msg.text}
        </div>

        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[11px] text-slate-500">{formatMsgTime(msg.timestamp)}</span>
          {isMine && (
            <span className={`text-[12px] ${msg.status === "read" ? "text-[#60a5fa]" : "text-slate-500"}`}>
              {statusIcon}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-800 to-teal-400
        flex-shrink-0 flex items-center justify-center text-white text-[11px] font-semibold">
        {getInitials(name)}
      </div>
      <div className="flugram-bubble-recv px-4 py-3 rounded-2xl rounded-bl-[4px]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#93c5fd] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatWindow({ 
    activeChatId, 
    otherUserName = "İstifadəçi", 
    otherUserStatus = "offline" 
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false); 
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!activeChatId) return;
    const q = query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
    });
    return () => unsub();
  }, [activeChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !currentUser || !activeChatId) return;
    setText("");

    await addDoc(collection(db, "chats", activeChatId, "messages"), {
      text: trimmed,
      senderId: currentUser.uid,
      senderName: currentUser.displayName ?? "Siz",
      timestamp: serverTimestamp(),
      status: "sent",
      type: "text",
    });

    await updateDoc(doc(db, "chats", activeChatId), {
      lastMessage: trimmed,
      lastMessageTime: serverTimestamp(),
      lastMessageSender: currentUser.uid,
      [`unreadCount.${activeChatId}`]: increment(1),
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!activeChatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a] text-slate-500">
        Söhbətə başlamaq üçün birini seçin
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[rgba(15,23,42,0.6)]">

      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-[rgba(96,165,250,0.2)] bg-[rgba(15,23,42,0.8)] backdrop-blur-xl">
        <div className="relative w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br from-teal-800 to-teal-400 flex items-center justify-center text-white font-semibold text-sm">
          {getInitials(otherUserName)}
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0f172a] ${otherUserStatus === "online" ? "bg-green-500" : "bg-slate-500"}`} />
        </div>
        <div className="flex-1">
          <p className="font-['Space_Grotesk'] text-base font-semibold text-slate-100">
            {otherUserName}
          </p>
          <p className={`text-xs ${otherUserStatus === "online" ? "text-green-400" : "text-slate-400"}`}>
            {STATUS_LABELS[otherUserStatus]}
          </p>
        </div>
        <div className="flex gap-1">
          {[Phone, Video, MoreVertical].map((Icon, i) => (
            <button key={i} className="p-2 rounded-lg text-slate-400 hover:text-[#60a5fa] hover:bg-[rgba(96,165,250,0.1)] transition-colors">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </header>

      {/* ── Mesajlar sahəsi ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-[rgba(96,165,250,0.15)]" />
          <span className="text-xs text-slate-500">Bu gün</span>
          <div className="flex-1 h-px bg-[rgba(96,165,250,0.15)]" />
        </div>

        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            msg={msg}
            isMine={msg.senderId === currentUser?.uid}
          />
        ))}

        {isTyping && <TypingIndicator name={otherUserName} />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input sahəsi ── */}
      <div className="px-5 py-4 border-t border-[rgba(96,165,250,0.2)] bg-[rgba(15,23,42,0.8)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5 bg-[rgba(30,41,59,0.8)] border border-[rgba(96,165,250,0.2)] rounded-2xl pl-4 pr-2 py-2 focus-within:border-[rgba(96,165,250,0.5)] transition-colors">
          <button className="text-slate-400 hover:text-[#60a5fa] transition-colors">
            <Paperclip className="w-[18px] h-[18px]" />
          </button>

          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Mesaj yaz..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none resize-none max-h-24 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          />

          <button className="text-slate-400 hover:text-[#60a5fa] transition-colors">
            <Smile className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={sendMessage}
            className="w-9 h-9 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#1e3a8a] to-[#60a5fa] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Send className="w-[17px] h-[17px] text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}