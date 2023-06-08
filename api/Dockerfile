FROM alpine AS cache
RUN apk add -U --no-cache ca-certificates

FROM scratch as base
COPY ./static/ /app/static
COPY --from=cache /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

WORKDIR /app/

FROM base as amd64
COPY ./target/x86_64-unknown-linux-musl/release/api /app/gateway

FROM base as armv7
COPY ./target/armv7-unknown-linux-musleabihf/release/api /app/gateway

FROM base as arm64
COPY ./target/aarch64-unknown-linux-musl/release/api /app/gateway

FROM ${TARGETARCH}${TARGETVARIANT} as final


EXPOSE 8000
CMD ["./gateway"]