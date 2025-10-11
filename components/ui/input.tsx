import { useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends ComponentProps<"input"> {
  toggleable?: boolean;
}

function Input({ className, type, toggleable, ...props }: InputProps) {
  const isPasswordField = type === "password" && toggleable;
  const [revealed, setRevealed] = useState(false);
  const inputType = isPasswordField && revealed ? "text" : type;

  return (
    <div className="relative w-full">
      <input
        type={inputType}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          isPasswordField ? "pr-10" : undefined,
          className,
        )}
        {...props}
      />
      {isPasswordField ? (
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
          onClick={() => setRevealed((prev) => !prev)}
          aria-label={revealed ? "隐藏密码" : "显示密码"}
        >
          {revealed ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      ) : null}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.12 5.12A10.46 10.46 0 0 0 1 12s4 7 11 7a10.94 10.94 0 0 0 5.07-1.21" />
      <path d="M6.61 6.61A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a17.05 17.05 0 0 1-3.24 4.58" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export { Input };
