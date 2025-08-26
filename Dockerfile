# Gunakan base image Node.js
FROM node:18 AS builder
WORKDIR /app

# Copy file yang diperlukan
COPY package.json package-lock.json ./
RUN npm install --only=production

# Copy source code
COPY . .

# Build aplikasi
RUN npm run build

# Gunakan image yang lebih ringan untuk production
FROM node:18-alpine
WORKDIR /app

# Copy hasil build dari tahap sebelumnya
COPY --from=builder /app ./
RUN npm install --only=production

# Jalankan aplikasi
CMD ["npm", "run", "start:prod"]
