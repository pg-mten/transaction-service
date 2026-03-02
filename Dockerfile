# ======================
# Build stage
# ======================
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache curl wget

# 🔑 Prisma BUTUH DATABASE_URL saat generate
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ======================
# Production stage
# ======================
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=test

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# ✅ CREATE LOGS DIRECTORY
RUN mkdir -p /app/logs

# ✅ SECURITY USER
RUN addgroup -S app && adduser -S app -G app

# ✅ FIX PERMISSION
RUN chown -R app:app /app

USER app

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://0.0.0.0:3002/api/v1/health || exit 1

CMD ["node", "dist/src/main.js"]
