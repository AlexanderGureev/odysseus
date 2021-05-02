FROM node:14 AS builder

WORKDIR /app
COPY . .
RUN yarn install && yarn build

FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf /etc/nginx/conf.d
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]