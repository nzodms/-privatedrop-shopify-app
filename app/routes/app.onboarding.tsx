import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  Page,
  Text,
} from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { getShopByDomain } from "~/domain/shop/shop.server";
import { SplashScreen } from "~/components/SplashScreen";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Récupération des infos boutique via l'Admin API (preuve OAuth en M1).
  // Le scan complet produits/clients (Smart Start) arrive au Milestone 2.
  const response = await admin.graphql(
    `#graphql
    query ShopOnboarding {
      shop {
        name
        myshopifyDomain
        contactEmail
        plan { displayName }
      }
    }`,
  );
  const body = (await response.json()) as {
    data?: {
      shop?: {
        name?: string;
        myshopifyDomain?: string;
        contactEmail?: string;
        plan?: { displayName?: string };
      };
    };
  };
  const shopData = body.data?.shop;

  if (shopData?.name) {
    await prisma.shop.update({
      where: { shopDomain: session.shop },
      data: {
        shopName: shopData.name,
        email: shopData.contactEmail ?? undefined,
        plan: shopData.plan?.displayName ?? undefined,
      },
    });
  }

  const shop = await getShopByDomain(session.shop);

  return {
    shopName: shopData?.name ?? session.shop,
    shopDomain: shopData?.myshopifyDomain ?? session.shop,
    plan: shopData?.plan?.displayName ?? "—",
    onboardingStatus: shop?.onboarding?.status ?? "pending",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getShopByDomain(session.shop);

  if (shop) {
    await prisma.onboardingState.update({
      where: { shopId: shop.id },
      data: { status: "done", completedAt: new Date() },
    });
  }

  return redirect("/app");
};

export default function Onboarding() {
  const { shopName, shopDomain, plan } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [ready, setReady] = useState(false);
  const submitting = navigation.state === "submitting";

  return (
    <>
      {!ready && (
        <SplashScreen
          caption="Préparation de votre première vente privée"
          onDone={() => setReady(true)}
        />
      )}

      <Page narrowWidth>
        <BlockStack gap="600">
          <BlockStack gap="200">
            <Text as="h1" variant="headingXl">
              Votre boutique est prête pour sa première vente privée.
            </Text>
            <Text as="p" variant="bodyLg" tone="subdued">
              PrivateDrop analyse vos produits et vos clients pour préparer un
              événement adapté à votre marque.
            </Text>
          </BlockStack>

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Connexion Shopify
              </Text>
              <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                <SummaryItem label="Boutique" value={shopName} />
                <SummaryItem label="Domaine" value={shopDomain} />
                <SummaryItem label="Forfait" value={plan} />
              </InlineGrid>
              <Text as="p" variant="bodySm" tone="subdued">
                Connexion établie via OAuth. Le scan automatique des produits,
                clients et tags VIP (Smart Start) arrive au prochain milestone.
              </Text>
            </BlockStack>
          </Card>

          <Form method="post">
            <Box>
              <Button submit variant="primary" loading={submitting}>
                Accéder au tableau de bord
              </Button>
            </Box>
          </Form>
        </BlockStack>
      </Page>
    </>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <BlockStack gap="100">
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
      <Text as="span" variant="headingSm">
        {value}
      </Text>
    </BlockStack>
  );
}
