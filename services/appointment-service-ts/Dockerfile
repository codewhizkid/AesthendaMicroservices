FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build TypeScript
# # RUN npm run build

EXPOSE 5002

CMD ["npm", "run", "dev"] 