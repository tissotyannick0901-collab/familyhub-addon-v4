FROM node:20-alpine

RUN apk add --no-cache nginx jq bash

RUN mkdir -p /app/www /data /tmp

COPY server/package.json /app/package.json
WORKDIR /app
RUN npm install --production --no-optional

COPY server/server.js  /app/server.js
COPY nginx.conf        /etc/nginx/nginx.conf
COPY run.sh            /run.sh
COPY www/              /app/www/

RUN chmod +x /run.sh

EXPOSE 8099 3001

CMD ["/run.sh"]

LABEL io.hass.name="FamilyHub" \
      io.hass.type="addon" \
      io.hass.version="4.0.0"
