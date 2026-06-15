import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";

import prisma from "./db.server";
import { upsertShopFromSession } from "./domain/shop/shop.server";

// Fallback vers une URL VALIDE si la variable est absente : `new URL("")` lève
// une exception qui ferait planter le module entier au cold start Vercel
// (FUNCTION_INVOCATION_FAILED sur toutes les routes). En production réelle,
// SHOPIFY_APP_URL DOIT être renseignée — ce fallback ne sert qu'à éviter le crash.
const appUrl =
  process.env.SHOPIFY_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://localhost");

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  hooks: {
    // À chaque installation / nouvelle session, on crée ou met à jour le Shop
    // côté serveur. C'est le point d'entrée multi-tenant.
    afterAuth: async ({ session }) => {
      await shopify.registerWebhooks({ session });
      await upsertShopFromSession(session.shop);
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
