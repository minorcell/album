import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

const checkSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessage = Object.values(errors).flat()[0] || "请求参数错误";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { status: true },
  });

  return NextResponse.json({ status: user?.status ?? "unknown" });
}

