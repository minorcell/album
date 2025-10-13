import Link from "next/link";
import { Github, Globe, Mail } from "lucide-react";

const links = [
  {
    label: "官网",
    href: "https://cp.hub.feashow.cn/",
    icon: Globe,
  },
  {
    label: "邮件工具",
    href: "https://cpemail.hub.feashow.cn/",
    icon: Mail,
  },
  {
    label: "GitHub",
    href: "https://github.com/codepaintstudio",
    icon: Github,
  },
  {
    label: "项目地址",
    href: "https://github.com/codepaintstudio/cp-album",
    icon: Github,
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">CODEPAINT STUDIO ALBUM</p>
          <p className="text-xs">内部相册平台 · 让创作与资料协同更高效</p>
          <p className="text-xs">
            联系邮箱：
            <a className="hover:text-primary" href="mailto:wujieruanchuang@163.com">
              wujieruanchuang@163.com
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs uppercase tracking-wide hover:text-primary"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
