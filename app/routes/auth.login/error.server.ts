import { LoginErrorType, type LoginError } from "@shopify/shopify-app-remix/server";

export function loginErrorMessage(loginErrors: LoginError): {
  shop?: string;
} {
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return { shop: "Indiquez le domaine de votre boutique pour vous connecter." };
  } else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return { shop: "Ce domaine de boutique est invalide." };
  }

  return {};
}
