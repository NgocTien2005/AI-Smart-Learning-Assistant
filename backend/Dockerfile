FROM node:24-alpine

WORKDIR /app
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY server.js ./
COPY src ./src

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
