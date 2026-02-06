// @ts-check

import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import {defineConfig} from "astro/config"

// https://astro.build/config
export default defineConfig({
    site: "https://example.com",
    integrations: [mdx(), sitemap()],
    vite: {
        server: {
            proxy: {
                "/opencodecms": {
                    target: "http://localhost:5173",
                    changeOrigin: true,
                    ws: true,
                },
            },
        },
    },
})
