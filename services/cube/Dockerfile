FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY cube.js ./
COPY model/ ./model/

EXPOSE 4000

CMD ["npx", "cubejs-server"]
