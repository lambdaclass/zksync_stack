FROM oven/bun:latest

COPY ./package.json ./
COPY ./monitor.ts ./

RUN bun install

ENTRYPOINT [ "bun", "run", "monitor.ts" ]
