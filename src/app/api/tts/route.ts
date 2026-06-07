import { NextResponse } from "next/server";
import { checkSecurity, validateRequestBody, handleError } from "@/lib/security";
import fs from "fs";
import path from "path";

interface TtsRequestBody {
  text: string;
  voice?: string;
  speed?: number | string;
}

// A base64 representation of a tiny valid 1-second silent MP3
const TINY_SILENT_MP3_BASE64 = 
  "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8" +
  "AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6ur" +
  "q6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hv" +
  "AAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAERTMu//MUZAYAAAGk" +
  "AAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV";

export async function POST(request: Request) {
  // 1. Security Check
  const security = checkSecurity(request, true);
  if (!security.allowed) {
    return security.response!;
  }

  try {
    // 2. Validate request body
    const validation = await validateRequestBody<TtsRequestBody>(request, ["text"]);
    if (validation.errorResponse) {
      return validation.errorResponse;
    }

        const { text, voice, speed } = validation.data!;
    
    // Map frontend OpenAI voice names to valid Google Translate language codes
    const voiceMap: Record<string, string> = {
      alloy: "en-us",
      echo: "en-gb",
      fable: "en-au",
      onyx: "en-in",
      nova: "en-us",
      shimmer: "en-gb",
    };

    let languageCode = "en-us";
    if (voice) {
      const vLower = voice.toLowerCase();
      if (voiceMap[vLower]) {
        languageCode = voiceMap[vLower];
      } else if (/^[a-z]{2}(-[a-z]{2,4})?$/i.test(vLower)) {
        languageCode = vLower;
      } else {
        languageCode = process.env.TTS_LANGUAGE || "en-us";
      }
    } else {
      languageCode = process.env.TTS_LANGUAGE || "en-us";
    }

    const ttsSpeed = speed !== undefined ? String(speed) : process.env.TTS_SPEED || "1";

    // Ensure public/audio directory exists
    const audioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";

    try {
      // Use free high-quality Google TTS translation stream with dynamic parameters
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(languageCode)}&client=tw-ob&ttsspeed=${encodeURIComponent(ttsSpeed)}`;
      const ttsResponse = await fetch(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      if (!ttsResponse.ok) {
        throw new Error(`Google TTS failed with status ${ttsResponse.status}`);
      }

      const buffer = Buffer.from(await ttsResponse.arrayBuffer());
      const fileName = `tts-${crypto.randomUUID()}.mp3`;
      const filePath = path.join(audioDir, fileName);

      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        audioUrl: `${protocol}://${host}/audio/${fileName}`,
      });
    } catch (ttsErr) {
      console.error("Failed to generate Google TTS, falling back to mock:", ttsErr);
    }

    // Fallback: Ensure a mock audio file exists and return it
    const mockFilePath = path.join(audioDir, "mock.mp3");
    if (!fs.existsSync(mockFilePath) || fs.statSync(mockFilePath).size < 300) {
      const audioBuffer = Buffer.from(TINY_SILENT_MP3_BASE64, "base64");
      fs.writeFileSync(mockFilePath, audioBuffer);
    }

    return NextResponse.json({
      audioUrl: `${protocol}://${host}/audio/mock.mp3`,
      isMock: true
    });

  } catch (error) {
    return handleError(error, "POST tts error");
  }
}

