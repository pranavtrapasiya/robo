import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json({
      status: "error",
      message: "GEMINI_API_KEY environment variable is not configured or is empty in your .env file.",
      keyConfigured: false,
    }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const startTime = Date.now();
    const result = await model.generateContent("Say 'Gemini API connection successful!'");
    const responseText = result.response.text().trim();
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to Gemini API!",
      keyConfigured: true,
      durationMs,
      geminiResponse: responseText,
    });
  } catch (error: any) {
    console.error("Gemini API Diagnostics error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to connect to Gemini API. Check your internet connection and API key permissions.",
      errorDetails: error.message || String(error),
      keyConfigured: true,
    }, { status: 500 });
  }
}
