// components/Sidebar.tsx
// Flugram - Sol panel: Söhbət siyahısı

"use client";

import { useState, useEffect } from "react";
import { Search, Settings, Sun } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Chat {
  id: string;
  participantNames: Record<string, string>;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: Record<string, number>;
}

interface SidebarProps {
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(ts: Timestamp): string {
  const date = ts.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000) {
    return date.toLocaleTimeString("az", { hour: "2-digit", minute: "2-digit" });
  }
  return "Dünən";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const GRADIENTS = [
  "from-blue-900 to-blue-400",
  "from-violet-800 to-violet-400",
  "from-teal-800 to-teal-400",
  "from-rose-800 to-rose-400",
  "from-amber-800 to-amber-400",
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Sidebar({ activeChatId, onSelectChat }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const currentUser = auth.currentUser;

  // Real-time Firestore dinləmə
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageTime", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat)));
    });

    return () => unsub();
  }, [currentUser]);

  const filtered = chats.filter((c) => {
    const otherName = Object.entries(c.participantNames)
      .find(([uid]) => uid !== currentUser?.uid)?.[1] ?? "";
    return otherName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <aside className="w-[300px] flex-shrink-0 flex flex-col h-full
      bg-[rgba(15,23,42,0.85)] backdrop-blur-xl
      border-r border-[rgba(96,165,250,0.2)]">

      {/* Header */}
      <div className="p-5 pb-3 border-b border-[rgba(96,165,250,0.2)]">
        <div className="flex items-center gap-2.5 mb-4">
          {/* Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#60a5fa]
            flex items-center justify-center">
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <span className="font-['Space_Grotesk'] text-xl font-semibold
            bg-gradient-to-r from-white to-[#93c5fd] bg-clip-text text-transparent">
            Flugram
          </span>
        </div>

        {/* Axtarış */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
            text-slate-400" />
          <input
            type="text"
            placeholder="Axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[rgba(96,165,250,0.1)] border border-[rgba(96,165,250,0.2)]
              rounded-xl py-2 pl-9 pr-3 text-sm text-slate-200
              placeholder:text-slate-500 outline-none
              focus:border-[rgba(96,165,250,0.5)] transition-colors"
          />
        </div>
      </div>

      {/* Söhbət siyahısı */}
      <p className="px-4 pt-3 pb-1.5 text-[11px] font-medium text-slate-400
        uppercase tracking-[0.8px]">
        Mesajlar
      </p>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {filtered.map((chat, i) => {
          const otherUid = chat.participants.find((p) => p !== currentUser?.uid) ?? "";
          const otherName = chat.participantNames[otherUid] ?? "İstifadəçi";
          const unread = chat.unreadCount?.[currentUser?.uid ?? ""] ?? 0;
          const grad = GRADIENTS[i % GRADIENTS.length];
          const isActive = chat.id === activeChatId;

          return (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${isActive
                  ? "bg-[rgba(30,58,138,0.4)] border-r-2 border-[#60a5fa]"
                  : "hover:bg-[rgba(96,165,250,0.08)]"
                }`}
            >
              {/* Avatar */}
              <div className={`relative w-11 h-11 rounded-full flex-shrink-0
                bg-gradient-to-br ${grad}
                flex items-center justify-center text-white font-semibold text-sm`}>
                {getInitials(otherName)}
                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5
                  rounded-full bg-green-500 border-2 border-[#0f172a]" />
              </div>

              {/* Ad + preview */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {otherName}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {chat.lastMessage}
                </p>
              </div>

              {/* Vaxt + badge */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-slate-500">
                  {chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ""}
                </span>
                {unread > 0 && (
                  <span className="bg-[#60a5fa] text-[#0f172a] text-[11px]
                    font-semibold rounded-full px-1.5 min-w-[20px] text-center">
                    {unread}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[rgba(96,165,250,0.2)]
        flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#60a5fa]
          flex items-center justify-center text-white font-semibold text-sm">
          {getInitials(currentUser?.displayName ?? "Sən")}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-200">
            {currentUser?.displayName ?? "Sən"}
          </p>
          <p className="text-[11px] text-green-400">● Online</p>
        </div>
        <button onClick={() => signOut(auth)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#60a5fa]
            hover:bg-[rgba(96,165,250,0.1)] transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
