import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  EmptyState,
  InlineGrid,
  Layout,
  Page,
  Text,
} from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { getShopByDomain } from "~/domain/shop/shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const shop = await getShopByDomain(session.shop);

  // Premier passage : on envoie le marchand sur le Smart Start (splash + scan).
  if (!shop?.onboarding || shop.onboarding.status !== "done") {
    throw redirect("/app/onboarding");
  }

  return {
    shopName: shop.shopName ?? session.shop,
    shopDomain: session.shop,
  };
};

export default function Dashboard() {
  const { shopName, shopDomain } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Tableau de bord"
      subtitle={shopName}
      primaryAction={{ content: "Créer une vente privée", disabled: true }}
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
            >
              <Text as="p" variant="bodyMd">
                Réservez un événement exclusif à vos meilleurs clients. La
                création d’événement arrive au prochain milestone.
              </Text>
              <Box paddingBlockStart="400">
                <Button disabled>Créer une vente privée</Button>
              </Box>
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
