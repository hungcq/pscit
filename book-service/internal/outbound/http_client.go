package outbound

import (
	"net/http"
	"time"
)

var httpClient http.Client

func InitHttpClient() {
	httpClient = http.Client{Timeout: time.Duration(3) * time.Second}
}
