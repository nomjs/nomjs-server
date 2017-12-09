FROM node:8.9.2-alpine

RUN apk add --no-cache python build-base git && \
    npm install -g gulp && \
    echo "npm install && gulp" > /run.sh && \
    chmod +x /run.sh

WORKDIR /nomjs-server

CMD ["/run.sh"]
