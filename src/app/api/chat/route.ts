import { NextResponse } from "next/server";
import { checkSecurity, validateRequestBody, handleError } from "@/lib/security";
import { generateKikiResponse } from "@/lib/kiki";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface ChatRequestBody {
  message: string;
}

export async function POST(request: Request) {
  const security = checkSecurity(request, false);
  if (!security.allowed) {
    return security.response!;
  }

  try {
    const validation = await validateRequestBody<ChatRequestBody>(request, ["message"]);
    if (validation.errorResponse) {
      return validation.errorResponse;
    }

    const { message } = validation.data!;

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
          title: "Chat with Kiki",
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

    const userMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "user",
        text: message,
      },
    });

    const robotMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "robot",
        text: kikiResult.reply,
        emotion: kikiResult.emotion,
        eyeState: kikiResult.eyeState,
      },
    });

    const conversationObj = {
      id: userMsg.id,
      message: userMsg.text,
      response: robotMsg.text,
      timestamp: robotMsg.timestamp.toISOString(),
    };

    return NextResponse.json({
      reply: kikiResult.reply,
      conversation: conversationObj,
    });

  } catch (error) {
    return handleError(error, "POST chat error");
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

    let conversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: "Chat with Kiki",
        },
      });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { timestamp: "asc" },
    });

    const conversationsList: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.sender === "user") {
        const nextMsg = messages[i + 1];
        const responseText = (nextMsg && nextMsg.sender === "robot") ? nextMsg.text : "";
        conversationsList.push({
          id: msg.id,
          message: msg.text,
          response: responseText,
          timestamp: msg.timestamp.toISOString(),
        });
        if (nextMsg && nextMsg.sender === "robot") {
          i++;
        }
      } else {
        conversationsList.push({
          id: msg.id,
          message: "",
          response: msg.text,
          timestamp: msg.timestamp.toISOString(),
        });
      }
    }

    return NextResponse.json({
      conversations: conversationsList,
    });

  } catch (error) {
    return handleError(error, "GET chat error");
  }
}

export async function DELETE(request: Request) {
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

    let conversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (conversation) {
      await prisma.message.deleteMany({
        where: { conversationId: conversation.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Chat history cleared successfully.",
    });

  } catch (error) {
    return handleError(error, "DELETE chat error");
  }
}
