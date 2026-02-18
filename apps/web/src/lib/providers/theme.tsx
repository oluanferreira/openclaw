"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { memo } from "react";

interface ThemeProviderProps {
  readonly children: React.ReactNode;
}

export const ThemeProvider = memo<ThemeProviderProps>(({ children }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
});

ThemeProvider.displayName = "ThemeProvider";
