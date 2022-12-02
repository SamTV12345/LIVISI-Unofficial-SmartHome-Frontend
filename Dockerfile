FROM node as builder

ARG REACT_APP_SERVER_URL
ENV REACT_APP_SERVER_URL=$REACT_APP_SERVER_URL
WORKDIR /usr/src/app
COPY ./ ./
RUN npm install
RUN npm run build


FROM nginx:stable-alpine as runner


COPY --from=builder /usr/src/app/build /usr/share/nginx/html/

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
