import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { key, value } = await request.json();

    if (!key || !value) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    // Verify memory belongs to user
    const memoryCheck = await prisma.robotMemory.findUnique({
      where: { id },
    });

    if (!memoryCheck || memoryCheck.userId !== user.id) {
      return NextResponse.json(
        { error: "Memory not found or access denied" },
        { status: 404 }
      );
    }

    const memory = await prisma.robotMemory.update({
      where: { id },
      data: { key, value },
    });

    return NextResponse.json({ memory });
  } catch (error) {
    console.error("PUT memory error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify memory belongs to user
    const memoryCheck = await prisma.robotMemory.findUnique({
      where: { id },
    });

    if (!memoryCheck || memoryCheck.userId !== user.id) {
      return NextResponse.json(
        { error: "Memory not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.robotMemory.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Memory deleted successfully" });
  } catch (error) {
    console.error("DELETE memory error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
