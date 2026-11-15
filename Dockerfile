FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DB_PATH=/app/data/agricircle.db

COPY package*.json ./

RUN npm install --omit=dev

COPY src/ ./src/
COPY public/ ./public/
COPY scripts/ ./scripts/

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "src/server/index.js"]
