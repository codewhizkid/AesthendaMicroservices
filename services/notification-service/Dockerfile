FROM node:16-alpine

WORKDIR /app

# Create .firebase directory
RUN mkdir -p /app/.firebase

COPY package*.json ./
COPY .env* ./
COPY .firebase/* /app/.firebase/

RUN npm install

COPY . .

EXPOSE 5003

CMD ["npm", "run", "dev"] 