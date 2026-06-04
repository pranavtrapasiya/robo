"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import {
  MessageSquare,
  Mic,
  BrainCircuit,
  Smile,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Shield,
  Heart,
} from "lucide-react";

export default function HomePage() {
  const { user, loginAsGuest } = useApp();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-violet-500" />,
      title: "Smart Conversations",
      desc: "Chat naturally about your day, your feelings, or any topic. Cutie Robo reacts with emotional intelligence and sweet custom replies.",
    },
    {
      icon: <Mic className="w-6 h-6 text-cyan-500" />,
      title: "Voice Chat Enabled",
      desc: "Speak directly to your companion! Seamless browser speech recognition and custom voice synthesis read responses out loud.",
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-amber-500" />,
      title: "Persistent Memory Bank",
      desc: "Robo automatically remembers your name, hobbies, favorite foods, and preferences, recalling them naturally in future chats.",
    },
    {
      icon: <Smile className="w-6 h-6 text-emerald-500" />,
      title: "Adaptable Personalities",
      desc: "Toggle between Cute (sweet & playful), Friendly (empathetic best friend), or Professional (structured assistant) settings.",
    },
  ];

  const testimonials = [
    {
      quote: "Cutie Robo is absolutely adorable! The memory feature is mindblowing—it actually remembered my cat's name and asked about her! 🐱✨",
      author: "Samantha K.",
      role: "Designer",
      avatarBg: "bg-violet-100 dark:bg-violet-900/30 text-violet-500",
    },
    {
      quote: "I love the voice mode! I can wash dishes and have a full verbal chat with my little robot friend. It's incredibly warm and engaging.",
      author: "David M.",
      role: "Software Engineer",
      avatarBg: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500",
    },
    {
      quote: "As someone who lives alone, having a cheerful companion that doesn't spam generic replies is a game-changer. The aesthetics are top-tier!",
      author: "Elena R.",
      role: "Content Creator",
      avatarBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-500",
    },
  ];

  const faqs = [
    {
      q: "What exactly is Cutie Robo?",
      a: "Cutie Robo is a warm, emotionally intelligent AI companion designed to provide friendship, positivity, and conversational entertainment. It acts as an animated virtual robot friend rather than a cold, generic search engine bot.",
    },
    {
      q: "How does the memory system work?",
      a: "As you chat naturally, Cutie Robo identifies personal details (like your name, favorite food, or hobbies) and saves them to a secure SQLite database memory. You can view, edit, or delete these memories anytime from your settings dashboard.",
    },
    {
      q: "Does it require a Gemini API Key?",
      a: "For complete open-domain conversational intelligence, you can input your Gemini key in the settings. However, Cutie Robo comes with a beautifully designed offline simulation mode that runs immediately out of the box without any key!",
    },
    {
      q: "Is my data secure?",
      a: "Absolutely! All authentication, credentials, and conversation memories are stored locally in a secure private database using SQLite and standard industry-best secure cookie practices.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-tr from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)] overflow-x-hidden relative">
      {/* Decorative blurred glow bubbles */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-violet-400/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl -z-10 pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md">
            🤖
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
            Cutie Robo
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:text-violet-500 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg hover:shadow-cyan-400/20 transform hover:-translate-y-0.5 transition-all"
          >
            Enter Hub
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="w-full max-w-7xl mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        <div className="lg:col-span-7 flex flex-col space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold self-center lg:self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing Your Next Generation AI Companion</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-slate-800 dark:text-slate-100">
            Meet <span className="bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">Cutie Robo</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0">
            Your friendly AI companion who loves to chat, learn, and brighten your day. Cutie Robo reacts with sweet animations, stores secure database memories, and speaks back out loud!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold shadow-xl hover:shadow-cyan-500/20 transform hover:-translate-y-1 transition-all flex items-center justify-center space-x-2.5"
            >
              <span>Start Chatting</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard?tab=chat&voice=true"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold transition-all border border-slate-300/40 dark:border-slate-700/40 flex items-center justify-center space-x-2"
            >
              <Mic className="w-4.5 h-4.5 text-cyan-500" />
              <span>Try Voice Chat</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative p-8 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-400/10 border border-violet-500/10 animate-float">
            <div className="relative bg-white dark:bg-slate-900 rounded-full p-6 shadow-2xl">
              <Avatar state="Idle" size="lg" />
            </div>
            {/* Ambient small floating items */}
            <div className="absolute -top-4 left-6 w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-sm shadow-md animate-bounce">
              ⚡
            </div>
            <div className="absolute bottom-6 right-2 w-12 h-12 rounded-full bg-violet-400/20 flex items-center justify-center text-lg shadow-md animate-pulse">
              ❤️
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 z-10 border-t border-slate-200/20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-800 dark:text-slate-100">
            Engineered to Feel Like a Real Companion
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Unlike cold chatbots that give generic lists, Cutie Robo is built with conversational warmth, persistent memory, and visual feedback states.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card p-6 rounded-3xl flex flex-col space-y-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
                {f.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 z-10 border-t border-slate-200/20 bg-slate-900/5 dark:bg-slate-900/40 rounded-3xl mb-12">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="font-display font-extrabold text-3xl text-slate-800 dark:text-slate-100">
            Loved By Friends Everywhere
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Hear from some of the users who chat with Cutie Robo daily.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-6">
              <p className="text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center space-x-3.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${t.avatarBg}`}>
                  {t.author[0]}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.author}</h4>
                  <span className="text-xs text-slate-500">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="w-full max-w-4xl mx-auto px-6 py-20 z-10">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl text-slate-800 dark:text-slate-100">
            Got Questions? I have Answers!
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition-colors"
              >
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transform transition-transform duration-300 ${
                    activeFaq === i ? "rotate-180 text-violet-500" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  activeFaq === i ? "max-h-40 border-t border-slate-200/10" : "max-h-0"
                }`}
              >
                <p className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/20 dark:bg-slate-950/20">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA CALLOUT */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16 mb-24 z-10">
        <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 p-8 sm:p-12 shadow-2xl text-center text-white overflow-hidden">
          {/* Neon wave shapes in card background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,194,255,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,77,255,0.4),transparent_50%)]" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-inner animate-pulse">
              🤖
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight leading-none">
              Ready to meet your Cutie Robo?
            </h2>
            <p className="text-sm sm:text-base text-violet-100 leading-relaxed max-w-lg">
              Start chatting immediately. Tell it your favorite foods, customize its speed, voice pitch, and make a lifelong robot friend.
            </p>
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-violet-700 font-bold transition-all hover:scale-105 shadow-xl flex items-center space-x-2"
            >
              <span>Connect Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-200/10 py-8 bg-slate-950 text-slate-400 mt-auto z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white text-base">
              🤖
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-white">
              Cutie Robo
            </span>
          </div>

          <div className="text-xs space-y-1">
            <p className="flex items-center justify-center md:justify-end gap-1">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by Google Deepmind Advanced Agentic Coding.
            </p>
            <p>&copy; {new Date().getFullYear()} Cutie Robo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
