FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["npx", "next", "dev", "-p", "3000"]
