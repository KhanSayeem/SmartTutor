export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        brand: {
          blue: "#2563EB",
          navy: "#1E3A5F"
        },
        status: {
          success: "#047857",
          warning: "#92400E",
          danger: "#B91C1C"
        },
        surface: {
          shell: "#F3F4F6",
          card: "#FFFFFF",
          border: "#E0E4E9",
          placeholder: "#BFC7D1",
          info: "#EFF6FF",
          student: "#EDF0F7",
          success: "#E5FFF2",
          warning: "#FFF7E0",
          danger: "#FFF2F2"
        }
      },
      boxShadow: {
        xs: "0px 2px 8px rgba(0,0,0,0.04)",
        sm: "0px 4px 16px rgba(0,0,0,0.06)",
        md: "0px 4px 24px rgba(0,0,0,0.08)",
        lg: "0px 8px 24px rgba(0,0,0,0.14)",
        xl: "0px 8px 32px rgba(0,0,0,0.12)"
      }
    }
  },
  plugins: []
};
