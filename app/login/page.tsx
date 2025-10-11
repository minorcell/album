import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginTabs } from "@/components/profile/login-tabs";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>工作室相册系统</CardTitle>
          <CardDescription>登录后即可上传与管理图片；首次注册的用户将成为管理员。</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginTabs />
        </CardContent>
      </Card>
    </div>
  );
}
