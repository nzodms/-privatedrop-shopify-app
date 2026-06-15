import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "~/shopify.server";

/**
 * RGPD — customers/data_request.
 * Shopify demande les données détenues sur un client.
 * PrivateDrop ne stocke aucune donnée client identifiante : les tentatives
 * d'accès sont conservées sous forme d'emailHash non réversible. Il n'y a
 * donc aucune donnée personnelle à exporter. On accuse réception (200).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} reçu pour ${shop} — aucune donnée client identifiante stockée.`);

  return new Response();
};
