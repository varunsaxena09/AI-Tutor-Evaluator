"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 bg-white/5 dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 rounded-full transition-colors flex items-center justify-center text-foreground z-50 fixed bottom-6 right-6 shadow-xl"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun className="w-6 h-6 text-yellow-300" /> : <Moon className="w-6 h-6 text-slate-800" />}
    </button>
  );
}
