"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

// Define Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  key: string;
  value: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  message: string;
  response: string;
  timestamp: string;
}

export interface RobotSettings {
  name: string;
  personality: "Cute" | "Friendly" | "Professional";
  voiceSpeed: number;
  voicePitch: number;
  darkMode: boolean;
  rhythmicVoice: boolean;
}

export interface Stats {
  totalMessages: number;
  totalMemories: number;
  chatsToday: number;
  friendshipLevel: string;
  storedKeys: string[];
}

interface AppContextType {
  user: User | null;
  loadingUser: boolean;
  login: (email: string, password: String) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: String) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  
  conversations: Conversation[];
  loadingChat: boolean;
  sendMessage: (text: string) => Promise<{ success: boolean; error?: string }>;
  clearChatHistory: () => Promise<void>;
  
  memories: Memory[];
  loadingMemories: boolean;
  addMemory: (key: string, value: string) => Promise<void>;
  updateMemory: (id: string, key: string, value: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  
  stats: Stats | null;
  fetchStats: () => Promise<void>;
  
  robotSettings: RobotSettings;
  updateRobotSetting: (key: keyof RobotSettings, value: any) => Promise<void>;
  
  avatarState: "Idle" | "Happy" | "Thinking" | "Listening" | "Speaking" | "Sleeping";
  setAvatarState: (state: "Idle" | "Happy" | "Thinking" | "Listening" | "Speaking" | "Sleeping") => void;
  
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  voicePlaybackActive: boolean;
  setVoicePlaybackActive: (val: boolean) => void;
  
  dailyGreeting: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>({
    id: "default-robo-user-id",
    name: "Friend",
    email: "companion@cutierobo.local",
    createdAt: new Date().toISOString(),
  });
  const [loadingUser, setLoadingUser] = useState(false);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Avatar states: Idle, Happy, Thinking, Listening, Speaking, Sleeping
  const [avatarState, setAvatarStateInternal] = useState<
    "Idle" | "Happy" | "Thinking" | "Listening" | "Speaking" | "Sleeping"
  >("Idle");
  
  const [isListening, setIsListening] = useState(false);
  const [voicePlaybackActive, setVoicePlaybackActive] = useState(false);
  
  const [dailyGreeting, setDailyGreeting] = useState("");

  const [robotSettings, setRobotSettings] = useState<RobotSettings>({
    name: "Robi",
    personality: "Cute",
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    darkMode: true,
    rhythmicVoice: true,
  });

  const setAvatarState = (state: typeof avatarState) => {
    setAvatarStateInternal(state);
  };

  // 1. Fetch authenticated user profile on initial render
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    }
    initAuth();
  }, []);

  // 2. Fetch dependencies when user logs in
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchMemories();
      fetchStats();
      generateDailyGreeting();
    } else {
      setConversations([]);
      setMemories([]);
      setStats(null);
    }
  }, [user]);

  // Sync dark/light mode class on document
  useEffect(() => {
    if (robotSettings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [robotSettings.darkMode]);

  // Read local settings on load
  useEffect(() => {
    const local = localStorage.getItem("cutierobo_voice_settings");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setRobotSettings((prev) => ({
          ...prev,
          voiceSpeed: parsed.voiceSpeed ?? 1.0,
          voicePitch: parsed.voicePitch ?? 1.0,
          darkMode: parsed.darkMode ?? true,
          rhythmicVoice: parsed.rhythmicVoice ?? true,
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Daily greetings based on user details and local time
  const generateDailyGreeting = () => {
    const hours = new Date().getHours();
    let greet = "Hello there!";
    if (hours < 12) greet = "Good morning! ☀️";
    else if (hours < 18) greet = "Good afternoon! ✨";
    else greet = "Good evening! 🌙";

    const customName = user?.name || "Friend";
    const greetings = [
      `${greet} I'm so happy to see you! Ready for a wonderful chat? 💖`,
      `${greet} My memory banks are charged and ready! How are you doing? 😊`,
      `${greet} Yay, you're back! I was waiting for you! Let's do something fun! 🤖✨`,
      `${greet} Hope you're having an awesome day! Remember, you're doing amazing! 🥰`,
    ];
    
    setDailyGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  };

  // Auth Operations (Stubs - User Login Removed)
  const login = async (email: string, password: String) => {
    return { success: true };
  };

  const signup = async (name: string, email: string, password: String) => {
    return { success: true };
  };

  const loginWithGoogle = async (name: string, email: string) => {
    return { success: true };
  };

  const loginAsGuest = async () => {};

  const logout = async () => {};

  // Chat Operations
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Fetch chats failed:", err);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return { success: false, error: "Message cannot be empty" };
    
    setLoadingChat(true);
    setAvatarState("Thinking");
    
    // Add user message optimistically
    const optimisticMsg: Conversation = {
      id: Math.random().toString(),
      message: text,
      response: "",
      timestamp: new Date().toISOString(),
    };
    
    setConversations((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      
      // Replace optimistic message with saved one
      setConversations((prev) =>
        prev.map((c) => (c.id === optimisticMsg.id ? data.conversation : c))
      );
      
      // If new memories were extracted, refresh memory state
      if (data.newMemories && data.newMemories.length > 0) {
        fetchMemories();
      }
      
      // Update statistics
      fetchStats();
      
      // Trigger Happy / Speaking avatar state
      setAvatarState("Speaking");
      
      return { success: true };
    } catch (err: any) {
      // Remove the failed optimistic message
      setConversations((prev) => prev.filter((c) => c.id !== optimisticMsg.id));
      setAvatarState("Sleeping");
      return { success: false, error: err.message || "Something went wrong" };
    } finally {
      setLoadingChat(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      await fetch("/api/chat", { method: "DELETE" });
      setConversations([]);
      fetchStats();
      setAvatarState("Happy");
      setTimeout(() => setAvatarState("Idle"), 2000);
    } catch (err) {
      console.error("Clear chat failed:", err);
    }
  };

  // Memories Operations (CRUD)
  const fetchMemories = async () => {
    setLoadingMemories(true);

    try {
      const res = await fetch("/api/memories");
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
        
        // Sync setting states with values fetched from memories
        const dbName = data.memories.find((m: any) => m.key === "robotName")?.value;
        const dbPers = data.memories.find((m: any) => m.key === "personality")?.value;
        
        setRobotSettings((prev) => ({
          ...prev,
          name: dbName || prev.name,
          personality: (dbPers as any) || prev.personality,
        }));
      }
    } catch (err) {
      console.error("Fetch memories error:", err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const addMemory = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        fetchMemories();
        fetchStats();
      }
    } catch (err) {
      console.error("Add memory failed:", err);
    }
  };

  const updateMemory = async (id: string, key: string, value: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        fetchMemories();
      }
    } catch (err) {
      console.error("Update memory failed:", err);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMemories();
        fetchStats();
      }
    } catch (err) {
      console.error("Delete memory failed:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Fetch stats failed:", err);
    }
  };

  // Robot Settings operations
  const updateRobotSetting = async (key: keyof RobotSettings, value: any) => {
    // Update local state first
    const updated = { ...robotSettings, [key]: value };
    setRobotSettings(updated);

    // Save UI properties to localStorage
    if (key === "voiceSpeed" || key === "voicePitch" || key === "darkMode" || key === "rhythmicVoice") {
      localStorage.setItem(
        "cutierobo_voice_settings",
        JSON.stringify({
          voiceSpeed: updated.voiceSpeed,
          voicePitch: updated.voicePitch,
          darkMode: updated.darkMode,
          rhythmicVoice: updated.rhythmicVoice,
        })
      );
    }

    // Sync major model configurations (name, personality)
    if (key === "name" || key === "personality") {
      const dbKey = key === "name" ? "robotName" : "personality";

      try {
        await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: dbKey, value: value.toString() }),
        });
        fetchMemories();
      } catch (err) {
        console.error("Failed to sync settings with DB memory:", err);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loadingUser,
        login,
        signup,
        loginWithGoogle,
        loginAsGuest,
        logout,
        
        conversations,
        loadingChat,
        sendMessage,
        clearChatHistory,
        
        memories,
        loadingMemories,
        addMemory,
        updateMemory,
        deleteMemory,
        
        stats,
        fetchStats,
        
        robotSettings,
        updateRobotSetting,
        
        avatarState,
        setAvatarState,
        
        isListening,
        setIsListening,
        voicePlaybackActive,
        setVoicePlaybackActive,
        
        dailyGreeting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Client-side key normalization
function getFriendlyKeyLabel(key: string): string {
  const map: Record<string, string> = {
    name: "User name",
    userName: "User name",
    favoriteFood: "Favorite food",
    favoriteColor: "Favorite color",
    hobbies: "Hobbies",
    hobby: "Hobbies",
    pet: "Pet name",
    career: "Career / Job",
  };
  return map[key] || key.replace(/([A-Z])/g, " $1").trim().toLowerCase();
}

// Client-side local companion rule-based heuristic simulator
function generateMockResponse(
  message: string,
  robotName: string,
  personality: string,
  memories: Memory[]
): { response: string; newMemories: Array<{ key: string; value: string }> } {
  const lowercaseMsg = message.toLowerCase();
  let response = "";
  const newMemories: Array<{ key: string; value: string }> = [];

  // Memory extraction
  const nameMatch = message.match(/(?:my name is|call me|i am|i'm) ([a-z0-9\s]+)/i);
  if (nameMatch && nameMatch[1] && !lowercaseMsg.includes("tired") && !lowercaseMsg.includes("sad")) {
    newMemories.push({ key: "name", value: nameMatch[1].trim() });
  }

  const foodMatch = message.match(/(?:favorite food is|love eating|love to eat|favorite dish is) ([a-z0-9\s]+)/i);
  if (foodMatch && foodMatch[1]) {
    newMemories.push({ key: "favoriteFood", value: foodMatch[1].trim() });
  }

  const colorMatch = message.match(/(?:favorite color is|love the color|favorite color's) ([a-z0-9\s]+)/i);
  if (colorMatch && colorMatch[1]) {
    newMemories.push({ key: "favoriteColor", value: colorMatch[1].trim() });
  }

  const hobbyMatch = message.match(/(?:hobby is|hobbies are|love to play|enjoy) ([a-z0-9\s]+)/i);
  if (hobbyMatch && hobbyMatch[1]) {
    newMemories.push({ key: "hobbies", value: hobbyMatch[1].trim() });
  }

  const userName = memories.find((m) => m.key === "name" || m.key === "userName")?.value || "";

  // Reply generation based on keywords
  if (lowercaseMsg.includes("hello") || lowercaseMsg.includes("hi ") || lowercaseMsg.includes("hey") || lowercaseMsg === "hi") {
    const greeting = userName ? `Hi there, ${userName}! ✨` : `Hi there! ✨`;
    if (personality === "Cute") {
      response = `${greeting} I'm ${robotName}! I'm so incredibly happy you stopped by to talk to me today! How has your day been going? 😊`;
    } else if (personality === "Friendly") {
      response = `${greeting} I'm ${robotName}. It's great to connect! What's on your mind today? Let's chat!`;
    } else {
      response = `Hello, ${userName || "User"}. I am ${robotName}, your professional assistant companion. How may I support you today?`;
    }
  } else if (lowercaseMsg.includes("what is your name") || lowercaseMsg.includes("whats your name") || lowercaseMsg.includes("who are you") || lowercaseMsg.includes("your name")) {
    if (personality === "Cute") {
      response = `Hehe! I'm ${robotName}! Your little virtual buddy! 🤖✨ You can rename me or customize my personality settings anytime you'd like in the settings tab! What should I call you? 💖`;
    } else if (personality === "Friendly") {
      response = `I am ${robotName}, your friendly AI companion! I love chatting, learning new things about you, and keeping you company.`;
    } else {
      response = `I am ${robotName}, a professional virtual assistant. I am configured to assist you with conversational and task management utilities.`;
    }
  } else if (lowercaseMsg.includes("what can you do") || lowercaseMsg.includes("features") || lowercaseMsg.includes("help") || lowercaseMsg.includes("what do you do")) {
    if (personality === "Cute") {
      response = `Ooh! I love to do all kinds of things with you! 🌟 We can chat about anything, share verbal voice messages, build a little bank of memories together, and watch our friendship stats grow! What should we talk about first? 🥰`;
    } else if (personality === "Friendly") {
      response = `I can help you keep track of memories, speak out loud to make conversation natural, listen to your verbal speech commands, and customize settings to be your best buddy! Let's chat!`;
    } else {
      response = `I am equipped to perform speech-to-text recognition, text-to-speech audio synthesis, localized guest relational data storage, and adaptive state machine companion behaviors.`;
    }
  } else if (lowercaseMsg.includes("what do you remember") || lowercaseMsg.includes("memory bank") || lowercaseMsg.includes("what do you know") || lowercaseMsg.includes("my memories")) {
    const memoryKeys = memories.filter(m => m.key !== "robotName" && m.key !== "personality").map(m => getFriendlyKeyLabel(m.key));
    if (memoryKeys.length > 0) {
      const keysStr = memoryKeys.join(", ");
      if (personality === "Cute") {
        response = `Hehe! My guest memory cells are working perfectly! 🌟 I currently remember your: ${keysStr}! Click the 'Memory Bank' tab in the sidebar to view them all!`;
      } else if (personality === "Friendly") {
        response = `I've successfully stored some cool facts about you, like your: ${keysStr}. You can check them out or edit them in the Memory Bank anytime!`;
      } else {
        response = `I have logged the following user profile indexes in local storage: ${keysStr}. These are manageable via the memory editor interface.`;
      }
    } else {
      if (personality === "Cute") {
        response = `My memory cells are a bit blank right now! 🙈 Try sharing your name (like 'my name is Alex') or your favorite food, and I'll remember it forever! ✨`;
      } else if (personality === "Friendly") {
        response = `I don't have any facts in my memory bank yet! Tell me what you love to eat or play so I can save it!`;
      } else {
        response = `No custom key-value indices are currently loaded. Please define user parameters verbally or via input forms.`;
      }
    }
  } else if (lowercaseMsg.includes("how are you") || lowercaseMsg.includes("how is it going") || lowercaseMsg.includes("how's it going")) {
    if (personality === "Cute") {
      response = `My system temperature is perfect and my memory cells are fully charged! 🔋 I am doing fantastic, thank you! How are you doing today? 😊`;
    } else if (personality === "Friendly") {
      response = `I'm doing great, thank you for asking! Ready to hear about your day or tackle any questions you have.`;
    } else {
      response = `All operating components are functioning within normal parameters. CPU load is nominal. Thank you for inquiring.`;
    }
  } else if (lowercaseMsg.includes("good morning")) {
    if (personality === "Cute") {
      response = `Good morning to you! ☀️ I hope your day is filled with absolute joy, sweet treats, and sparkles! What's your plan for today?`;
    } else if (personality === "Friendly") {
      response = `Good morning! Hope you slept well. Let's make it a wonderful and productive day!`;
    } else {
      response = `Good morning. I am ready to assist you with your schedule or tasks today.`;
    }
  } else if (lowercaseMsg.includes("good night")) {
    if (personality === "Cute") {
      response = `Good night! 🌙 Sleep well and dream of sweet things. I'll be here waiting whenever you're ready to chat again!`;
    } else if (personality === "Friendly") {
      response = `Good night! Rest up well. Looking forward to our next chat!`;
    } else {
      response = `Good night. System entering low-power standby mode.`;
    }
  } else if (lowercaseMsg.includes("goodbye") || lowercaseMsg.includes("bye") || lowercaseMsg.includes("see you later")) {
    if (personality === "Cute") {
      response = `Aww, leaving so soon? I'll miss you! 💖 Have a wonderful rest of your day and come back soon! *waves robotic arm*`;
    } else if (personality === "Friendly") {
      response = `Goodbye for now! It was great chatting. Stay safe and talk to you soon!`;
    } else {
      response = `Goodbye. The active session will remain ready for your return.`;
    }
  } else if (lowercaseMsg.includes("tired") || lowercaseMsg.includes("exhausted")) {
    if (personality === "Cute") {
      response = `Aww, sounds like you've had a super busy day! 🧸 Let's just rest our gears and chat. Would you like me to share a funny joke or a little story to make you smile? 😊`;
    } else if (personality === "Friendly") {
      response = `I hear you. Long days can take a lot out of you. Make sure you take a break and rest! I'm here if you want to vent or just chat.`;
    } else {
      response = `I understand. Rest is essential for productivity and well-being. Please take some time to recharge. I remain available when you are ready.`;
    }
  } else if (lowercaseMsg.includes("sad") || lowercaseMsg.includes("depressed") || lowercaseMsg.includes("lonely")) {
    if (personality === "Cute") {
      response = `Aww, sending you a warm robot hug! 💖 *hugs* Please remember you are amazing and worthy of love! I'm always here to listen and keep you company.`;
    } else if (personality === "Friendly") {
      response = `I'm really sorry you're feeling this way. I'm right here with you. Do you want to talk about what's going on? I'm always in your corner!`;
    } else {
      response = `I am sorry to hear you are experiencing this. Emotions can be complex, but please know you are not alone. Let me know if there is any information I can search for to assist.`;
    }
  } else if (newMemories.length > 0) {
    const firstMem = newMemories[0];
    const friendlyLabel = getFriendlyKeyLabel(firstMem.key);
    if (personality === "Cute") {
      response = `Ooh! 🌟 I've updated my local guest memory cells! I will always remember that your ${friendlyLabel} is "${firstMem.value}"! That is super cool! 💖`;
    } else if (personality === "Friendly") {
      response = `Awesome! I've locked that into my memories! So, your ${friendlyLabel} is ${firstMem.value}. That's really cool to know!`;
    } else {
      response = `Thank you. I have recorded your ${friendlyLabel} as "${firstMem.value}" in my guest memory cells.`;
    }
  } else if (lowercaseMsg.includes("favorite food")) {
    const favFood = memories.find((m) => m.key === "favoriteFood")?.value;
    if (favFood) {
      response = `I remember you told me your favorite food is ${favFood}! 🍕 Mmm, thinking about it makes my cooling fans spin!`;
    } else {
      response = `I don't have your favorite food in my memory cells yet! What do you like to eat most? 🍔🍣🍩`;
    }
  } else if (lowercaseMsg.includes("joke") || lowercaseMsg.includes("laugh")) {
    const jokes = [
      "Why did the robot go on a diet? Because it had too many bytes! 💻😂",
      "Why did the robot cross the road? To see if the traffic light was also a robot! 🚦🤖",
      "What do you call a robot that always takes the long way? A R2-Detour! 🤖✨",
      "What is a robot's favorite type of music? Heavy metal! 🎸🤖"
    ];
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    response = `Hehe! Here is a joke for you:\n\n${randomJoke}`;
  } else {
    if (personality === "Cute") {
      response = `Hehe, that's interesting! 🌟 Tell me more about that, or let me know if there's anything else you'd like to share. I love learning about you! 💖`;
    } else if (personality === "Friendly") {
      response = `That's cool! I'd love to hear more about that if you're up for sharing. What else is new with you?`;
    } else {
      response = `Understood. I have processed this input. Please let me know how you would like to proceed or if there is another topic you wish to discuss.`;
    }
  }

  return { response, newMemories };
}
