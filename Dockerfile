# =========================
# Etapa 1: Build
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

# Usamos la misma version de npm con la que fue validado Hito 2
RUN npm install -g npm@11.6.2

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

# Mantener la misma version de npm que en build
RUN npm install -g npm@11.6.2

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]