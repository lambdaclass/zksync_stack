FROM oven/bun:latest

COPY ../package.json ./
COPY ../bun.lockb ./

COPY ../scripts/loadTester.ts ./

RUN bun install

ENTRYPOINT [ "bun", "run", "loadTester.ts" ]
