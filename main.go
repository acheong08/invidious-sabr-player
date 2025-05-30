package main

import (
	"flag"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"path/filepath"
)

func main() {
	// Configure server
	addr := flag.String("addr", "0.0.0.0:5173", "server address")
	flag.Parse()

	distDir := "./dist" // Change if your build is elsewhere

	// File server for static assets
	assetsFS := http.FileServer(http.Dir(filepath.Join(distDir, "assets")))
	http.Handle("/assets/", http.StripPrefix("/assets/", assetsFS))

	// Serve index.html for all other routes
	http.HandleFunc("/watch/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
	})
	target, _ := url.Parse("http://127.0.0.1:8080")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxyPaths := []string{
		"/iframe_api",
		"/s/",
		"/youtubei/",
		"/videoplayback",
		"/api/",
		"/sw.js_data",
	}
	for _, path := range proxyPaths {
		http.HandleFunc(path, proxy.ServeHTTP)
	}

	// Start server
	log.Printf("Serving Vite app on http://%s\n", *addr)
	log.Fatal(http.ListenAndServe(*addr, nil))
}
