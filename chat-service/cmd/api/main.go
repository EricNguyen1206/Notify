package main

import (
	"chat-service/internal/router"

	"log"
)

func main() {
	application, err := router.NewApp()
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}

	if err := application.Run(); err != nil {
		log.Fatalf("Application error: %v", err)
	}
}
