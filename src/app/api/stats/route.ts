import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch conversation count
    const conversationCount = await prisma.conversation.count({
      where: { userId: user.id },
    });

    // Fetch message count
    const totalMessages = await prisma.message.count({
      where: { conversation: { userId: user.id } },
    });

    // Fetch memory count
    const memoryCount = await prisma.robotMemory.count({
      where: { userId: user.id },
    });

    // Fetch active companion settings
    const robotNameMemory = await prisma.robotMemory.findFirst({
      where: { userId: user.id, key: "robotName" },
    });
    const personalityMemory = await prisma.robotMemory.findFirst({
      where: { userId: user.id, key: "personality" },
    });

    const robotName = robotNameMemory?.value || "Cutie Robo";
    const personality = personalityMemory?.value || "Cute";

    // Count messages today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const chatsToday = await prisma.message.count({
      where: {
        conversation: { userId: user.id },
        timestamp: {
          gte: startOfToday,
        },
      },
    });

    // Get unique memory keys
    const rawMemories = await prisma.robotMemory.findMany({
      where: { userId: user.id },
      select: { key: true },
      take: 10,
    });
    const keys = Array.from(new Set(rawMemories.map((m) => m.key))).filter(
      (k) => k !== "robotName" && k !== "personality"
    );

    // Calculate a simple friendship level based on message count!
    let friendshipLevel = "New Acquaintance 🤖";
    if (totalMessages > 50) friendshipLevel = "Best Friends Forever! 💖🌟";
    else if (totalMessages > 20) friendshipLevel = "Close Companions 🥰";
    else if (totalMessages > 5) friendshipLevel = "Friendly Chat Buddies 😊";

    return NextResponse.json({
      totalMessages: totalMessages,
      totalMemories: memoryCount - 2 > 0 ? memoryCount - 2 : 0, // exclude robotName & personality
      chatsToday,
      robotName,
      personality,
      friendshipLevel,
      storedKeys: keys,
    });
  } catch (error) {
    console.error("GET stats error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
