
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Expanded Mint.com inspired colors
        mint: {
          primary: "hsl(174, 100%, 33%)", // #00A693 - Verde principal mais fiel ao Mint
          secondary: "hsl(174, 100%, 36%)", // #00B8A5 - Verde secundário mais claro
          light: "hsl(174, 42%, 94%)", // #E6F7F5 - Verde muito claro para fundos
          dark: "hsl(174, 100%, 27%)", // #008A7A - Verde escuro para contrastes
          darker: "hsl(174, 100%, 22%)", // #006B5D - Verde ainda mais escuro
          "text-primary": "hsl(0, 0%, 13%)", // #222222 - Texto principal
          "text-secondary": "hsl(0, 0%, 42%)", // #6A6A6A - Texto secundário
          "bg-main": "hsl(0, 0%, 97%)", // #F7F7F7 - Fundo principal
          "bg-component": "hsl(0, 0%, 100%)", // #FFFFFF - Fundo dos componentes
        },
        // Glass morphism utilities
        glass: {
          white: "rgba(255, 255, 255, 0.1)",
          "white-light": "rgba(255, 255, 255, 0.05)",
          "white-strong": "rgba(255, 255, 255, 0.2)",
          dark: "rgba(0, 0, 0, 0.1)",
          "dark-light": "rgba(0, 0, 0, 0.05)",
        },
        // Recurring Transaction Colors - Receitas (Revenue)
        revenue: {
          DEFAULT: "hsl(142, 71%, 45%)", // Verde esmeralda
          light: "hsl(142, 50%, 85%)", // Verde claro para background
          lighter: "hsl(142, 30%, 95%)", // Verde muito claro
          accent: "hsl(45, 100%, 60%)", // Dourado accent
          border: "hsl(142, 60%, 55%)", // Verde para bordas
          glow: "hsl(142, 71%, 45%)", // Verde para glow effect
        },
        // Recurring Transaction Colors - Despesas (Expenses)
        expense: {
          DEFAULT: "hsl(14, 90%, 53%)", // Vermelho coral elegante
          light: "hsl(14, 60%, 85%)", // Vermelho claro para background
          lighter: "hsl(14, 30%, 95%)", // Vermelho muito claro
          accent: "hsl(25, 95%, 53%)", // Laranja accent
          border: "hsl(14, 70%, 60%)", // Vermelho para bordas
          glow: "hsl(14, 90%, 53%)", // Vermelho para glow effect
        },
        // Status Colors
        status: {
          overdue: "hsl(0, 85%, 60%)", // Vermelho para atraso
          "overdue-bg": "hsl(0, 100%, 97%)", // Background vermelho claro
          upcoming: "hsl(45, 100%, 50%)", // Amarelo/dourado para próximos
          "upcoming-bg": "hsl(45, 100%, 97%)", // Background amarelo claro
          active: "hsl(142, 71%, 45%)", // Verde para ativos
          "active-bg": "hsl(142, 30%, 97%)", // Background verde claro
          paused: "hsl(220, 13%, 60%)", // Cinza para pausados
          "paused-bg": "hsl(220, 13%, 97%)", // Background cinza claro
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px currentColor" },
          "50%": { boxShadow: "0 0 20px currentColor, 0 0 30px currentColor" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
