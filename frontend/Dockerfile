FROM --platform=linux/amd64 node:20.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
    if [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
    else echo "package-lock.json not found." && exit 1; \
    fi

# Development image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--turbopack"]
