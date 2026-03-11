package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	ServiceName  = "auth-svc"
	TelemetryURL = "http://localhost:8080/ingest"
	JWTSecret    = "cybermesh-enterprise-secret-2026"
)

type ChaosState struct {
	LatencyActive bool
	ErrorActive   bool
	mu            sync.RWMutex
}

var chaos = &ChaosState{}

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

type CircuitBreaker struct {
	Status      string // "Closed", "Open"
	Failures    int
	Successes   int
	LastFailure time.Time
	mu          sync.Mutex
}

var cb = &CircuitBreaker{Status: "Closed"}

func (c *CircuitBreaker) RecordResult(success bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if success {
		c.Successes++
		if c.Status == "Open" && time.Since(c.LastFailure) > 15*time.Second {
			c.Status = "Closed"
			c.Failures = 0
			c.Successes = 0
			reportCircuitStatus(ServiceName, "Closed")
		}
	} else {
		c.Failures++
		total := c.Failures + c.Successes
		if c.Status == "Closed" && total >= 5 && float64(c.Failures)/float64(total) > 0.5 {
			c.Status = "Open"
			c.LastFailure = time.Now()
			reportCircuitStatus(ServiceName, "Open")
		}
	}
}

func (c *CircuitBreaker) Allow() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.Status == "Open" {
		if time.Since(c.LastFailure) > 15*time.Second {
			return true
		}
		return false
	}
	return true
}

func reportCircuitStatus(serviceID, status string) {
	payload, _ := json.Marshal(map[string]string{
		"serviceId": serviceID,
		"status":    status,
	})
	http.Post(TelemetryURL+"/circuit", "application/json", bytes.NewBuffer(payload))
}

func withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
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
			return []byte(JWTSecret), nil
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
			CPUUsage:    8.0 + rand.Float64()*5.0,
			MemoryUsage: 32.0 + rand.Float64()*8.0,
			Connections: rand.Intn(50),
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

func handleValidate(w http.ResponseWriter, r *http.Request) {
	if !cb.Allow() {
		http.Error(w, "CIRCUIT_BREAKER_OPEN", http.StatusServiceUnavailable)
		return
	}

	start := time.Now()
	traceID := r.Header.Get("X-Trace-ID")

	chaos.mu.RLock()
	if chaos.LatencyActive { time.Sleep(time.Duration(300+rand.Intn(1000)) * time.Millisecond) }
	isError := chaos.ErrorActive && rand.Float64() > 0.7
	chaos.mu.RUnlock()

	if isError {
		cb.RecordResult(false)
		http.Error(w, "Internal Error", http.StatusInternalServerError)
		return
	}

	orderReq, _ := http.NewRequest("POST", "http://localhost:8083/create", nil)
	orderReq.Header.Set("X-Trace-ID", traceID)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(orderReq)

	if err != nil || resp.StatusCode != http.StatusOK {
		cb.RecordResult(false)
		http.Error(w, "Downstream Orders Failure", http.StatusServiceUnavailable)
		return
	}

	cb.RecordResult(true)
	duration := float64(time.Since(start).Milliseconds())
	reportTrace(Trace{
		TraceID:  traceID,
		SpanID:   "span-auth-validation",
		ParentID: "span-root",
		Service:  ServiceName,
		Duration: duration,
	})

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Validated: %s", traceID)
}

func handleChaos(w http.ResponseWriter, r *http.Request) {
	var cmd struct { Type string `json:"type"`; Active bool `json:"active"` }
	json.NewDecoder(r.Body).Decode(&cmd)
	chaos.mu.Lock()
	switch cmd.Type {
	case "latency": chaos.LatencyActive = cmd.Active
	case "error": chaos.ErrorActive = cmd.Active
	case "reset": chaos.LatencyActive = false; chaos.ErrorActive = false; cb.Status = "Closed"
	}
	chaos.mu.Unlock()
	w.WriteHeader(http.StatusOK)
}

func main() {
	rand.Seed(time.Now().UnixNano())
	go reportMetrics()
	http.HandleFunc("/validate", handleValidate)
	http.HandleFunc("/admin/chaos", withAuth(handleChaos))
	fmt.Println("Auth Service starting on :8082 (SECURED)...")
	log.Fatal(http.ListenAndServe(":8082", nil))
}
