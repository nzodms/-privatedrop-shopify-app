import prisma from "~/db.server";

/**
 * Crée ou met à jour le tenant Shop après une authentification réussie.
 * Idempotent : appelé à chaque afterAuth / réinstallation.
 */
export async function upsertShopFromSession(shopDomain: string) {
  return prisma.shop.upsert({
    where: { shopDomain },
    create: {
      shopDomain,
      onboarding: { create: {} },
    },
    update: {
      // Réinstallation : on réactive le tenant.
      uninstalledAt: null,
    },
    include: { onboarding: true },
  });
}

export async function getShopByDomain(shopDomain: string) {
  return prisma.shop.findUnique({
    where: { shopDomain },
    include: { onboarding: true },
  });
}

/**
 * Désinstallation : marque le shop comme désinstallé et coupe les accès en
 * passant tous ses événements en `archived`. La purge fine vient avec les
 * webhooks RGPD (shop/redact).
 */
export async function markShopUninstalled(shopDomain: string) {
  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) return;

  await prisma.$transaction([
    prisma.shop.update({
      where: { id: shop.id },
      data: { uninstalledAt: new Date() },
    }),
    prisma.event.updateMany({
      where: { shopId: shop.id, status: { not: "archived" } },
      data: { status: "archived" },
    }),
  ]);
}

/**
 * shop/redact (RGPD) : suppression complète des données du tenant.
 * Les sessions sont supprimées séparément (clé = shopDomain).
 */
export async function purgeShopData(shopDomain: string) {
  // Les relations Event/EventProduct/AccessAttempt/EventMetric/OnboardingState
  // sont en `onDelete: Cascade`, la suppression du Shop suffit.
  await prisma.shop.deleteMany({ where: { shopDomain } });
  await prisma.session.deleteMany({ where: { shop: shopDomain } });
}
