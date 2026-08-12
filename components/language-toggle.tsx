"use client";

import * as React from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageToggleProps {
  variant?: "ghost" | "outline" | "default" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

// High Quality Crisp SVG Flags
const IndonesiaFlag = () => (
  <svg
    viewBox="0 0 640 480"
    className="size-4 rounded-xs shrink-0 shadow-xs border border-zinc-200/80 overflow-hidden inline-block align-middle"
  >
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#e70011" d="M0 0h640v240H0z" />
      <path fill="#ffffff" d="M0 240h640v240H0z" />
    </g>
  </svg>
);

const UKFlag = () => (
  <svg
    viewBox="0 0 640 480"
    className="size-4 rounded-xs shrink-0 shadow-xs border border-zinc-200/80 overflow-hidden inline-block align-middle"
  >
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path fill="#FFF" d="m75 0 245 180L565 0h75v55L400 240l240 185v55h-75L320 300 75 480H0v-55l240-185L0 55V0h75z" />
    <path fill="#C8102E" d="m424 280 216 165v35h-40L370 305l54-25zm-208 40L0 475v-35l216-160-8 40zM640 0v15L424 180l8-40L600 0h40zM0 0v15l216 165-40 8L0 25V0h40z" />
    <path fill="#FFF" d="M240 0v480h160V0H240zM0 160v160h640V160H0z" />
    <path fill="#C8102E" d="M267 0v480h106V0H267zM0 187v106h640V187H0z" />
  </svg>
);

export function LanguageToggle({
  variant = "ghost",
  size = "sm",
}: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2 font-medium text-xs h-9 px-3 border border-zinc-200/80 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all rounded-full">
          <Globe className="size-3.5 text-zinc-500" />
          <div className="flex items-center gap-1.5">
            {lang === "id" ? <IndonesiaFlag /> : <UKFlag />}
            <span className="uppercase font-bold tracking-wider text-xs text-zinc-800 dark:text-zinc-200">
              {lang === "id" ? "ID" : "EN"}
            </span>
          </div>
          <ChevronDown className="size-3 text-zinc-400 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 min-w-[10rem] p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl">
        <DropdownMenuItem
          onClick={() => setLang("id")}
          className="flex items-center justify-between cursor-pointer text-xs py-2 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <span className="flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
            <IndonesiaFlag /> Indonesia (ID)
          </span>
          {lang === "id" && <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLang("en")}
          className="flex items-center justify-between cursor-pointer text-xs py-2 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <span className="flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
            <UKFlag /> English (EN)
          </span>
          {lang === "en" && <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
