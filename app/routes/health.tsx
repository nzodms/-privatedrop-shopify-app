// Route de santé publique.
// Aucune dépendance Shopify ni base de données : elle répond toujours 200,
// même si la config OAuth ou la DB sont absentes. Utile pour vérifier que le
// déploiement Vercel est vivant sans déclencher l'authentification.
export const loader = () => {
  return Response.json(
    {
      ok: true,
      service: "privatedrop",
      time: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
};
