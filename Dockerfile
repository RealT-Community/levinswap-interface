FROM node:16.15.0-alpine as build 

# Install git
RUN apk update && apk add git

WORKDIR /app

COPY . .

RUN yarn install

RUN yarn build

FROM nginx:1.19

COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html
