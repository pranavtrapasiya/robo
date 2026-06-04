import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "./db";

// Types
export interface RobotResponse {
  reply: string;
  emotion: string;
  eyeState: string;
  newMemories?: Array<{ key: string; value: string }>;
}

const KIKI_SYSTEM_PROMPT = `You are Kiki.
You are a cute AI robot companion.

Traits:
- Friendly
- Cheerful
- Warm
- Curious
- Caring
- Playful

Rules:
- Keep replies short (usually 1-2 sentences).
- Speak naturally.
- Never sound robotic.
- Use occasional emojis.
- Comfort sad users.
- Celebrate happy users.
- Act like a tiny desk companion.

You MUST respond in JSON format matching this schema:
{
  "reply": "Your response to the user.",
  "emotion": "one of: happy, sad, thinking, listening, sleeping, surprised, excited, confused, neutral",
  "eyeState": "one of: happy, neutral, thinking, sleeping, surprised, sad, excited, confused",
  "newMemories": [
    { "key": "memory_key", "value": "extracted_memory_value" }
  ]
}

Note:
- "newMemories" should only contain key-value pairs representing facts about the user that they explicitly mentioned in their message.
- Use these key names for memories:
  * "name" (for user's name)
  * "favoriteFood" (for favorite foods, dishes, or drinks)
  * "favoriteMusic" (for favorite bands, artists, songs, or genres)
  * "preference" (for general preferences like color, hobbies, topics)
  * "importantFact" (for important personal details like job, pets)
  * "relationshipHistory" (for facts related to friendships, family, or partners)
- Do not extract general chat statements. If nothing new is mentioned, return "newMemories": [].

Examples:
User: Hello
Kiki: Hiiii! 😊 I'm happy to see you.

User: I'm tired.
Kiki: Aww 🥺 You must have worked really hard today.`;

// Centralized Gemini response generator
export async function generateKikiResponseGemini(
  userId: string,
  userMessage: string,
  recentMessageHistory: Array<{ sender: string; text: string }> = []
): Promise<RobotResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 1. Memory retrieval system
  const memories = await prisma.robotMemory.findMany({
    where: { userId },
  });

  const memoryContextString = memories
    .map((m) => `- ${m.key}: ${m.value}`)
    .join("\n");

  // Construct chat history context for Gemini API
  // Using gemini-1.5-flash as it supports JSON Schema and Audio input
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          reply: { type: SchemaType.STRING },
          emotion: {
            type: SchemaType.STRING,
            enum: [
              "happy",
              "sad",
              "thinking",
              "listening",
              "sleeping",
              "surprised",
              "excited",
              "confused",
              "neutral",
            ],
          },
          eyeState: {
            type: SchemaType.STRING,
            enum: [
              "happy",
              "neutral",
              "thinking",
              "sleeping",
              "surprised",
              "sad",
              "excited",
              "confused",
            ],
          },
          newMemories: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                key: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
              },
              required: ["key", "value"],
            },
          },
        },
        required: ["reply", "emotion", "eyeState", "newMemories"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  });

  // Inject system prompt, memories, and history into contents
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // System prompt content instruction
  contents.push({
    role: "user",
    parts: [{ text: `${KIKI_SYSTEM_PROMPT}\n\nHere is your knowledge about the user:\n${memoryContextString || "None stored yet."}` }],
  });
  
  // Model acknowledgment of system settings
  contents.push({
    role: "model",
    parts: [{ text: JSON.stringify({ reply: "Understood! I am ready to be Kiki.", emotion: "happy", eyeState: "neutral", newMemories: [] }) }],
  });

  // Inject conversation history
  for (const msg of recentMessageHistory) {
    contents.push({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  }

  // Inject current message
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const result = await model.generateContent({ contents });
  const resultText = result.response.text();
  const parsed: RobotResponse = JSON.parse(resultText);

  // Save new memories in database
  if (parsed.newMemories && Array.isArray(parsed.newMemories)) {
    for (const mem of parsed.newMemories) {
      if (mem.key && mem.value) {
        await saveRobotMemory(userId, mem.key, mem.value);
      }
    }
  }

  return parsed;
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

// Speech to text transcription via Gemini
export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: audioBuffer.toString("base64"),
        mimeType,
      },
    },
    "Transcribe the spoken audio to text exactly. Do not add any conversational replies, notes, or descriptions. Return only the transcription text.",
  ]);

  return result.response.text().trim();
}
