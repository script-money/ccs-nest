FROM node:14-alpine as builder

WORKDIR /app

COPY package.json .
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build:testnet

# ---

FROM node:14-alpine

USER node
WORKDIR /ccs
ENV NODE_ENV testnet

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/cadence ./cadence
COPY --from=builder /app/docker-nginx-cors/cert ./cert

EXPOSE 7001

CMD npx prisma migrate deploy && npx prisma db seed && npm run run:testnet