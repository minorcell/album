"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingButton } from "@/components/loading-button";

export function LoginForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      });

      if (response?.error) {
        setError("用户名或密码错误");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
      onSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="请输入用户名"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          toggleable
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
          required
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>登录失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <LoadingButton type="submit" className="w-full" loading={isLoading}>
        登录
      </LoadingButton>
    </form>
  );
}
