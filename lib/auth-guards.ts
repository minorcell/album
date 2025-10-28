import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

type SessionWithUser = Omit<Session, "user"> & { user: NonNullable<Session["user"]> };
type AuthOk = { ok: true; session: SessionWithUser };
type AuthErr = { ok: false; error: NextResponse };
type AuthResult = AuthOk | AuthErr;

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      error: NextResponse.json({ error: "未授权" }, { status: 401 }),
    };
  }
  return { ok: true, session: session as SessionWithUser };
}

export async function requireAdmin(): Promise<AuthResult> {
  const res = await requireAuth();
  if (!res.ok) return res;

  if (res.session.user.role !== "admin") {
    return {
      ok: false,
      error: NextResponse.json({ error: "权限不足" }, { status: 403 }),
    };
  }

  return res;
}
