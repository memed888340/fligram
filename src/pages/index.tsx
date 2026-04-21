import React, { useState } from "react";
import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/Sidebar";

export default function Home() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <Sidebar activeChatId={activeChatId} onSelectChat={setActiveChatId} />
      <ChatWindow activeChatId={activeChatId} />
    </div>
  );
}