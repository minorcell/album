"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LayoutDashboard, Copy, Trash2 } from "lucide-react";
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
  status: "pending" | "active" | "rejected";
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

  const pendingUsers = users.filter((u) => u.status === "pending");
  const activeUsersInitial = users.filter((u) => u.status === "active");
  const [activeUsers, setActiveUsers] = useState<UserItem[]>(activeUsersInitial);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryVisibility, setCategoryVisibility] = useState<CategoryVisibility>("internal");

  const [selectedUserRole, setSelectedUserRole] = useState<Record<number, string>>({});
  const [userQuery, setUserQuery] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(20);
  const [userTotal, setUserTotal] = useState<number>(activeUsersInitial.length);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("");

  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deleteTransferUserId, setDeleteTransferUserId] = useState<number | null>(null);
  const [deletePhotosDirectly, setDeletePhotosDirectly] = useState(false);

  const [resettingPasswordUserId, setResettingPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [shareCategoryId, setShareCategoryId] = useState<number | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [expireHours, setExpireHours] = useState("24");
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [copySuccessMessage, setCopySuccessMessage] = useState<string | null>(null);

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

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const params = new URLSearchParams({ page: String(userPage), pageSize: String(userPageSize) });
      if (userQuery.trim()) params.set("q", userQuery.trim());
      if (filterRole) params.set("role", filterRole);
      params.set("status", "active");
      const res = await fetch(`/api/users?${params.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "加载失败");
      const list: UserItem[] = (body.data ?? []).filter((u: unknown): u is UserItem => {
        return !!u && typeof (u as UserItem).status === "string" && (u as UserItem).status === "active";
      });
      setActiveUsers(list);
      setUserTotal(body.meta?.total ?? list.length);
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage, userPageSize]);

  const handleUserStatusChange = async (id: number, status: "pending" | "active" | "rejected") => {
    setError(null);

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "状态更新失败");
      return;
    }

    startTransition(() => router.refresh());
  };

  const handlePasswordReset = async () => {
    if (!resettingPasswordUserId) return;
    setError(null);

    if (!newPassword || !confirmNewPassword) {
      setError("请输入新密码");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    const response = await fetch("/api/users/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: resettingPasswordUserId,
        newPassword: newPassword,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "密码重置失败");
      return;
    }

    setResettingPasswordUserId(null);
    setNewPassword("");
    setConfirmNewPassword("");
    alert("密码重置成功");
  };

  const handleUserDelete = async () => {
    if (!deletingUserId) return;
    setError(null);

    const user = users.find((u) => u.id === deletingUserId);
    if (!user) return;

    if (user.photoCount > 0 && !deletePhotosDirectly && !deleteTransferUserId) {
      setError("该用户有照片，请选择转移到其他用户或直接删除照片");
      return;
    }

    const payload: { id: number; transferToUserId?: number; deletePhotos?: boolean } = {
      id: deletingUserId,
    };

    if (deletePhotosDirectly) {
      payload.deletePhotos = true;
    } else if (deleteTransferUserId) {
      payload.transferToUserId = deleteTransferUserId;
    }

    const response = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "删除用户失败");
      return;
    }

    setDeletingUserId(null);
    setDeleteTransferUserId(null);
    setDeletePhotosDirectly(false);
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

  const handleCopyShareLink = async (token: string) => {
    const fullUrl = `${shareBaseUrl}${token}`;
    setCopySuccessMessage(null);
    setError(null);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopySuccessMessage("链接已复制到剪贴板");
      setTimeout(() => setCopySuccessMessage(null), 3000);
    } catch {
      setError("复制失败，请手动复制链接");
    }
  };

  const handleDeleteShareLink = async (id: number) => {
    setError(null);
    if (!window.confirm("确认删除该分享链接？")) {
      return;
    }

    const response = await fetch("/api/share", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "删除分享链接失败");
      return;
    }

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
          {pendingUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">待审核用户</h3>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户名</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="w-48">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleUserStatusChange(user.id, "active")}
                          >
                            通过
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUserStatusChange(user.id, "rejected")}
                          >
                            拒绝
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">已激活成员</h3>
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="搜索用户名"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="w-64"
                />
                <Select
                  value={filterRole || "__all__"}
                  onValueChange={(v) => setFilterRole(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="角色筛选" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部角色</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="member">成员</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => { setUserPage(1); fetchUsers(); }}>
                  搜索
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">每页</label>
                <Select value={String(userPageSize)} onValueChange={(v) => setUserPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">共 {userTotal} 条</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">用户名</TableHead>
                    <TableHead className="min-w-[170px]">角色</TableHead>
                    <TableHead className="min-w-[170px]">上传数</TableHead>
                    <TableHead className="min-w-[180px]">创建时间</TableHead>
                    <TableHead className="min-w-[380px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.photoCount}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="p-0">
                        <div className="flex items-center gap-2 px-4 py-3">
                          <Select
                            value={selectedUserRole[user.id] ?? user.role}
                            onValueChange={(value) =>
                              setSelectedUserRole((prev) => ({
                                ...prev,
                                [user.id]: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 w-[90px]">
                              <SelectValue placeholder="角色" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">管理员</SelectItem>
                              <SelectItem value="member">成员</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleUserRoleChange(user.id, selectedUserRole[user.id] ?? user.role)}
                          >
                            保存
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8"
                            onClick={() => setResettingPasswordUserId(user.id)}
                          >
                            重置
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            onClick={() => setDeletingUserId(user.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">第 {userPage} 页 / 共 {Math.max(1, Math.ceil(userTotal / userPageSize))} 页</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={userPage <= 1} onClick={() => setUserPage((p) => Math.max(p - 1, 1))}>上一页</Button>
                <Button variant="ghost" size="sm" disabled={userPage * userPageSize >= userTotal} onClick={() => setUserPage((p) => p + 1)}>下一页</Button>
              </div>
            </div>
            {usersLoading && (
              <Alert>
                <AlertTitle>加载中</AlertTitle>
                <AlertDescription>正在加载成员列表...</AlertDescription>
              </Alert>
            )}
            {usersError && (
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>{usersError}</AlertDescription>
              </Alert>
            )}
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

          {copySuccessMessage && (
            <Alert>
              <AlertTitle>操作成功</AlertTitle>
              <AlertDescription>{copySuccessMessage}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>分类</TableHead>
                  <TableHead>链接</TableHead>
                  <TableHead>过期时间</TableHead>
                  <TableHead className="w-32">操作</TableHead>
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
                    <TableCell className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyShareLink(link.token)}
                        title="复制链接"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteShareLink(link.id)}
                        title="删除链接"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deletingUserId !== null} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除用户</DialogTitle>
            <DialogDescription>
              {deletingUserId && users.find((u) => u.id === deletingUserId)?.photoCount
                ? `该用户有 ${users.find((u) => u.id === deletingUserId)?.photoCount} 张照片，请选择如何处理这些照片：`
                : "确认删除该用户？"}
            </DialogDescription>
          </DialogHeader>
          {deletingUserId && users.find((u) => u.id === deletingUserId)?.photoCount ? (
            <RadioGroup
              value={deletePhotosDirectly ? "delete" : deleteTransferUserId ? "transfer" : ""}
              onValueChange={(value) => {
                if (value === "delete") {
                  setDeletePhotosDirectly(true);
                  setDeleteTransferUserId(null);
                } else {
                  setDeletePhotosDirectly(false);
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id="delete-photos" />
                <Label htmlFor="delete-photos">直接删除所有照片</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transfer" id="transfer-photos" />
                <Label htmlFor="transfer-photos">转移到其他用户</Label>
              </div>
            </RadioGroup>
          ) : null}
          {deletingUserId && !deletePhotosDirectly && users.find((u) => u.id === deletingUserId)?.photoCount ? (
            <div className="space-y-2">
              <Label htmlFor="transfer-user">选择目标用户</Label>
              <Select
                value={deleteTransferUserId?.toString() ?? ""}
                onValueChange={(value) => setDeleteTransferUserId(Number(value))}
              >
                <SelectTrigger id="transfer-user">
                  <SelectValue placeholder="选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers
                    .filter((u) => u.id !== deletingUserId)
                    .map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.username}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingUserId(null);
                setDeleteTransferUserId(null);
                setDeletePhotosDirectly(false);
              }}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleUserDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resettingPasswordUserId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResettingPasswordUserId(null);
            setNewPassword("");
            setConfirmNewPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为用户 <strong>{users.find((u) => u.id === resettingPasswordUserId)?.username}</strong> 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 位"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">确认新密码</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="再次输入新密码"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setResettingPasswordUserId(null);
                setNewPassword("");
                setConfirmNewPassword("");
              }}
            >
              取消
            </Button>
            <Button variant="default" onClick={handlePasswordReset}>
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
