"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard } from "lucide-react";
import type { CategoryVisibility } from "@prisma/client";

interface CategoryItem {
  id: number;
  name: string;
  description: string | null;
  photoCount: number;
  createdAt: string;
  visibility: "private" | "internal" | "public";
}

interface UserItem {
  id: number;
  username: string;
  role: string;
  photoCount: number;
  createdAt: string;
}

interface ShareLinkItem {
  id: number;
  token: string;
  categoryId: number;
  categoryName: string;
  expiresAt: string | null;
  createdAt: string;
}

interface AdminDashboardProps {
  categories: CategoryItem[];
  users: UserItem[];
  shareLinks: ShareLinkItem[];
}

export function AdminDashboard({ categories, users, shareLinks }: AdminDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryVisibility, setCategoryVisibility] = useState<CategoryVisibility>("internal");

  const [selectedUserRole, setSelectedUserRole] = useState<Record<number, string>>({});

  const [shareCategoryId, setShareCategoryId] = useState<number | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [expireHours, setExpireHours] = useState("24");
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const shareBaseUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/share/`;
    }
    return "/share/";
  }, []);

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryVisibility("internal");
  };

  const handleCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!categoryName.trim()) {
      setError("分类名称不能为空");
      return;
    }

    const payload = {
      name: categoryName.trim(),
      description: categoryDescription.trim() || undefined,
      visibility: categoryVisibility,
    };

    const isEditing = editingCategoryId !== null;
    const response = await fetch("/api/categories", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEditing
          ? {
              ...payload,
              id: editingCategoryId,
            }
          : payload,
      ),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "操作失败");
      return;
    }

    resetCategoryForm();
    startTransition(() => router.refresh());
  };

  const handleCategoryDelete = async (id: number) => {
    setError(null);
    if (!window.confirm("确认删除该分类？分类内的照片将一并删除。")) {
      return;
    }

    const response = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "删除失败");
      return;
    }

    startTransition(() => router.refresh());
  };

  const handleUserRoleChange = async (id: number, role: string) => {
    setError(null);

    const response = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "角色更新失败");
      return;
    }

    startTransition(() => router.refresh());
  };

  const handleShareCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShareMessage(null);
    setError(null);

    if (!shareCategoryId) {
      setError("请选择分类");
      return;
    }

    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: shareCategoryId,
        password: sharePassword.trim() || undefined,
        expireInHours: Number.parseInt(expireHours, 10) || undefined,
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(body.error ?? "分享链接创建失败");
      return;
    }

    setShareMessage(`${shareBaseUrl}${body.token}`);
    setSharePassword("");
    setExpireHours("24");
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">控制台</h1>
        </div>
        <p className="text-sm text-muted-foreground">管理分类、成员以及分享链接。</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>操作失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="categories">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">分类管理</TabsTrigger>
          <TabsTrigger value="users">成员管理</TabsTrigger>
          <TabsTrigger value="share">分享链接</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <form onSubmit={handleCategorySubmit} className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">分类名称</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="例如：活动照片"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category-description">描述</Label>
              <Textarea
                id="category-description"
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
                placeholder="可选，用于说明该分类"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-visibility">可见范围</Label>
              <Select value={categoryVisibility} onValueChange={(value) => setCategoryVisibility(value as CategoryVisibility)}>
                <SelectTrigger id="category-visibility">
                  <SelectValue placeholder="选择可见范围" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">私有（仅管理员）</SelectItem>
                  <SelectItem value="internal">共有（系统用户可见）</SelectItem>
                  <SelectItem value="public">公开（互联网访客可见）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
              <Button type="submit" disabled={isPending}>
                {editingCategoryId ? "保存修改" : "添加分类"}
              </Button>
              {editingCategoryId && (
                <Button type="button" variant="ghost" onClick={resetCategoryForm}>
                  取消编辑
                </Button>
              )}
            </div>
          </form>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>可见范围</TableHead>
                  <TableHead className="w-24 text-right">照片数</TableHead>
                  <TableHead className="w-48">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell>
                      <VisibilityBadge visibility={category.visibility} />
                    </TableCell>
                    <TableCell className="text-right">{category.photoCount}</TableCell>
                    <TableCell className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setCategoryName(category.name);
                          setCategoryDescription(category.description ?? "");
                          setCategoryVisibility(category.visibility);
                        }}
                      >
                        编辑
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleCategoryDelete(category.id)}>
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>上传数</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-40">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.photoCount}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="flex flex-wrap items-center gap-2">
                      <Select
                        value={selectedUserRole[user.id] ?? user.role}
                        onValueChange={(value) =>
                          setSelectedUserRole((prev) => ({
                            ...prev,
                            [user.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理员</SelectItem>
                          <SelectItem value="member">成员</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserRoleChange(user.id, selectedUserRole[user.id] ?? user.role)}
                      >
                        保存
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="share" className="space-y-6">
          <form onSubmit={handleShareCreate} className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="share-category">选择分类</Label>
              <Select onValueChange={(value) => setShareCategoryId(Number(value))}>
                <SelectTrigger id="share-category">
                  <SelectValue placeholder="选择需要分享的分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-password">访问密码（可选）</Label>
              <Input
                id="share-password"
                value={sharePassword}
                onChange={(event) => setSharePassword(event.target.value)}
                placeholder="留空则不设置密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-expire">过期时间 (小时)</Label>
              <Input
                id="share-expire"
                type="number"
                min={1}
                max={720}
                value={expireHours}
                onChange={(event) => setExpireHours(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isPending}>
                生成分享链接
              </Button>
            </div>
          </form>

          {shareMessage && (
            <Alert>
              <AlertTitle>分享链接创建成功</AlertTitle>
              <AlertDescription className="break-all">{shareMessage}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>分类</TableHead>
                  <TableHead>链接</TableHead>
                  <TableHead>过期时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>{link.categoryName}</TableCell>
                    <TableCell className="break-all text-sm text-primary">
                      {shareBaseUrl}
                      {link.token}
                    </TableCell>
                    <TableCell>
                      {link.expiresAt ? new Date(link.expiresAt).toLocaleString() : "不限"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: CategoryVisibility }) {
  const config: Record<CategoryVisibility, { label: string; variant: "destructive" | "outline" | "secondary" }> = {
    private: { label: "私有", variant: "destructive" },
    internal: { label: "共有", variant: "secondary" },
    public: { label: "公开", variant: "outline" },
  };
  const { label, variant } = config[visibility];
  return <Badge variant={variant}>{label}</Badge>;
}
