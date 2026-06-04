import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me-in-production";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    let user = await prisma.user.findUnique({
      where: { email: "companion@cutierobo.local" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "companion@cutierobo.local",
          name: "Friend",
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    }
    
    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
