import type { LoaderFunctionArgs } from "@remix-run/node";

import { authenticate } from "~/shopify.server";

/**
 * Base App Proxy (M1).
 * Sert sous le domaine de la boutique : https://<boutique>/apps/privatedrop
 * Shopify signe la requête (HMAC) ; `authenticate.public.appProxy` la vérifie.
 * La page événement premium complète arrive au Milestone 5 sur /proxy/e/:slug.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.appProxy(request);

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PrivateDrop</title>
    <style>
      body { margin:0; min-height:60vh; display:flex; align-items:center; justify-content:center; font-family: system-ui, sans-serif; background:#fbfbfa; color:#0b0b0f; }
      .card { text-align:center; padding:40px; }
      h1 { font-weight:600; letter-spacing:-0.02em; }
      p { color:#5a5a63; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>PrivateDrop</h1>
      <p>Vos ventes privées apparaîtront ici très bientôt.</p>
    </div>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
