# start from bun
FROM oven/bun:1-debian

# work from the volume directory
WORKDIR /app

# watch for changes and run the server
CMD bun install; \
    bun --watch run index.ts