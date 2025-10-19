import Link from "next/link";
import { Github, Globe } from "lucide-react";
import { BRAND_FULL, FOOTER_PROJECT_URL, FOOTER_GITHUB_URL, FOOTER_SITE_URL, FOOTER_TAGLINE } from "@/lib/config";

const links = [
  {
    label: "项目地址",
    href: FOOTER_PROJECT_URL,
    icon: Github,
  },
  {
    label: "GitHub",
    href: FOOTER_GITHUB_URL,
    icon: Github,
  },
  {
    label: "站点",
    href: FOOTER_SITE_URL,
    icon: Globe,
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">{BRAND_FULL}</p>
          <p className="text-xs">{FOOTER_TAGLINE}</p>
          
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
