import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
        // Modern gradient colors inspired by Admindek
        gradient: {
          blue: {
            from: '#4099ff',
            to: '#73b4ff'
          },
          purple: {
            from: '#9368e9',
            to: '#ab8ce4'
          },
          green: {
            from: '#2ed8b6',
            to: '#59e0c5'
          },
          orange: {
            from: '#FFB64D',
            to: '#ffcb80'
          },
          red: {
            from: '#FF5370',
            to: '#ff869a'
          },
          teal: {
            from: '#00bcd4',
            to: '#26c6da'
          }
        }
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(135deg, #4099ff 0%, #73b4ff 100%)',
        'gradient-purple': 'linear-gradient(135deg, #9368e9 0%, #ab8ce4 100%)',
        'gradient-green': 'linear-gradient(135deg, #2ed8b6 0%, #59e0c5 100%)',
        'gradient-orange': 'linear-gradient(135deg, #FFB64D 0%, #ffcb80 100%)',
        'gradient-red': 'linear-gradient(135deg, #FF5370 0%, #ff869a 100%)',
        'gradient-teal': 'linear-gradient(135deg, #00bcd4 0%, #26c6da 100%)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config