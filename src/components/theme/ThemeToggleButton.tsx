
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null until mounted to avoid hydration mismatch
    return <div className="h-9 w-9" />; // Placeholder to maintain layout
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 overflow-hidden"
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
    >
      <AnimatePresence initial={false} mode="wait">
        {theme === "light" ? (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0, scale: 0.8, rotate: -90 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, scale: 0.8, rotate: 90 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0, scale: 0.8, rotate: 90 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, scale: 0.8, rotate: -90 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
