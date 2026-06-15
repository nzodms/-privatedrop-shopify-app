import type { LoaderFunctionArgs } from "@remix-run/node";

import { authenticate } from "~/shopify.server";

// Catch-all OAuth : /auth, /auth/callback, /auth/session-token, etc.
// Toute la mécanique OAuth officielle est gérée par le package Shopify.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};
