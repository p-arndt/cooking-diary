# Stage 0: Base image
FROM node:24 AS base
WORKDIR /app
RUN npm install -g pnpm@11

# Stage 1: Install all dependencies (including dev)
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build the application
FROM dependencies AS builder
WORKDIR /app
COPY . .
RUN pnpm run build

# Stage 3: Prepare production dependencies
FROM base AS prod-dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --ignore-scripts


FROM gcr.io/distroless/nodejs24-debian13:nonroot AS production
WORKDIR /app

COPY --from=prod-dependencies /app/node_modules /app/node_modules
COPY --from=builder /app/build /app/build
COPY --from=builder /app/drizzle /app/drizzle

ENV NODE_ENV=production
# Bounds memory per request, including unauthenticated auth endpoints; sized for the
# largest legitimate body (an entry with 10 photos of 5 MB each plus form fields).
ENV BODY_SIZE_LIMIT=55M

EXPOSE 3000 
CMD ["build/index.js"]