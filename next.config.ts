import type { NextConfig } from "next";

/**
 * Dois modos de build:
 *
 * 1. `npm run build`            -> build padrão do Next.js (preview/servidor)
 * 2. `STATIC_EXPORT=1 npm run build` -> exportação 100% estática na pasta `out/`,
 *    usada para publicar no Netlify por upload manual (drag & drop do ZIP/pasta).
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        // Netlify serve arquivos estáticos: sem otimizador de imagens do Next.
        images: { unoptimized: true },
        // Gera /index.html para cada rota, evitando 404 em links sem extensão.
        trailingSlash: true,
      }
    : {}),
  poweredByHeader: false,
};

export default nextConfig;
