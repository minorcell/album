import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Files, Images, ShieldCheck, LayoutDashboard } from "lucide-react";

export const metadata = {
  title: "帮助",
  description: "快速了解文件、相册、资料与控制台的使用与管理。",
};

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">帮助中心</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          通过卡片了解关键功能与管理方式，快速上手平台。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Files className="h-5 w-5 text-primary" /> 文件
            </CardTitle>
            <CardDescription>
              登录后使用文件管理；文件集的可见性与权限由管理员控制。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>文件集由管理员创建，支持私有 / 共有（内部）/ 公开三种可见范围。</li>
              <li>非管理员可查看共有与公开文件集；私有文件集仅管理员或创建者可见。</li>
              <li>上传文件需要登录：共有/公开文件集所有已登录用户可上传；私有文件集仅管理员或创建者可上传。</li>
              <li>文件列表支持按名称搜索、下载；删除与描述修改仅限管理员或上传者。</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Images className="h-5 w-5 text-primary" /> 相册
            </CardTitle>
            <CardDescription>
              分类相册按私有 / 共有（内部）/ 公开可见性展示与访问。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>未登录访客仅能在首页看到公开分类；登录成员可见共有与公开分类；私有分类仅管理员可见。</li>
              <li>照片上传需登录：进入分类页后可上传到当前分类（私有分类仅管理员可上传）。</li>
              <li>支持搜索与时间排序；照片网格提供选择下载、重命名与删除（管理员可管理全部，成员仅管理自己上传）。</li>
              <li>管理员可在控制台为分类生成分享链接（可设置密码与有效期）。</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" /> 控制台（管理员）
            </CardTitle>
            <CardDescription>
              管理分类、用户、分享链接与文件集，仅管理员可访问。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>分类：创建/编辑/删除，设置可见范围（私有/共有/公开）。删除分类会一并删除其中照片。</li>
              <li>文件集：创建与管理文件集（可见范围与描述）。</li>
              <li>用户：审核新注册（通过/拒绝）、更新角色（member/admin）、重置密码、删除用户并处理其照片归属。</li>
              <li>分享链接：为分类生成可选密码与有效期的链接，支持复制与删除。</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> 注册与使用流程
            </CardTitle>
            <CardDescription>
              新用户注册、审核与登录的实际流程与权限。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>首次注册：当系统中无用户时，第一个注册的账户将自动成为管理员并直接激活。</li>
              <li>后续注册：普通用户注册后处于“待审核”状态，管理员在控制台将其设为“active”后方可登录。</li>
              <li>登录限制：待审核或被拒绝的用户无法登录；登录后可访问共有与公开内容，管理员可访问全部。</li>
              <li>角色说明：系统角色仅 admin 与 member；角色决定对分类与文件集的可见性与管理权限。</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-base font-semibold">可见性与权限速览</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          分类与文件集的可见范围分为私有 / 共有（系统成员可见）/ 公开；未登录访客仅能浏览公开分类。管理员拥有全部管理权限，成员可管理自己上传的内容。
        </p>
      </div>
    </div>
  );
}
