import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cutie Robo | Your Cute, Friendly AI Companion 🤖✨",
  description: "Meet Cutie Robo! A warm, supportive, and emotionally intelligent AI companion with local database memory, browser voice speech integration, and beautiful animated robot reactions.",
  keywords: ["AI companion", "virtual assistant", "cute robot", "speech recognition AI", "robotic voice chat", "Cutie Robo"],
  authors: [{ name: "Google Deepmind Team" }],
  openGraph: {
    title: "Cutie Robo - Meet Your Animated AI Robot Friend",
    description: "An adorable, intelligent virtual robot companion that talks, listens, and remembers what you share.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#7C4DFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-violet-500 selection:text-white">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
