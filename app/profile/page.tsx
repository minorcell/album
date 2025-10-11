import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountForms } from "@/components/profile/account-forms";
import { UserCircle } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const userId = Number.parseInt(session.user.id, 10);
  if (Number.isNaN(userId)) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-foreground">
          <UserCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">个人资料</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          修改用户名或密码，仅对当前账号生效。
        </p>
      </header>
      <AccountForms
        user={{
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}
