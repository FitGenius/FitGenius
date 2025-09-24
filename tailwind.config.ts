/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // FitGenius Dark Theme with Gold Accents
        background: {
          DEFAULT: "#0a0a0a", // Deep black
          secondary: "#111111", // Slightly lighter black
          card: "#1a1a1a", // Card background
          hover: "#262626", // Hover states
        },
        foreground: {
          DEFAULT: "#ffffff", // Primary text
          secondary: "#a3a3a3", // Secondary text
          muted: "#737373", // Muted text
        },
        primary: {
          50: "#fffbf0",
          100: "#fff5d6",
          200: "#ffeaab",
          300: "#ffdc75",
          400: "#ffc83d",
          500: "#ffb000", // Main gold
          600: "#e6a600",
          700: "#cc9500",
          800: "#b38600",
          900: "#996f00",
          950: "#663d00",
        },
        gold: {
          50: "#fffdf0",
          100: "#fff9d6",
          200: "#fff2ab",
          300: "#ffe975",
          400: "#ffdc3d",
          500: "#ffd700", // Bright gold
          600: "#e6c300",
          700: "#ccae00",
          800: "#b39900",
          900: "#997f00",
          950: "#664500",
        },
        surface: {
          DEFAULT: "#1a1a1a",
          elevated: "#262626",
          hover: "#333333",
        },
        border: {
          DEFAULT: "#262626",
          subtle: "#1a1a1a",
          focus: "#ffd700",
        },
        accent: {
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#3b82f6",
        },
        // Workout specific colors
        workout: {
          strength: "#dc2626",
          cardio: "#2563eb",
          flexibility: "#7c3aed",
          rest: "#6b7280",
        },
        // Nutrition specific colors
        nutrition: {
          protein: "#dc2626",
          carbs: "#2563eb",
          fats: "#f59e0b",
          calories: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gold': 'pulseGold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px #ffd700, 0 0 10px #ffd700, 0 0 15px #ffd700',
          },
          '100%': {
            boxShadow: '0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(135deg, #ffd700 0%, #ffb000 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        'card-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #262626 100%)',
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(255, 215, 0, 0.39)',
        'gold-lg': '0 10px 25px -3px rgba(255, 215, 0, 0.3), 0 4px 6px -2px rgba(255, 215, 0, 0.05)',
        'dark': '0 4px 14px 0 rgba(0, 0, 0, 0.8)',
        'dark-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        'inner-gold': 'inset 0 2px 4px 0 rgba(255, 215, 0, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      screens: {
        'xs': '475px',
        '3xl': '1680px',
      },
    },
  },
  plugins: [],
};