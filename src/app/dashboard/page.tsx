"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp, Memory, Conversation } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import {
  MessageSquare,
  Mic,
  MicOff,
  BrainCircuit,
  Settings,
  BarChart3,
  LogOut,
  Send,
  Trash2,
  Download,
  Plus,
  Edit2,
  Trash,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  User,
  Check,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    loadingUser,
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
  } = useApp();

  const [activeTab, setActiveTab] = useState<"chat" | "memories" | "stats" | "settings">("chat");
  const [inputText, setInputText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [wasLastInputVoice, setWasLastInputVoice] = useState(false);
  const [isTtsMock, setIsTtsMock] = useState(false);
  
  // Memory Form state
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [memKey, setMemKey] = useState("");
  const [memVal, setMemVal] = useState("");
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  
  // Custom Settings local state to prevent laggy typing
  const [tempRobotName, setTempRobotName] = useState(robotSettings.name);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("alloy");

  // Audio / Mic references for server-side STT & TTS
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Scroll Anchor for Chat Auto Scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rhythmic Speech queue references
  const speechTimeoutRef = useRef<any>(null);
  const activeSegmentsRef = useRef<any[]>([]);

  // 1. Redirect if unauthenticated (Removed - User Login Removed)

  // 1.5 Load System Speech Voice Packs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedVoiceName = localStorage.getItem("cutierobo_voice_name") || "alloy";
      setSelectedVoiceName(storedVoiceName);
    }
  }, []);

  // 2. Initialize Voice Support Check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setSpeechSupported(hasMedia);
    }
  }, []);

  // 3. Auto Scroll on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, loadingChat]);

  // 4. Update temp robot name when the database setting loads
  useEffect(() => {
    setTempRobotName(robotSettings.name);
  }, [robotSettings.name]);

  // 5. Speak companion's response on chat update
  useEffect(() => {
    if (conversations.length > 0) {
      const lastMessage = conversations[conversations.length - 1];
      if (lastMessage.response && !loadingChat && lastMessage.id) {
        // Prevent repeating previous history readouts by saving read states
        const hasSpokenKey = `spoken_${lastMessage.id}`;
        const alreadySpoken = sessionStorage.getItem(hasSpokenKey);
        if (!alreadySpoken) {
          sessionStorage.setItem(hasSpokenKey, "true");
          // Always speak back out loud on verbal commands, otherwise check standard mute toggle
          if (wasLastInputVoice || !ttsMuted) {
            speakText(lastMessage.response);
          }
        }
      }
    }
  }, [conversations, loadingChat, wasLastInputVoice, ttsMuted]);

  // Helper to completely stop speech synthesis and clear timers
  const cancelSpeech = () => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current = null;
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    activeSegmentsRef.current = [];
    setVoicePlaybackActive(false);
  };

  // Speech Recognition control using MediaRecorder & server-side STT (/api/stt)
  const toggleListening = async () => {
    if (!speechSupported) {
      alert("Audio recording is not supported in this browser or permission was denied.");
      return;
    }

    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } else {
      cancelSpeech();
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsListening(false);
          setAvatarState("Thinking");

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach((track) => track.stop());

          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");

          try {
            const res = await fetch("/api/stt", {
              method: "POST",
              headers: {
                "x-api-key": "kiki-key-2026",
              },
              body: formData,
            });
            const data = await res.json();
            if (data.text) {
              setInputText(data.text);
              setWasLastInputVoice(true);
              handleSendChatMessage(data.text, true);
            } else {
              console.error("STT returned empty text response:", data);
              setAvatarState("Idle");
            }
          } catch (err) {
            console.error("Failed to transcribe voice using backend STT:", err);
            setAvatarState("Idle");
            alert("Transcription failed. Make sure the server has GEMINI_API_KEY set.");
          }
        };

        mediaRecorder.start();
        setIsListening(true);
        setAvatarState("Listening");
      } catch (err) {
        console.error("Error starting recording:", err);
        setIsListening(false);
        setAvatarState("Idle");
        alert("Microphone access was denied or is unavailable.");
      }
    }
  };

  // Speech Synthesis Playback using server-side TTS (/api/tts)
  const speakText = async (text: string, overrideVoiceName?: string) => {
    cancelSpeech();
    if (!text) return;

    // Clean emojis, asterisks, formatting for clean text
    const cleanText = text
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
      .replace(/\*([^*]+)\*/g, "") 
      .replace(/_([^_]+)_/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/[#_*`~]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    try {
      setVoicePlaybackActive(true);
      setAvatarState("Speaking");

      const voiceToUse = overrideVoiceName || selectedVoiceName || "alloy";

      // Call server-side TTS
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "kiki-key-2026",
        },
        body: JSON.stringify({ text: cleanText, voice: voiceToUse }),
      });
      const data = await res.json();
      setIsTtsMock(!!data.isMock);

      if (data.audioUrl) {
        // Resolve absolute URL to relative path for browser playback safety
        const relativeUrl = data.audioUrl.startsWith("http")
          ? new URL(data.audioUrl).pathname
          : data.audioUrl;
        const audio = new Audio(relativeUrl);
        audioPlaybackRef.current = audio;

        audio.onplay = () => {
          setVoicePlaybackActive(true);
          setAvatarState("Speaking");
        };

        audio.onended = () => {
          setVoicePlaybackActive(false);
          setAvatarState("Idle");
        };

        audio.onerror = () => {
          setVoicePlaybackActive(false);
          setAvatarState("Idle");
        };

        try {
          await audio.play();
        } catch (playErr) {
          console.warn("Audio playback failed or was blocked by browser policy:", playErr);
          setVoicePlaybackActive(false);
          setAvatarState("Idle");
        }
      } else {
        setVoicePlaybackActive(false);
        setAvatarState("Idle");
      }
    } catch (err) {
      console.error("TTS audio playback failed:", err);
      setVoicePlaybackActive(false);
      setAvatarState("Idle");
    }
  };

  // Handle send message logic
  const handleSendChatMessage = async (textToSend?: string, isVoiceInput: boolean = false) => {
    const message = (textToSend || inputText).trim();
    if (!message) return;

    if (!textToSend) setInputText("");
    
    // Stop any ongoing speech
    cancelSpeech();

    // Track if user sent this via SpeechRecognition
    setWasLastInputVoice(isVoiceInput);

    const res = await sendMessage(message);
    if (res.success) {
      // If we are in happy personality, let's keep avatar happy for 3 seconds
      setTimeout(() => {
        setAvatarState("Idle");
      }, 3500);
    } else {
      alert(res.error || "Failed to deliver message to companion.");
    }
  };

  // Keypress event handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  // Export history handler
  const handleExportHistory = () => {
    if (conversations.length === 0) {
      alert("No conversation history to export yet! Go share a nice chat.");
      return;
    }

    const textOutput = conversations
      .map(
        (c) =>
          `[${new Date(c.timestamp).toLocaleString()}]\nUser: ${c.message}\n${robotSettings.name}: ${c.response}\n\n`
      )
      .join("");

    const blob = new Blob([textOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${robotSettings.name}_Chat_History.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Add manually saved memory
  const handleAddMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memKey || !memVal) return;
    await addMemory(memKey.trim(), memVal.trim());
    setMemKey("");
    setMemVal("");
    setIsAddingMemory(false);
  };

  // Edit memory submit
  const handleEditMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory || !editingMemory.key || !editingMemory.value) return;
    await updateMemory(editingMemory.id, editingMemory.key.trim(), editingMemory.value.trim());
    setEditingMemory(null);
  };

  // Custom Settings database save handler
  const saveRobotNameSetting = () => {
    if (tempRobotName.trim() && tempRobotName !== robotSettings.name) {
      updateRobotSetting("name", tempRobotName.trim());
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-gradient-to-tr from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)] select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-200/10 flex flex-col p-4 z-10">
        
        {/* COMPANION CARD MINI */}
        <div className="flex items-center space-x-3 px-2.5 py-4 border-b border-slate-200/10 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-2xl shadow-lg border border-violet-400/20">
            🤖
          </div>
          <div>
            <h2 className="font-display font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100">
              {robotSettings.name}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {robotSettings.personality} Mode
            </span>
          </div>
        </div>

        {/* NAVIGATION MENUS */}
        <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start gap-1 md:gap-2">
          
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/10"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">Chat Hub</span>
          </button>

          <button
            onClick={() => setActiveTab("memories")}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "memories"
                ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/10"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">Memory Bank</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "stats"
                ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/10"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/10"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">Settings</span>
          </button>

        </nav>

        {/* USER PROFILE BOTTOM */}
        <div className="hidden md:flex flex-col space-y-3 pt-6 border-t border-slate-200/10 mt-auto">
          <div className="flex items-center space-x-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-violet-500 text-xs">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate">Local Database Session</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative p-4 md:p-6">
        
        {/* COMPANION AVATAR INTERACTIVE BANNER */}
        <header className="w-full glass-card rounded-3xl p-4 md:p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
            <Avatar state={avatarState} size="sm" />
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="font-display font-extrabold text-lg text-slate-800 dark:text-slate-100">
                  {robotSettings.name}
                </span>
                {voicePlaybackActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                {avatarState === "Listening" && "🎙️ Transcribing voice waves into circuits..."}
                {avatarState === "Thinking" && "⚡ Generating cozy thoughts..."}
                {avatarState === "Speaking" && "🔊 Sharing high-frequency sweet speech!"}
                {avatarState === "Sleeping" && "💤 Resting capacitors... tap mic to wake up."}
                {avatarState === "Happy" && "💖 Yay! Processing awesome happiness!"}
                {avatarState === "Idle" && `Greeting: "${dailyGreeting.slice(0, 30)}..."`}
              </p>
            </div>
          </div>

          {/* QUICK CHAT ACTIONS */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTtsMuted(!ttsMuted)}
              title={ttsMuted ? "Unmute TTS response" : "Mute TTS response"}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                ttsMuted
                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                  : "bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300"
              }`}
            >
              {ttsMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
            </button>
            <button
              onClick={handleExportHistory}
              title="Download chat history"
              className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              <Download className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to wipe my chat logs? I'll miss our memories together! 🥺")) {
                  clearChatHistory();
                }
              }}
              title="Clear chat logs"
              className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/25 transition-all cursor-pointer"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {isTtsMock && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center space-x-2 text-xs font-medium">
            <span>⚠️</span>
            <span>
              <strong>Speech Synthesis Offline (Demo Mode):</strong> The server failed to generate audio. Kiki is playing silent mock audio. Ensure your server has active internet access, or set <code>GEMINI_API_KEY</code> in the <code>.env</code> file.
            </span>
          </div>
        )}

        {/* TAB CONDITIONAL PANELS */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* TAB 1: AI CHAT HUX */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden glass-card rounded-3xl relative">
              
              {/* CHAT MESSAGES LOG */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {conversations.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center text-4xl shadow-inner animate-pulse">
                      💌
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100">
                        Start of your companion log!
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Say hello to {robotSettings.name}! Try telling it your name, your favorite food, or color. It will lock them in its data memories!
                      </p>
                    </div>
                  </div>
                ) : (
                  conversations.map((chat, i) => (
                    <div key={chat.id || i} className="flex flex-col space-y-3.5">
                      
                      {/* USER MESSAGE - ALIGNED RIGHT */}
                      <div className="flex justify-end pl-10">
                        <div className="relative p-3.5 rounded-2xl rounded-tr-none bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md max-w-lg">
                          <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                            {chat.message}
                          </p>
                          <span className="block text-[8px] text-violet-200 text-right mt-1.5 font-bold">
                            {new Date(chat.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* ROBOT MESSAGE - ALIGNED LEFT */}
                      {chat.response && (
                        <div className="flex justify-start pr-10">
                          <div className="flex items-start space-x-2 max-w-lg">
                            <div className="w-7 h-7 rounded-xl bg-violet-900/50 flex items-center justify-center text-sm shadow-sm border border-violet-400/20 shrink-0">
                              🤖
                            </div>
                            <div className="relative p-3.5 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 shadow-sm">
                              <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100 break-words whitespace-pre-wrap">
                                {chat.response}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <button
                                  onClick={() => speakText(chat.response)}
                                  className="text-[10px] text-violet-400 font-bold flex items-center space-x-1 hover:text-violet-300"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>Replay audio</span>
                                </button>
                                <span className="text-[8px] text-slate-500 font-medium">
                                  {new Date(chat.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  ))
                )}

                {/* TYPING INDICATOR */}
                {loadingChat && (
                  <div className="flex justify-start pr-10">
                    <div className="flex items-start space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-violet-900/50 flex items-center justify-center text-sm shadow-sm border border-violet-400/20 shrink-0">
                        🤖
                      </div>
                      <div className="relative p-4 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 shadow-sm flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-150" />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-300" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT BAR PANEL */}
              <div className="p-4 border-t border-slate-200/10 flex items-center space-x-2 bg-slate-900/5 dark:bg-slate-950/20">
                <button
                  onClick={toggleListening}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer relative shrink-0 ${
                    isListening
                      ? "bg-cyan-500 text-white animate-listening shadow-lg shadow-cyan-500/20"
                      : "bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/10 dark:border-slate-800/10"
                  }`}
                  title={isListening ? "Listening... click to stop" : "Start one-click voice conversion"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? "I am listening to your voice..."
                      : "Type something nice or ask about memories..."
                  }
                  disabled={isListening}
                  className="flex-1 bg-white/70 dark:bg-slate-900/70 border border-slate-200/10 dark:border-slate-800/10 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent rounded-2xl px-4 py-3.5 text-sm text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
                />

                <button
                  onClick={() => handleSendChatMessage()}
                  disabled={loadingChat || !inputText.trim() || isListening}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-violet-500/10 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: MEMORIES BANK */}
          {activeTab === "memories" && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                    <span>Persistent Memories</span>
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage things Cutie Robo has registered in its permanent storage circuits.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingMemory(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer transition-all hover:scale-102"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Manual Memory</span>
                </button>
              </div>

              {/* DYNAMIC FORMS OVERLAYS */}
              {isAddingMemory && (
                <form
                  onSubmit={handleAddMemorySubmit}
                  className="glass-card rounded-2xl p-5 border border-violet-500/20 space-y-4 animate-float"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>Add New Memory Circuit</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingMemory(false)}
                      className="p-1 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory Key</label>
                      <input
                        type="text"
                        placeholder="e.g. favoriteFood, petName"
                        value={memKey}
                        onChange={(e) => setMemKey(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory Value</label>
                      <input
                        type="text"
                        placeholder="e.g. Pizza, Goldie"
                        value={memVal}
                        onChange={(e) => setMemVal(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-xs"
                  >
                    Save Memory
                  </button>
                </form>
              )}

              {editingMemory && (
                <form
                  onSubmit={handleEditMemorySubmit}
                  className="glass-card rounded-2xl p-5 border border-cyan-500/20 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                      Edit Memory Circuit
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingMemory(null)}
                      className="p-1 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory Key</label>
                      <input
                        type="text"
                        value={editingMemory.key}
                        onChange={(e) => setEditingMemory({ ...editingMemory, key: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory Value</label>
                      <input
                        type="text"
                        value={editingMemory.value}
                        onChange={(e) => setEditingMemory({ ...editingMemory, value: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-xs"
                  >
                    Commit Update
                  </button>
                </form>
              )}

              {/* GRID OF STORED MEMORIES */}
              <div className="flex-1 overflow-y-auto pr-1">
                {loadingMemories ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  </div>
                ) : memories.filter(m => m.key !== "robotName" && m.key !== "personality").length === 0 ? (
                  <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center space-y-3">
                    <span className="text-4xl">🧠</span>
                    <h3 className="font-display font-extrabold text-sm text-slate-700 dark:text-slate-300">
                      Memory Banks are currently blank!
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Cutie Robo will store preferences naturally when you chat, or you can register one manually using the button above!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {memories
                      .filter((m) => m.key !== "robotName" && m.key !== "personality")
                      .map((mem) => (
                        <div
                          key={mem.id}
                          className="glass-card p-4 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all border-l-4 border-l-violet-500"
                        >
                          <div className="space-y-1.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-violet-500/10 text-violet-400 border border-violet-500/25">
                              {mem.key}
                            </span>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-0.5">
                              "{mem.value}"
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/10 mt-4 pt-2.5">
                            <span className="text-[9px] text-slate-500 font-medium">
                              Logged: {new Date(mem.createdAt).toLocaleDateString()}
                            </span>
                            
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => setEditingMemory(mem)}
                                className="p-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-cyan-500 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteMemory(mem.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: STATS / PROFILE */}
          {activeTab === "stats" && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-6">
              
              <div>
                <h2 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                  <span>Robotic Analytics & Settings</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Track statistics and system performance markers.
                </p>
              </div>

              {/* TIME GREETINGS CALLOUT */}
              <div className="glass-card rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-violet-600/10 to-cyan-500/10 border border-violet-500/20">
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:space-x-4 gap-4 text-center sm:text-left">
                  <span className="text-4xl">☀️</span>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {user.name}'s Daily Greeting
                    </h3>
                    <p className="text-xs italic text-violet-400 mt-1">
                      "{dailyGreeting}"
                    </p>
                  </div>
                </div>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-violet-500 flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 text-lg shrink-0">
                    💬
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Messages</span>
                    <span className="font-display font-extrabold text-xl text-slate-800 dark:text-slate-100">
                      {stats?.totalMessages ?? 0}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-cyan-500 flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 text-lg shrink-0">
                    🧠
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Saved Memories</span>
                    <span className="font-display font-extrabold text-xl text-slate-800 dark:text-slate-100">
                      {stats?.totalMemories ?? 0}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-lg shrink-0">
                    ⚡
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Chats Today</span>
                    <span className="font-display font-extrabold text-xl text-slate-800 dark:text-slate-100">
                      {stats?.chatsToday ?? 0}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500 flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-lg shrink-0">
                    ❤️
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Friendship Index</span>
                    <span className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 truncate block max-w-[140px]">
                      {stats?.friendshipLevel ?? "New Acquaintance 🤖"}
                    </span>
                  </div>
                </div>

              </div>

              {/* LIST OF LEARNED CONCEPTS */}
              <div className="glass-card p-6 rounded-3xl space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                  Topics Tracked in Database Memory Channels
                </h3>

                {stats?.storedKeys && stats.storedKeys.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {stats.storedKeys.map((key, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 text-xs font-bold text-slate-600 dark:text-slate-300"
                      >
                        🧬 {key}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    (No topics indexed yet. Tell me what food, hobby, or color you like!)
                  </p>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: COMPANION SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-6">
              
              <div>
                <h2 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                  <span>Companion Controls</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust voice pitch, speaking rate, robot name, and dashboard layouts.
                </p>
              </div>

              <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* ROBOT NAME SETTING */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                      Robot Companion Name
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tempRobotName}
                        onChange={(e) => setTempRobotName(e.target.value)}
                        placeholder="Cutie Robo"
                        className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-800 dark:text-slate-100"
                      />
                      <button
                        onClick={saveRobotNameSetting}
                        disabled={!tempRobotName.trim() || tempRobotName === robotSettings.name}
                        className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Sync</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-normal">
                      Changes the robot's identity across chat system prompts and memory banks.
                    </span>
                  </div>

                  {/* PERSONALITY MODE */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                      Personality Mode Configuration
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Cute", "Friendly", "Professional"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updateRobotSetting("personality", mode)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            robotSettings.personality === mode
                              ? "bg-gradient-to-br from-violet-600 to-cyan-500 text-white border-transparent shadow-md"
                              : "border-slate-200/10 text-slate-400 bg-slate-100/30 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-normal">
                      Adjusts AI response styles (Cheerful/Playful vs. Structured assistant).
                    </span>
                  </div>

                </div>

                {/* VOICE SLIDERS */}
                <div className="border-t border-slate-200/10 pt-6 space-y-6">
                  <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                    Audio Pitch & Synthesis Modulators
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Voice Speed */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Voice Speed (Rate)</label>
                        <span className="font-bold text-violet-400">{robotSettings.voiceSpeed}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={robotSettings.voiceSpeed}
                        onChange={(e) => updateRobotSetting("voiceSpeed", parseFloat(e.target.value))}
                        className="w-full accent-violet-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 block leading-normal">
                        Control how quickly {robotSettings.name} reads out responses.
                      </span>
                    </div>

                    {/* Voice Pitch */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Voice Pitch</label>
                        <span className="font-bold text-cyan-400">{robotSettings.voicePitch}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={robotSettings.voicePitch}
                        onChange={(e) => updateRobotSetting("voicePitch", parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 block leading-normal">
                        Shift frequency (lower makes it sound deeper, higher sounds cute and sweet).
                      </span>
                    </div>

                    {/* Voice Pack Selection */}
                    <div className="space-y-2 col-span-1 md:col-span-2 border-t border-slate-200/10 pt-6">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                        Voice Pack Selection
                      </label>
                      <select
                        value={selectedVoiceName}
                        onChange={(e) => {
                          setSelectedVoiceName(e.target.value);
                          localStorage.setItem("cutierobo_voice_name", e.target.value);
                          speakText("Hi there! I am your new voice pack! Do I sound cute? ✨", e.target.value);
                        }}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-800 dark:text-slate-100 text-sm font-medium transition-all"
                      >
                        {[
                          { name: "Alloy (Neutral)", value: "alloy" },
                          { name: "Echo (Warm Male)", value: "echo" },
                          { name: "Fable (Playful)", value: "fable" },
                          { name: "Onyx (Deep Male)", value: "onyx" },
                          { name: "Nova (Energetic Female)", value: "nova" },
                          { name: "Shimmer (Professional Female)", value: "shimmer" }
                        ].map((voice, idx) => (
                          <option key={idx} value={voice.value}>
                            {voice.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500 block leading-normal">
                        Select from high-quality speech engine voice packs installed in your browser. Selecting a voice pack will trigger a quick preview greeting!
                      </span>
                    </div>

                  </div>
                </div>

                {/* CADENCE CONTROL */}
                <div className="border-t border-slate-200/10 pt-6 space-y-3">
                  <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                    Voice Cadence & Rhythm
                  </h3>
                  
                  <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Rhythmic Cadence Flow</span>
                      <span className="text-[10px] text-slate-500">Enable natural punctuation pauses and breath gaps for an organic robotic voice flow.</span>
                    </div>

                    <button
                      onClick={() => updateRobotSetting("rhythmicVoice", !robotSettings.rhythmicVoice)}
                      className={`w-12 h-6.5 rounded-full p-0.5 transition-all duration-300 ${
                        robotSettings.rhythmicVoice ? "bg-violet-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                          robotSettings.rhythmicVoice ? "translate-x-5.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* THEME CONTROL */}
                <div className="border-t border-slate-200/10 pt-6 space-y-3">
                  <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                    Layout Theme Control
                  </h3>
                  
                  <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Dark Mode</span>
                      <span className="text-[10px] text-slate-500">Enable premium glow-gradient dark theme styles.</span>
                    </div>

                    <button
                      onClick={() => updateRobotSetting("darkMode", !robotSettings.darkMode)}
                      className={`w-12 h-6.5 rounded-full p-0.5 transition-all duration-300 ${
                        robotSettings.darkMode ? "bg-violet-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                          robotSettings.darkMode ? "translate-x-5.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
