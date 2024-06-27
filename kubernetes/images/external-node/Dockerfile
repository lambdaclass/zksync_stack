FROM node:18-buster

RUN apt-get update && \
    apt-get install -y git

WORKDIR /app

RUN git clone https://github.com/matter-labs/dapp-portal.git /app

RUN npm install

COPY . .

EXPOSE 3000

# This is the development configuration, we need to use the production one for
# real purposes.
CMD ["npm", "run", "dev"]

