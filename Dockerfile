FROM node:20-alpine as build

RUN apk update && apk add git

WORKDIR /app

COPY . .

RUN npm install -g pnpm@latest-10

RUN pnpm install --frozen-lockfile --ignore-scripts --prod --no-interactive

RUN pnpm build

FROM nginx:1.19

COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html
