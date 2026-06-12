FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm install

COPY . .

EXPOSE 7860
ENV PORT=7860

CMD ["npm", "start"]
