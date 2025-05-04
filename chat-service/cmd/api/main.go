package main

import (
	"chat-service/internal/server"
	"log"
)

func main() {
	application, err := server.NewApp()
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}

	if err := application.Run(); err != nil {
		log.Fatalf("Application error: %v", err)
	}
}
