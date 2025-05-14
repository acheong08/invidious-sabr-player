# Stage 1: Build frontend (Node)
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build Go server
FROM golang:1.22-alpine AS go-build
WORKDIR /app
COPY --from=frontend-build /app/dist ./dist
COPY . .
RUN go build . -o serve-frontend

# Stage 3: Final image
FROM denoland/deno:alpine-1.44.3 AS runtime
WORKDIR /app

# Copy Go binary and frontend assets
COPY --from=go-build /app/serve-frontend .
COPY --from=go-build /app/dist ./dist

# Copy Deno proxy
COPY proxy/deno.ts ./deno.ts

# Expose both ports
EXPOSE 5173
EXPOSE 8080

# Entrypoint: run both servers
CMD ["sh", "-c", "./serve-frontend & deno run --allow-net --allow-read --allow-write deno.ts"]
