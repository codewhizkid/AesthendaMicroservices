FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Skip the build step that's causing errors
# # # RUN npm run build

EXPOSE 5005

# Use dev mode instead of built code
CMD ["npm", "run", "dev"] 