import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jtsg: {
          green: "#2d5a3d",
          sand: "#e8dcc4",
          sage: "#9cb4a3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
