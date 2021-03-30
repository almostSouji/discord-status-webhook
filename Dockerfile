FROM node:15-alpine
LABEL name "discord-status-webhook"
LABEL version "0.0.0"
LABEL maintainer "almostSouji <https://github.com/almostSouji>"
ENV DISCORD_WEBHOOK_ID=\
	DISCORD_WEBHOOK_TOKEN=\
	FORCE_COLOR=1
WORKDIR /usr/slashy
COPY package.json ./
RUN apk add --update \
	&& apk add --no-cache ca-certificates \
	&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
	&& npm i \
	&& apk del .build-deps
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]