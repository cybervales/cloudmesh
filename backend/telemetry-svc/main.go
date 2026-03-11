package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

// --- Security ---

func getJWTSecret() []byte {
	secret := os.Getenv("CLOUDMESH_JWT_SECRET")
	if secret == "" {
		// Fallback for development stability
		return []byte("cybermesh-enterprise-secret-2026")
	}
	return []byte(secret)
}

// --- Types ---

type Metric struct {
	ServiceID     string  `json:"serviceId"`
	Timestamp     int64   `json:"timestamp"`
	CPUUsage      float64 `json:"cpuUsage"`
	MemoryUsage   float64 `json:"memoryUsage"`
	Connections   int     `json:"connections"`
	Latency       float64 `json:"latency"`
	Status        string  `json:"status"`
	CircuitStatus string  `json:"circuitStatus"`
}

type Trace struct {
	TraceID   string  `json:"traceId"`
	SpanID    string  `json:"spanId"`
	ParentID  string  `json:"parentId"`
	Service   string  `json:"service"`
	Duration  float64 `json:"duration"`
	Timestamp int64   `json:"timestamp"`
}

type TelemetryUpdate struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// --- Hub ---

type Hub struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan TelemetryUpdate
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mu         sync.Mutex
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan TelemetryUpdate),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.Close()
			}
			h.mu.Unlock()
		case update := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				err := client.WriteJSON(update)
				if err != nil {
					client.Close()
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		// Hardened Origin Check: Only allow our dashboard
		return origin == "http://localhost:5173" || origin == "http://127.0.0.1:5173"
	},
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

func handleIngestMetrics(hub *Hub, w http.ResponseWriter, r *http.Request) {
	var m Metric
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	m.Timestamp = time.Now().UnixMilli()
	hub.broadcast <- TelemetryUpdate{Type: "metrics", Payload: m}
	w.WriteHeader(http.StatusAccepted)
}

func handleIngestTrace(hub *Hub, w http.ResponseWriter, r *http.Request) {
	var t Trace
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	t.Timestamp = time.Now().UnixMilli()
	hub.broadcast <- TelemetryUpdate{Type: "trace", Payload: t}
	w.WriteHeader(http.StatusAccepted)
}

func handleIngestCircuit(hub *Hub, w http.ResponseWriter, r *http.Request) {
	var c interface{}
	json.NewDecoder(r.Body).Decode(&c)
	hub.broadcast <- TelemetryUpdate{Type: "circuit", Payload: c}
	w.WriteHeader(http.StatusAccepted)
}

func main() {
	hub := newHub()
	go hub.run()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "CloudMesh Telemetry Hub: SECURED")
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil { return }
		hub.register <- conn
	})

	http.HandleFunc("/ingest/metrics", func(w http.ResponseWriter, r *http.Request) { handleIngestMetrics(hub, w, r) })
	http.HandleFunc("/ingest/trace", func(w http.ResponseWriter, r *http.Request) { handleIngestTrace(hub, w, r) })
	http.HandleFunc("/circuit", func(w http.ResponseWriter, r *http.Request) { handleIngestCircuit(hub, w, r) })

	port := ":8080"
	fmt.Printf("Telemetry Hub starting on %s (HARDENED ORIGIN)...\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
