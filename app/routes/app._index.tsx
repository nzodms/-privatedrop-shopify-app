import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  BlockStack,
  Card,
  EmptyState,
  InlineGrid,
  Layout,
  Modal,
  Page,
  Text,
} from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { SplashScreen } from "~/components/SplashScreen";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // On lit le nom de la boutique : preuve que l'OAuth + l'Admin API fonctionnent.
  let shopName = session.shop;
  try {
    const res = await admin.graphql(
      `#graphql
      query ShopName { shop { name } }`,
    );
    const body = (await res.json()) as { data?: { shop?: { name?: string } } };
    shopName = body.data?.shop?.name ?? session.shop;
  } catch {
    // Non bloquant : on garde le domaine si l'appel échoue.
  }

  return { shopName, shopDomain: session.shop };
};

export default function Dashboard() {
  const { shopName, shopDomain } = useLoaderData<typeof loader>();
  const [showSplash, setShowSplash] = useState(false);
  const [soonOpen, setSoonOpen] = useState(false);

  // Splash premium affiché une fois par session de navigation (après install).
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("pd_splash_seen")) {
        setShowSplash(true);
        sessionStorage.setItem("pd_splash_seen", "1");
      }
    } catch {
      setShowSplash(true);
    }
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen
          caption="Préparation de votre espace"
          onDone={() => setShowSplash(false)}
        />
      )}

      <Page
        title="PrivateDrop"
        subtitle={shopName}
        primaryAction={{
          content: "Créer une vente privée",
          onAction: () => setSoonOpen(true),
        }}
      >
        <Layout>
          <Layout.Section>
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              <StatCard label="Événements" value="0" />
              <StatCard label="Vues" value="0" />
              <StatCard label="Clics produits" value="0" />
              <StatCard label="Accès validés" value="0" />
            </InlineGrid>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <EmptyState
                heading="Créez votre première vente privée"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                action={{
                  content: "Créer une vente privée",
                  onAction: () => setSoonOpen(true),
                }}
              >
                <Text as="p" variant="bodyMd">
                  Réservez un événement exclusif à vos meilleurs clients. La
                  création d’événement arrive au prochain milestone.
                </Text>
              </EmptyState>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Connexion Shopify
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Boutique connectée : {shopDomain}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>

      <Modal
        open={soonOpen}
        onClose={() => setSoonOpen(false)}
        title="Bientôt disponible"
        primaryAction={{ content: "Compris", onAction: () => setSoonOpen(false) }}
      >
        <Modal.Section>
          <Text as="p" variant="bodyMd">
            La création de vente privée arrive au prochain milestone. L’app est
            bien installée et connectée à votre boutique ✅
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="span" variant="bodySm" tone="subdued">
          {label}
        </Text>
        <Text as="span" variant="heading2xl">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}
