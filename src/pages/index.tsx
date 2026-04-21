import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function Home() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0f172a" }}>
      <Sidebar 
        activeChatId={activeChatId} 
        onSelectChat={(id) => setActiveChatId(id)} 
      />
      <ChatWindow 
        activeChatId={activeChatId} 
        otherUserName="İstifadəçi" 
        otherUserStatus="online"
      />
    </div>
  );
}