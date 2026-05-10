# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx nx build sfa --configuration=production

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist/apps/sfa/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
