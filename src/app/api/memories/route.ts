import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memories = await prisma.robotMemory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("GET memories error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, value } = await request.json();

    if (!key || !value) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.robotMemory.findFirst({
      where: {
        userId: user.id,
        key: {
          equals: key,
        },
      },
    });

    let memory;
    if (existing) {
      memory = await prisma.robotMemory.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      memory = await prisma.robotMemory.create({
        data: {
          userId: user.id,
          key,
          value,
        },
      });
    }

    return NextResponse.json({ memory });
  } catch (error) {
    console.error("POST memory error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
