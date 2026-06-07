import { NextResponse } from "next/server";
import { checkSecurity, validateRequestBody, handleError } from "@/lib/security";
import { generateKikiResponse } from "@/lib/kiki";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

interface RobotMessageRequest {
  robotId: string;
  message: string;
  voice?: string;
  speed?: number | string;
}

const TINY_SILENT_MP3_BASE64 = 
  "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8" +
  "AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6ur" +
  "q6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hv" +
  "AAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAERTMu//MUZAYAAAGk" +
  "AAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV";

export async function POST(request: Request) {
  // Enforce API Key authentication
  const security = checkSecurity(request, true);
  if (!security.allowed) {
    return security.response!;
  }

  try {
    // Validate robotId and message
    const validation = await validateRequestBody<RobotMessageRequest>(request, ["robotId", "message"]);
    if (validation.errorResponse) {
      return validation.errorResponse;
    }

    const { message, voice, speed } = validation.data!;
    const languageCode = voice || process.env.TTS_LANGUAGE || "en-us";
    const ttsSpeed = speed !== undefined ? String(speed) : process.env.TTS_SPEED || "1";
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Failed to load/initialize user profile." }, { status: 500 });
    }
    const userId = user.id;

    let conversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: "Robot Companion Session",
        },
      });
    }

    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { timestamp: "desc" },
      take: 5,
    });
    const history = recentMessages
      .reverse()
      .map((m) => ({ sender: m.sender, text: m.text }));

    const kikiResult = await generateKikiResponse(userId, message, history);

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "user",
        text: message,
      },
    });

    const audioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    let audioFileName = "mock.mp3";

    try {
      // Use free high-quality Google Translate TTS API with dynamic parameters
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(kikiResult.reply)}&tl=${encodeURIComponent(languageCode)}&client=tw-ob&ttsspeed=${encodeURIComponent(ttsSpeed)}`;
      const ttsResponse = await fetch(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      if (ttsResponse.ok) {
        const buffer = Buffer.from(await ttsResponse.arrayBuffer());
        audioFileName = `tts-${crypto.randomUUID()}.mp3`;
        const filePath = path.join(audioDir, audioFileName);
        fs.writeFileSync(filePath, buffer);
      } else {
        throw new Error(`Google TTS failed with status ${ttsResponse.status}`);
      }
    } catch (ttsErr) {
      console.error("Failed to generate TTS for robot endpoint, falling back to mock:", ttsErr);
      const mockFilePath = path.join(audioDir, "mock.mp3");
      if (!fs.existsSync(mockFilePath) || fs.statSync(mockFilePath).size < 300) {
        const audioBuffer = Buffer.from(TINY_SILENT_MP3_BASE64, "base64");
        fs.writeFileSync(mockFilePath, audioBuffer);
      }
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "robot",
        text: kikiResult.reply,
        emotion: kikiResult.emotion,
        eyeState: kikiResult.eyeState,
        audioUrl: `/audio/${audioFileName}`,
      },
    });

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const audioUrl = `${protocol}://${host}/audio/${audioFileName}`;

    return NextResponse.json({
      reply: kikiResult.reply,
      emotion: kikiResult.emotion,
      eyeState: kikiResult.eyeState,
      audioUrl: audioUrl,
      isMock: audioFileName === "mock.mp3",
    });

  } catch (error) {
    return handleError(error, "POST robot message error");
  }
}

