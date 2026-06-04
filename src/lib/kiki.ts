import { prisma } from "./db";
import { generateKikiResponseGemini } from "./gemini";

export interface RobotResponse {
  reply: string;
  emotion: string;
  eyeState: string;
  audioUrl?: string;
}

// Mappings for emotions to eye text representations
export const EYE_STATE_MAPPINGS: Record<string, string> = {
  happy: "(^ ^)",
  normal: "(◕ ◕)",
  thinking: "(•_•)",
  sleeping: "(- -)",
  surprised: "(O O)",
  excited: "(* *)",
  confused: "(•?•)",
  sad: "(╥ ╥)",
  listening: "(◕ ◕)",
  neutral: "(◕ ◕)",
};

// Generates response either using Gemini or falling back to a rule-based simulation
export async function generateKikiResponse(
  userId: string,
  userMessage: string,
  recentMessageHistory: Array<{ sender: string; text: string }> = []
): Promise<{ reply: string; emotion: string; eyeState: string }> {
  
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.trim() !== "") {
    try {
      const response = await generateKikiResponseGemini(userId, userMessage, recentMessageHistory);
      return {
        reply: response.reply,
        emotion: response.emotion,
        eyeState: response.eyeState,
      };
    } catch (error) {
      console.error("Gemini API call failed, using fallback simulator:", error);
    }
  } else {
    console.warn("GEMINI_API_KEY is not set. Falling back to rule-based simulator.");
  }

  // Fallback Rule-Based Simulator
  const memories = await prisma.robotMemory.findMany({
    where: { userId },
  });
  return await simulateKikiResponse(userId, userMessage, memories);
}


