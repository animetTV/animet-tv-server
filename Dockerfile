FROM node:12

# app directory
WORKDIR /user/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
RUN npm install

# Bundel app source
COPY . .

EXPOSE 3001

CMD [ "node", "app/bin/www.js" ]