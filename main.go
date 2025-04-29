package main

import (
	"log"
	"net/http"
	"path/filepath"
)

func main() {
	// Configure server
	addr := "100.64.0.6:5173"
	distDir := "./dist" // Change if your build is elsewhere

	// File server for static assets
	assetsFS := http.FileServer(http.Dir(filepath.Join(distDir, "assets")))
	http.Handle("/assets/", http.StripPrefix("/assets/", assetsFS))

	// Serve index.html for all other routes
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    log.Println(r.URL)
		http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
	})

	// Start server
	log.Printf("Serving Vite app on http://%s\n", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}