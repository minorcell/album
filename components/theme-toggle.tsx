"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // 避免 hydration 不匹配
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
        aria-label="切换主题"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5" />;
      case "dark":
        return <Moon className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "切换到深色模式";
      case "dark":
        return "切换到跟随系统";
      default:
        return "切换到浅色模式";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
