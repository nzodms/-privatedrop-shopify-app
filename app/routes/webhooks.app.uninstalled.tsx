import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { markShopUninstalled } from "~/domain/shop/shop.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} reçu pour ${shop}`);

  // Coupe les accès : marque le shop désinstallé + archive ses événements.
  await markShopUninstalled(shop);

  // Supprime les sessions/token côté serveur.
  if (session) {
    await prisma.session.deleteMany({ where: { shop } });
  }

  return new Response();
};
