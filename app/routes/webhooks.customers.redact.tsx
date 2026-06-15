import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "~/shopify.server";

/**
 * RGPD — customers/redact.
 * Suppression des données d'un client. Comme seuls des emailHash non
 * réversibles peuvent exister (AccessAttempt), il n'y a rien à ré-identifier
 * ni à supprimer de façon ciblée. On accuse réception (200).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} reçu pour ${shop} — données client non identifiables (hash).`);

  return new Response();
};
