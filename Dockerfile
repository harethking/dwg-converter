FROM node:20-bookworm

# نبني LibreDWG 0.13.3 من المصدر الرسمي (حزمة apt غير متوفرة في Debian الحالية)
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential curl ca-certificates xz-utils \
 && curl -sSL -o /tmp/libredwg.tar.xz \
      https://github.com/LibreDWG/libredwg/releases/download/0.13.3/libredwg-0.13.3.tar.xz \
 && mkdir -p /tmp/libredwg-src \
 && tar -xJf /tmp/libredwg.tar.xz -C /tmp/libredwg-src --strip-components=1 \
 && cd /tmp/libredwg-src \
 && ./configure --disable-bindings --disable-werror --prefix=/usr/local \
 && make \
 && make install \
 && ldconfig \
 && cd / \
 && rm -rf /tmp/libredwg-src /tmp/libredwg.tar.xz \
 && apt-get purge -y build-essential xz-utils \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
