FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_API_URL is baked into the JS bundle at build time.
# When served via nginx (docker-compose), use the relative path /api/v1
# so the browser routes through nginx which proxies to the backend container.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Use vite build directly: the TanStack Router plugin generates routeTree.gen.ts
# as part of the Vite build process, so tsc pre-check is skipped here.
RUN bun run build:docker

FROM nginx:1.28-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
