import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic, payload } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} reçu pour ${shop}`);

  const current = payload.current as string[];
  if (session) {
    await prisma.session.update({
      where: { id: session.id },
      data: { scope: current.toString() },
    });
  }

  return new Response();
};
