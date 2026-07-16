"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

function noopSubscribe() {
  return () => {};
}

type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 32, className }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  // Avoids a light/dark mismatch flash before hydration — same guard used by ThemeToggle.
  const src = mounted && resolvedTheme === "light" ? "/logo-light.png" : "/logo-dark.png";

  return (
    <Image
      src={src}
      alt="YT Director"
      width={size}
      height={size}
      priority
      className={cn("rounded-lg", className)}
    />
  );
}
