package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	ServiceName  = "inventory-svc"
	TelemetryURL = "http://localhost:8080/ingest"
)

type ChaosState struct {
	LatencyActive bool
	ErrorActive   bool
	mu            sync.RWMutex
}

var chaos = &ChaosState{}

func getJWTSecret() []byte {
	secret := os.Getenv("CLOUDMESH_JWT_SECRET")
	if secret == "" {
		return []byte("cybermesh-enterprise-secret-2026")
	}
	return []byte(secret)
}

type Metric struct {
	ServiceID   string  `json:"serviceId"`
	CPUUsage    float64 `json:"cpuUsage"`
	MemoryUsage float64 `json:"memoryUsage"`
	Connections int     `json:"connections"`
	Status      string  `json:"status"`
}

type Trace struct {
	TraceID  string  `json:"traceId"`
	SpanID   string  `json:"spanId"`
	ParentID string  `json:"parentId"`
	Service  string  `json:"service"`
	Duration float64 `json:"duration"`
}

func withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "UNAUTHORIZED", http.StatusUnauthorized)
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return getJWTSecret(), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "INVALID_TOKEN", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

func reportMetrics() {
	for {
		time.Sleep(2 * time.Second)
		status := "online"
		chaos.mu.RLock()
		if chaos.ErrorActive { status = "degraded" }
		chaos.mu.RUnlock()

		m := Metric{
			ServiceID:   ServiceName,
			CPUUsage:    5.0 + rand.Float64()*10.0,
			MemoryUsage: 25.0 + rand.Float64()*5.0,
			Connections: rand.Intn(40),
			Status:      status,
		}
		payload, _ := json.Marshal(m)
		http.Post(TelemetryURL+"/metrics", "application/json", bytes.NewBuffer(payload))
	}
}

func reportTrace(t Trace) {
	payload, _ := json.Marshal(t)
	http.Post(TelemetryURL+"/trace", "application/json", bytes.NewBuffer(payload))
}

func handleCheck(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	traceID := r.Header.Get("X-Trace-ID")

	chaos.mu.RLock()
	if chaos.LatencyActive { time.Sleep(time.Duration(200+rand.Intn(500)) * time.Millisecond) }
	isError := chaos.ErrorActive && rand.Float64() > 0.9
	chaos.mu.RUnlock()

	if isError {
		http.Error(w, "Inventory Depleted", http.StatusInternalServerError)
		return
	}

	time.Sleep(time.Duration(5+rand.Intn(20)) * time.Millisecond)
	duration := float64(time.Since(start).Milliseconds())
	reportTrace(Trace{
		TraceID:  traceID,
		SpanID:   "span-inventory-check",
		ParentID: "span-order-creation",
		Service:  ServiceName,
		Duration: duration,
	})

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Inventory OK: %s", traceID)
}

func handleChaos(w http.ResponseWriter, r *http.Request) {
	var cmd struct { Type string `json:"type"`; Active bool `json:"active"` }
	json.NewDecoder(r.Body).Decode(&cmd)
	chaos.mu.Lock()
	switch cmd.Type {
	case "latency": chaos.LatencyActive = cmd.Active
	case "error": chaos.ErrorActive = cmd.Active
	case "reset": chaos.LatencyActive = false; chaos.ErrorActive = false
	}
	chaos.mu.Unlock()
	w.WriteHeader(http.StatusOK)
}

func main() {
	rand.Seed(time.Now().UnixNano())
	go reportMetrics()
	http.HandleFunc("/check", handleCheck)
	http.HandleFunc("/admin/chaos", withAuth(handleChaos))
	fmt.Println("Inventory Service starting on :8084 (HARDENED)...")
	log.Fatal(http.ListenAndServe(":8084", nil))
}
