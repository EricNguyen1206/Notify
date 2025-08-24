FROM --platform=linux/amd64 node:24.4.1-alpine AS base

# Install dependencies only when needed
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000

# CMD ["npm", "run", "dev", "--turbopack"]
CMD ["npm", "run", "start"]
