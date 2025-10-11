"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormsProvider } from "@/components/profile/forms-context";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";

export function LoginTabs() {
  const [value, setValue] = useState("login");

  return (
    <FormsProvider value={{ switchTab: setValue }}>
      <Tabs value={value} onValueChange={setValue} className="space-y-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="login">登录</TabsTrigger>
          <TabsTrigger value="register">注册</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm onSuccess={() => setValue("login")} />
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm onSuccess={() => setValue("login")} />
        </TabsContent>
      </Tabs>
    </FormsProvider>
  );
}
