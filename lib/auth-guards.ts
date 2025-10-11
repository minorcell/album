import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "未授权" }, { status: 401 }),
    } as const;
  }
  return { session } as const;
}

export async function requireAdmin() {
  const sessionCheck = await requireAuth();
  if ("error" in sessionCheck) {
    return sessionCheck;
  }

  if (sessionCheck.session.user?.role !== "admin") {
    return {
      error: NextResponse.json({ error: "权限不足" }, { status: 403 }),
    } as const;
  }

  return sessionCheck;
}
