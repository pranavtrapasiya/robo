import { NextResponse } from "next/server";
import { checkSecurity, validateRequestBody, handleError } from "@/lib/security";
import { prisma } from "@/lib/db";
import { saveRobotMemory } from "@/lib/kiki";
import { getCurrentUser } from "@/lib/auth";

interface MemoryRequestBody {
  key: string;
  value: string;
}

export async function POST(request: Request) {
  const security = checkSecurity(request, false);
  if (!security.allowed) {
    return security.response!;
  }

  try {
    const validation = await validateRequestBody<MemoryRequestBody>(request, ["key", "value"]);
    if (validation.errorResponse) {
      return validation.errorResponse;
    }

    const { key, value } = validation.data!;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Failed to load/initialize user profile." }, { status: 500 });
    }
    const userId = user.id;

    await saveRobotMemory(userId, key.trim(), value.trim());

    return NextResponse.json({
      success: true,
      message: `Memory stored: ${key} = ${value}`,
    });

  } catch (error) {
    return handleError(error, "POST memory error");
  }
}

export async function GET(request: Request) {
  const security = checkSecurity(request, false);
  if (!security.allowed) {
    return security.response!;
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Failed to load/initialize user profile." }, { status: 500 });
    }
    const userId = user.id;

    const memories = await prisma.robotMemory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ memories });

  } catch (error) {
    return handleError(error, "GET memory error");
  }
}
