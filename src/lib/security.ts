import { NextResponse } from "next/server";

// Rate limiting in-memory store
const ipCache = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

export interface SecurityCheckResult {
  allowed: boolean;
  response?: NextResponse;
}

// Security Check helper for all Next.js API Routes
export function checkSecurity(request: Request, checkApiKey: boolean = true): SecurityCheckResult {
  // 1. Rate Limiting Check
  const ip = request.headers.get("x-forwarded-for") || "local-ip";
  const now = Date.now();
  
  if (!ipCache.has(ip)) {
    ipCache.set(ip, []);
  }
  
  const timestamps = ipCache.get(ip)!;
  const activeTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      ),
    };
  }
  
  activeTimestamps.push(now);
  ipCache.set(ip, activeTimestamps);

  // 2. API Key Protection
  if (checkApiKey) {
    const expectedApiKey = process.env.ROBOT_API_KEY || "kiki-key-2026";
    
    // Check header or query parameter
    const headerKey = request.headers.get("x-api-key");
    const url = new URL(request.url);
    const queryKey = url.searchParams.get("apiKey");
    
    if (headerKey !== expectedApiKey && queryKey !== expectedApiKey) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Unauthorized. Missing or invalid API key." },
          { status: 401 }
        ),
      };
    }
  }

  return { allowed: true };
}

// Request validation helper
export async function validateRequestBody<T>(
  request: Request,
  requiredFields: string[]
): Promise<{ data?: T; errorResponse?: NextResponse }> {
  try {
    const data = await request.json();
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || String(data[field]).trim() === "") {
        return {
          errorResponse: NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          ),
        };
      }
    }
    return { data };
  } catch (e) {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid JSON body format" },
        { status: 400 }
      ),
    };
  }
}

// Standard error formatting response wrapper
export function handleError(error: any, contextMessage: string): NextResponse {
  console.error(`${contextMessage}:`, error);
  return NextResponse.json(
    { error: "An internal server error occurred.", details: error.message || String(error) },
    { status: 500 }
  );
}
