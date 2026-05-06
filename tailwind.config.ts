import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
				chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
				},
				// Map common blue/teal/cyan/sky color tokens to the primary/accent CSS variables
				teal: {
					50: 'hsl(var(--primary) / 0.08)',
					100: 'hsl(var(--primary) / 0.15)',
					200: 'hsl(var(--primary) / 0.25)',
					300: 'hsl(var(--primary) / 0.35)',
					400: 'hsl(var(--primary) / 0.6)',
					500: 'hsl(var(--primary))',
					600: 'hsl(var(--primary) / 0.95)',
					700: 'hsl(var(--primary) / 0.85)',
					800: 'hsl(var(--primary) / 0.75)',
					900: 'hsl(var(--primary) / 0.65)'
				},
				sky: {
					50: 'hsl(var(--primary) / 0.06)',
					100: 'hsl(var(--primary) / 0.12)',
					200: 'hsl(var(--primary) / 0.2)',
					300: 'hsl(var(--primary) / 0.3)',
					400: 'hsl(var(--primary) / 0.5)',
					500: 'hsl(var(--primary))',
					600: 'hsl(var(--primary) / 0.9)',
					700: 'hsl(var(--primary) / 0.8)',
					800: 'hsl(var(--primary) / 0.7)',
					900: 'hsl(var(--primary) / 0.6)'
				},
				cyan: {
					50: 'hsl(var(--primary) / 0.06)',
					100: 'hsl(var(--primary) / 0.12)',
					200: 'hsl(var(--primary) / 0.2)',
					300: 'hsl(var(--primary) / 0.3)',
					400: 'hsl(var(--primary) / 0.5)',
					500: 'hsl(var(--primary))',
					600: 'hsl(var(--primary) / 0.9)',
					700: 'hsl(var(--primary) / 0.8)',
					800: 'hsl(var(--primary) / 0.7)',
					900: 'hsl(var(--primary) / 0.6)'
				},
				blue: {
					50: 'hsl(var(--primary) / 0.06)',
					100: 'hsl(var(--primary) / 0.12)',
					200: 'hsl(var(--primary) / 0.2)',
					300: 'hsl(var(--primary) / 0.3)',
					400: 'hsl(var(--primary) / 0.5)',
					500: 'hsl(var(--primary))',
					600: 'hsl(var(--primary) / 0.9)',
					700: 'hsl(var(--primary) / 0.8)',
					800: 'hsl(var(--primary) / 0.7)',
					900: 'hsl(var(--primary) / 0.6)'
				}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
