import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

const createUserSchema = z.object({
  username: z.string().min(3, "用户名至少 3 位"),
  password: z.string().min(6, "密码至少 6 位"),
  role: z.enum(["admin", "member"]).optional(),
});

const updateRoleSchema = z.object({
  id: z.number().int(),
  role: z.enum(["admin", "member"]),
});

export async function GET() {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      _count: {
        select: { photos: true },
      },
    },
  });

  return NextResponse.json(
    users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      photoCount: user._count.photos,
    })),
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const totalUsers = await prisma.user.count();
  let role = parsed.data.role ?? "member";

  if (totalUsers === 0) {
    role = "admin";
  } else if (parsed.data.role && parsed.data.role !== "member") {
    const adminCheck = await requireAdmin();
    if ("error" in adminCheck) {
      return adminCheck.error;
    }
  }

  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) {
    return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      password: hashed,
      role,
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PUT(request: Request) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  const body = await request.json().catch(() => null);
  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.id },
    data: { role: parsed.data.role },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}
