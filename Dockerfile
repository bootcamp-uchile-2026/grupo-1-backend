# =========================
# Etapa 1: Build
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


# =========================
# Etapa 2: Produccion
# =========================
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder --chown=node:node /app/dist ./dist

RUN mkdir -p /app/uploads/productos && chown -R node:node /app/uploads

USER node

EXPOSE 3000

CMD ["node", "dist/main"]