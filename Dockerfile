# Stage 1: Build
FROM node:22-alpine AS builder
ARG APP_NAME=sfa
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx nx build ${APP_NAME} --configuration=production

# Stage 2: Serve
FROM nginx:alpine
ARG APP_NAME=sfa
COPY --from=builder /app/dist/apps/${APP_NAME}/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
