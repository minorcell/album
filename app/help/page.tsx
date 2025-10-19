import { BookOpen, Users, Image as ImageIcon, Shield, Upload, Eye, Share2, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND_FULL } from "@/lib/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">使用说明</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          欢迎使用 {BRAND_FULL}，本页面介绍系统的基本使用方法。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>账户注册与审核</CardTitle>
            </div>
            <CardDescription>如何加入相册系统</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">注册流程</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>访问登录页面，点击&ldquo;注册&rdquo;选项卡</li>
                <li>填写用户名和密码（密码至少 6 位）</li>
                <li>提交后等待管理员审核</li>
                <li>审核通过后即可正常登录使用</li>
              </ol>
            </div>
            <Alert>
              <AlertTitle>提示</AlertTitle>
              <AlertDescription>
                第一个注册的用户会自动成为管理员，无需审核。后续用户需要等待管理员在控制台通过审核。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle>相册与分类</CardTitle>
            </div>
            <CardDescription>浏览和管理照片</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">浏览相册</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>首页显示所有可见的相册分类</li>
                <li>点击分类卡片进入查看该分类的所有照片</li>
                <li>点击照片可以查看大图和详细信息</li>
                <li>支持下载原图</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">创建分类</h4>
              <p className="text-muted-foreground">
                管理员可以在控制台的&ldquo;分类管理&rdquo;中创建新分类，设置名称、描述和可见范围。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle>上传照片</CardTitle>
            </div>
            <CardDescription>如何上传和管理照片</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">上传方式</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>在首页点击&ldquo;快速上传&rdquo;按钮</li>
                <li>或在&ldquo;资料&rdquo;页面点击&ldquo;上传照片&rdquo;</li>
                <li>选择目标分类</li>
                <li>选择一张或多张照片（支持批量上传）</li>
                <li>可选填写照片描述</li>
                <li>点击&ldquo;上传&rdquo;完成</li>
              </ul>
            </div>
            <Alert>
              <AlertTitle>注意</AlertTitle>
              <AlertDescription>
                支持的图片格式：JPG、PNG、GIF、WebP。单张照片大小建议不超过 10MB。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle>可见范围</CardTitle>
            </div>
            <CardDescription>理解照片的访问权限</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">三种可见范围</h4>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <Badge variant="destructive">私有</Badge>
                  <span className="text-muted-foreground">仅管理员可见</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="secondary">共有</Badge>
                  <span className="text-muted-foreground">所有已登录成员可见</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline">公开</Badge>
                  <span className="text-muted-foreground">互联网访客可见（无需登录）</span>
                </li>
              </ul>
            </div>
            <p className="text-muted-foreground">
              管理员可以在控制台修改每个分类的可见范围。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <CardTitle>分享链接</CardTitle>
            </div>
            <CardDescription>创建临时分享链接</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">如何创建分享链接</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>管理员在控制台进入&ldquo;分享链接&rdquo;选项卡</li>
                <li>选择要分享的分类</li>
                <li>可选设置访问密码</li>
                <li>设置过期时间（1-720 小时）</li>
                <li>点击&ldquo;生成分享链接&rdquo;</li>
                <li>将生成的链接分享给他人</li>
              </ol>
            </div>
            <p className="text-muted-foreground">
              分享链接允许未登录用户查看指定分类的照片，适合对外展示。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>管理员功能</CardTitle>
            </div>
            <CardDescription>管理员专属功能</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">控制台功能</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>分类管理：</strong>创建、编辑、删除相册分类</li>
                <li><strong>成员管理：</strong>审核新用户、修改角色、删除用户</li>
                <li><strong>分享链接：</strong>创建临时分享链接</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">删除用户</h4>
              <p className="text-muted-foreground">
                删除用户时可以选择将其上传的照片转移给其他用户，或直接删除所有照片。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>常见问题</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Q: 注册后无法登录？</h4>
            <p className="text-muted-foreground">
              A: 请耐心等待管理员审核通过。审核状态为&ldquo;待审核&rdquo;时无法登录，被拒绝的账户也无法登录。
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Q: 如何成为管理员？</h4>
            <p className="text-muted-foreground">
              A: 第一个注册的用户自动成为管理员。其他用户需要由现有管理员在控制台的&ldquo;成员管理&rdquo;中修改角色。
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Q: 上传的照片可以删除吗？</h4>
            <p className="text-muted-foreground">
              A: 在&ldquo;资料&rdquo;页面可以查看和删除自己上传的照片。管理员可以删除任何照片。
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Q: 忘记密码怎么办？</h4>
            <p className="text-muted-foreground">
              A: 目前系统暂不支持自助找回密码，请联系管理员协助处理。
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>需要帮助？</AlertTitle>
        <AlertDescription>
          如果您在使用过程中遇到问题，请联系管理员或工作室负责人获取支持。
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Badge({ children, variant }: { children: React.ReactNode; variant: "destructive" | "outline" | "secondary" }) {
  const variantClasses = {
    destructive: "bg-destructive/10 text-destructive",
    outline: "border border-border",
    secondary: "bg-secondary text-secondary-foreground",
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
