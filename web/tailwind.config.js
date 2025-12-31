import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        blue: {
          base: "#2C4481",
          dark: "#2C4091",
        },
        gray: {
          100: "#F9F9FB",
          200: "#E0E2E9",
          300: "#CDCFD5",
          400: "#74798B",
          500: "#4D506C",
          600: "#1F2025",
        },
        danger: "#B12C4D",
      },
      fontSize: {
        xl: ["24px", "32px"],
        lg: ["18px", "24px"],
        md: ["16px", "18px"],
        sm: ["12px", "16px"],
        xs: ["10px", "14px"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};
