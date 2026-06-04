import { NextResponse } from "next/server";
import { checkSecurity, handleError } from "@/lib/security";
import { transcribeAudio } from "@/lib/gemini";

export async function POST(request: Request) {
  // 1. Security Check
  const security = checkSecurity(request, true);
  if (!security.allowed) {
    return security.response!;
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let file: File | null = null;
    let mockText: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      file = formData.get("file") as File;
      mockText = formData.get("mockText") as string;
    } else {
      // Fallback to binary stream or octet-stream
      const blob = await request.blob();
      file = new File([blob], "audio.wav", { type: "audio/wav" });
    }

    // 2. If Gemini key is set, transcribe using Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== "" && file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "audio/wav";

      const transcribedText = await transcribeAudio(buffer, mimeType);

      return NextResponse.json({
        text: transcribedText,
      });
    }

    // 3. Fallback mock transcription for local offline development
    const text = mockText || "Hello robot";
    return NextResponse.json({ text });

  } catch (error) {
    return handleError(error, "POST stt error");
  }
}

