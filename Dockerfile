FROM node:20-bookworm-slim

# أداة dwg2dxf من مكتبة LibreDWG
RUN apt-get update \
 && apt-get install -y --no-install-recommends libredwg-tools \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
