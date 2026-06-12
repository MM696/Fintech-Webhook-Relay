FROM node:22-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build

COPY . .
RUN npm run build

FROM base AS production

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

WORKDIR /app

COPY --from=build /app/build ./
COPY --from=build /app/docker ./docker

RUN npm ci --omit=dev \
  && chmod +x docker/wait-for-deps.sh docker/entrypoint-api.sh docker/entrypoint-worker.sh

EXPOSE 3333

CMD ["node", "bin/server.js"]
