FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY lib ./lib
COPY public ./public
RUN mkdir -p /app/data
VOLUME /app/data
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
