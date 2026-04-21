// lib/firebase.ts
// Flugram - Firebase konfiqurasiyası

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ⚠️  Bu dəyərləri Firebase Console-dan götürün:
// https://console.firebase.google.com → Layihə Parametrləri → SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Duplicate initialization-un qarşısını al (Next.js HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

// ─────────────────────────────────────────────
// FIRESTORE KOLLEKSİYA STRUKTURU
// ─────────────────────────────────────────────
//
// users/{userId}
//   ├── uid: string
//   ├── displayName: string
//   ├── email: string
//   ├── photoURL: string | null
//   ├── status: "online" | "away" | "offline"
//   └── lastSeen: Timestamp
//
// chats/{chatId}
//   ├── participants: string[]       ← [uid1, uid2]
//   ├── participantNames: { [uid]: string }
//   ├── lastMessage: string
//   ├── lastMessageTime: Timestamp
//   ├── lastMessageSender: string
//   └── unreadCount: { [uid]: number }
//
// chats/{chatId}/messages/{messageId}
//   ├── text: string
//   ├── senderId: string
//   ├── senderName: string
//   ├── timestamp: Timestamp
//   ├── status: "sent" | "delivered" | "read"
//   └── type: "text" | "image" | "file"
//
// Firestore Security Rules (firestore.rules):
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{userId} {
//       allow read: if request.auth != null;
//       allow write: if request.auth.uid == userId;
//     }
//     match /chats/{chatId} {
//       allow read, write: if request.auth.uid in resource.data.participants;
//       match /messages/{messageId} {
//         allow read, write: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
//       }
//     }
//   }
// }
