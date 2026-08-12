"use client";

import * as React from "react";
import { Globe, Check } from "lucide-react";
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

export function LanguageToggle({
  variant = "ghost",
  size = "sm",
  showLabel = true,
}: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5 font-medium text-xs">
          <Globe className="size-4 text-muted-foreground" />
          <span className="uppercase font-semibold tracking-wide">
            {lang === "id" ? "ID" : "EN"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 min-w-[9rem]">
        <DropdownMenuItem
          onClick={() => setLang("id")}
          className="flex items-center justify-between cursor-pointer text-xs py-2"
        >
          <span className="flex items-center gap-2 font-medium">
            <span className="text-base leading-none">🇮🇩</span> Indonesia
          </span>
          {lang === "id" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLang("en")}
          className="flex items-center justify-between cursor-pointer text-xs py-2"
        >
          <span className="flex items-center gap-2 font-medium">
            <span className="text-base leading-none">🇬🇧</span> English
          </span>
          {lang === "en" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
