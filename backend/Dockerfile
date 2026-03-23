FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install

COPY . .
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

CMD ["npm", "run", "start:docker"]
