# PrivateDrop — image de production (déploiement hébergé hors `shopify app dev`).
FROM node:22-alpine

EXPOSE 3000
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Remix a besoin de l'outillage Vite pour le build ; on l'installe à part.
RUN npm install vite

COPY . .
RUN npx prisma generate
RUN npm run build

CMD ["npm", "run", "docker-start"]
