package main

import (
	"chat-service/internal/controllers"
	"log"
)

func main() {
	application, err := controllers.NewApp()
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}

	if err := application.Run(); err != nil {
		log.Fatalf("Application error: %v", err)
	}
}