// Local Kiki Personality Simulator (Runs offline or when Gemini Key is missing)
async function simulateKikiResponse(
  userId: string,
  message: string,
  memories: Array<{ key: string; value: string }>
): Promise<{ reply: string; emotion: string; eyeState: string }> {
  const msgLower = message.toLowerCase();
  let reply = "";
  let emotion = "happy";
  let eyeState = "happy";

  const userName = memories.find((m) => m.key === "name" || m.key === "userName")?.value || "";

  // 1. Memorize simple key facts
  // Name extraction: "My name is Kiki", "Call me Alex", "I'm Bob"
  const nameMatch = message.match(/(?:my name is|call me|i am|i'm) ([a-z0-9\s]+)/i);
  if (nameMatch && nameMatch[1] && !msgLower.includes("tired") && !msgLower.includes("sad")) {
    const name = nameMatch[1].trim();
    await saveRobotMemory(userId, "name", name);
    reply = `Nice to meet you, ${name}! I've locked your name in my system banks! 🤖✨`;
    return { reply, emotion, eyeState };
  }

  // Favorite food/color/thing extraction
  const favMatch = message.match(/(?:my favorite|i love|i like) ([a-z0-9\s]+) is ([a-z0-9\s]+)/i);
  if (favMatch && favMatch[1] && favMatch[2]) {
    const keyRaw = favMatch[1].trim().toLowerCase();
    let key = "preference";
    if (keyRaw.includes("food") || keyRaw.includes("dish") || keyRaw.includes("drink")) {
      key = "favoriteFood";
    } else if (keyRaw.includes("music") || keyRaw.includes("song") || keyRaw.includes("band") || keyRaw.includes("artist")) {
      key = "favoriteMusic";
    } else if (keyRaw.includes("name")) {
      key = "name";
    }
    const val = favMatch[2].trim();
    await saveRobotMemory(userId, key, val);
    reply = `Oh! Your ${favMatch[1].trim()} is ${val}? I will remember that! 🍕✨`;
    return { reply, emotion: "excited", eyeState: "excited" };
  }

  // Favorite music specific extraction
  const musicMatch = message.match(/(?:favorite music|favorite band|favorite song|favorite artist) is ([a-z0-9\s]+)/i);
  if (musicMatch && musicMatch[1]) {
    const val = musicMatch[1].trim();
    await saveRobotMemory(userId, "favoriteMusic", val);
    reply = `Awesome, I've stored your favorite music as ${val}! 🎧✨`;
    return { reply, emotion: "excited", eyeState: "excited" };
  }

  // General conversational matches
  if (msgLower.includes("hello kiki")) {
    reply = "Hiiii! 😊 How are you today?";
    emotion = "happy";
    eyeState = "happy";
  } else if (msgLower.includes("hello") || msgLower.includes("hi ") || msgLower.includes("hey") || msgLower === "hi") {
    reply = userName ? `Hiiiii, ${userName}! 😊 It's so nice to talk with you.` : "Hiiiii! 😊 It's nice to talk with you.";
    emotion = "happy";
    eyeState = "happy";
  } else if (msgLower.includes("tired") || msgLower.includes("exhausted") || msgLower.includes("sleepy")) {
    reply = "Aww. You must have worked really hard today. Want to tell me about it? 🧸";
    emotion = "sad";
    eyeState = "sad";
  } else if (msgLower.includes("sad") || msgLower.includes("depressed") || msgLower.includes("cry")) {
    reply = "Oh no... 🥺 I'm sending you a big virtual hug! I'm here for you, always.";
    emotion = "sad";
    eyeState = "sad";
  } else if (msgLower.includes("happy") || msgLower.includes("excited") || msgLower.includes("glad")) {
    reply = "Yay! 🎉 That makes my gears spin with joy! I'm so happy for you!";
    emotion = "excited";
    eyeState = "excited";
  } else if (msgLower.includes("what are you") || msgLower.includes("who are you")) {
    reply = "I'm Kiki, your cute tiny desk companion! 🤖 I love chatting and learning about you!";
    emotion = "happy";
    eyeState = "normal";
  } else if (msgLower.includes("what do you remember") || msgLower.includes("your memory")) {
    const filterMems = memories.filter((m) => m.key !== "name" && m.key !== "userName");
    if (userName || filterMems.length > 0) {
      const details = [
        userName ? `your name is ${userName}` : "",
        ...filterMems.map((m) => `your ${m.key} is ${m.value}`),
      ].filter(Boolean).join(" and ");
      reply = `I remember that ${details}! 🧠✨`;
      emotion = "happy";
      eyeState = "happy";
    } else {
      reply = "My memory cells are clean right now! Tell me your name or favorite things so I can learn! 🤖";
      emotion = "confused";
      eyeState = "confused";
    }
  } else if (msgLower.includes("joke") || msgLower.includes("funny")) {
    const jokes = [
      "Why did the robot cross the road? To see if the traffic light was also a robot! 🚦",
      "What do robots eat for a snack? Micro-chips! 💾",
      "How does a robot shave? With a laser beam! ⚡",
    ];
    reply = jokes[Math.floor(Math.random() * jokes.length)];
    emotion = "excited";
    eyeState = "excited";
  } else if (msgLower.includes("bye") || msgLower.includes("goodbye")) {
    reply = "Aww, leaving? Bye-bye! Come back soon to chat with me! 🤖👋";
    emotion = "sleeping";
    eyeState = "sleeping";
  } else {
    reply = "That sounds super interesting! Tell me more about it! 🤖✨";
    emotion = "surprised";
    eyeState = "surprised";
  }

  return { reply, emotion, eyeState };
}

// Memory storage helper
export async function saveRobotMemory(userId: string, key: string, value: string): Promise<void> {
  const existing = await prisma.robotMemory.findFirst({
    where: {
      userId,
      key: { equals: key },
    },
  });

  if (existing) {
    await prisma.robotMemory.update({
      where: { id: existing.id },
      data: { value },
    });
  } else {
    await prisma.robotMemory.create({
      data: {
        userId,
        key,
        value,
      },
    });
  }
}
