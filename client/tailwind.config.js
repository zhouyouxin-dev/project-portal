/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.6" }],
        base: ["1rem", { lineHeight: "1.7" }],
        lg: ["1.125rem", { lineHeight: "1.5" }],
        xl: ["1.25rem", { lineHeight: "1.4" }],
        "2xl": ["1.5rem", { lineHeight: "1.3" }],
        "3xl": ["1.875rem", { lineHeight: "1.25" }],
        "4xl": ["2.25rem", { lineHeight: "1.2" }],
        display: ["clamp(2rem, 4.5vw, 3.25rem)", { lineHeight: "1.15" }],
      },
      fontFamily: {
        // 系统无衬线：不加载外部字体，首屏无字体闪烁
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans SC"',
          'Helvetica', 'Arial', 'sans-serif',
        ],
        mono: [
          'ui-monospace', '"SF Mono"', 'SFMono-Regular', 'Menlo', 'Consolas',
          '"Liberation Mono"', 'monospace',
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        // 全站唯一的彩色：奖项徽章按等级取色
        medal: {
          gold: {
            DEFAULT: "hsl(var(--medal-gold) / <alpha-value>)",
            foreground: "hsl(var(--medal-gold-foreground) / <alpha-value>)",
          },
          silver: {
            DEFAULT: "hsl(var(--medal-silver) / <alpha-value>)",
            foreground: "hsl(var(--medal-silver-foreground) / <alpha-value>)",
          },
          bronze: {
            DEFAULT: "hsl(var(--medal-bronze) / <alpha-value>)",
            foreground: "hsl(var(--medal-bronze-foreground) / <alpha-value>)",
          },
          plain: {
            DEFAULT: "hsl(var(--medal-plain) / <alpha-value>)",
            foreground: "hsl(var(--medal-plain-foreground) / <alpha-value>)",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.06)",
        "card-hover": "0 12px 24px -8px rgb(37 99 235 / 0.25), 0 2px 6px rgb(0 0 0 / 0.05)",
        "blue-soft": "0 8px 20px -6px rgb(59 130 246 / 0.35), 0 2px 6px -2px rgb(59 130 246 / 0.15)",
      },
      maxWidth: {
        grid: "1200px",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        rise: "rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        fade: "fade 0.3s ease-out both",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
