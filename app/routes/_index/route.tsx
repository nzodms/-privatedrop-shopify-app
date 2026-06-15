import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "~/shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // Si Shopify nous passe un `shop`, on enclenche directement l'install/login.
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>PrivateDrop</h1>
        <p className={styles.text}>
          Créez des ventes privées, drops chronométrés et showrooms exclusifs
          directement sur Shopify.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Domaine de la boutique</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                placeholder="ma-boutique.myshopify.com"
              />
            </label>
            <button className={styles.button} type="submit">
              Installer l’app
            </button>
          </Form>
        )}
      </div>
    </div>
  );
}
