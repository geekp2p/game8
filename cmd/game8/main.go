package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"
)

func staticFS() http.FileSystem {
	// รองรับทั้งการรันจากรากโปรเจกต์ และจากโฟลเดอร์ cmd/game8
	candidates := []string{
		filepath.FromSlash("web/game8"),       // รันจากรากโปรเจกต์
		filepath.FromSlash("../../web/game8"), // รันจาก cmd/game8
	}
	for _, p := range candidates {
		if st, err := os.Stat(p); err == nil && st.IsDir() {
			log.Println("[game8] dev mode: serving from", p)
			return http.Dir(p)
		}
	}
	log.Fatal("[game8] cannot find web/game8 directory")
	return nil
}

func main() {
	mux := http.NewServeMux()

	// เสิร์ฟไฟล์เกม
	mux.Handle("/", http.FileServer(staticFS()))

	// จุดต่อยอด: API สถานะเกม/องค์ประกอบ world (เผื่อ sync P2P ภายหลัง)
	mux.HandleFunc("/api/ping", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"ok":true}`))
	})

	srv := &http.Server{
		Addr:              ":8082",
		Handler:           logMiddleware(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	// start server
	go func() {
		log.Println("[game8] starting on http://localhost:8082")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	// graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	log.Println("[game8] shutdown")
}

func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Truncate(time.Millisecond))
	})
}
