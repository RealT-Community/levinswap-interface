FROM node:20-alpine as build

RUN apk update && apk add git

WORKDIR /app

COPY . .

RUN npm install -g pnpm@latest-10

RUN pnpm install --frozen-lockfile --prod --ignore-scripts --force

RUN pnpm build

FROM nginx:1.19-alpine
COPY --from=build /app/out /usr/share/nginx/html
COPY --from=build /app/public/images /usr/share/nginx/html/images

