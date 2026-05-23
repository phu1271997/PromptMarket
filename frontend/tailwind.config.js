/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0813", // Custom deep space dark background
        foreground: "#f3f1f8",
        card: {
          DEFAULT: "rgba(20, 16, 32, 0.6)",
          border: "rgba(139, 92, 246, 0.15)",
        },
        primary: {
          DEFAULT: "#8B5CF6", // Purple
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#3B82F6", // Blue
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#EC4899", // Pink accent
        },
        muted: {
          DEFAULT: "rgba(243, 241, 248, 0.6)",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
        "purple-blue-gradient": "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
      },
      boxShadow: {
        "neon-purple": "0 0 15px rgba(139, 92, 246, 0.3)",
        "neon-blue": "0 0 15px rgba(59, 130, 246, 0.3)",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
