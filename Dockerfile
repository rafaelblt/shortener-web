# Build stage: the dependencies, which the build needs, and the build of the app.
FROM node:24-alpine AS build

WORKDIR /app

# Dependencies first, so a change to the code doesn't install them again.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Both builds: the server serves the app on the back ends, or the simulation with SIMULATION=true.
RUN npm run build && npm run build:simulation

# Runtime stage: Node, the server and the builds of the app. The server imports no package, and
# Node runs its TypeScript as it is, so there is no node_modules and no build of the server.
# package.json stays, since it says the modules are ES modules.
FROM node:24-alpine AS runtime

WORKDIR /app

COPY package.json ./
COPY server ./server
COPY --from=build /app/dist ./dist

# node, the user the image has for it, rather than root.
USER node

# Documentation only: the server listens on PORT, 3000 by default.
EXPOSE 3000

CMD ["node", "server/main.ts"]
