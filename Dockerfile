# Production Dockerfile for Smart CRM Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definition files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy built application and node_modules
COPY --from=builder /app ./

EXPOSE 5001

CMD ["npm", "start"]
