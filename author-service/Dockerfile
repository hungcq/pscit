FROM golang:1.20

WORKDIR /app
COPY . ./
RUN go mod download

EXPOSE 80

RUN CGO_ENABLED=0 GOOS=linux go build -o /author-service cmd/main.go

CMD ["/author-service"]