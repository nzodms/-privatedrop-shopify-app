import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "~/shopify.server";
import { purgeShopData } from "~/domain/shop/shop.server";

/**
 * RGPD — shop/redact.
 * Envoyé 48 h après désinstallation. Suppression complète des données du
 * tenant (Shop + événements/produits/accès/métriques via cascade) et sessions.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} reçu pour ${shop} — purge complète du tenant.`);

  await purgeShopData(shop);

  return new Response();
};
