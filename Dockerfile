# Gunakan Node.js base image ringan
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json & package-lock.json dulu (optimasi cache)
COPY package*.json ./

# Install dependency
RUN npm ci

# Copy semua source code
COPY . .

RUN npx prisma generate

# Build project (misalnya NestJS)
RUN npm run build

# Stage kedua untuk image lebih kecil
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy hanya file yang dibutuhkan
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3002

CMD ["node", "dist/main.js"]
