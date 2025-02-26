package main

import (
    "bytes"
    "image"
    _ "image/jpeg"
    _ "image/png"
    "os"
    "log"
    "context"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "go.mongodb.org/mongo-driver/mongo/gridfs"
    "github.com/chai2010/webp"
)

func readImage(filePath string) (image.Image, error) {
    file, err := os.Open(filePath)
    if err != nil {
        return nil, err
    }
    defer file.Close()

    img, _, err := image.Decode(file)
    if err != nil {
        return nil, err
    }
    return img, nil
}

func convertToWebP(img image.Image) ([]byte, error) {
	var buf bytes.Buffer
	if err := webp.Encode(&buf, img, &webp.Options{Lossless: true}); err != nil {
			return nil, err
	}
	return buf.Bytes(), nil
}

func uploadImageToGridFS(db *mongo.Database, imageBytes []byte, fileName string) error {
	fsFiles, err := gridfs.NewBucket(db).OpenUploadStream(fileName)
	if err != nil {
			return err
	}
	defer fsFiles.Close()

	_, err = fsFiles.Write(imageBytes)
	if err != nil {
			return err
	}

	log.Println("Image uploaded successfully!")
	return nil
}


func main() {
	// Connect to MongoDB
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
			log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	db := client.Database("your_database_name")

	// Read and convert the image
	img, err := readImage("path/to/your/image.jpg")
	if err != nil {
			log.Fatal(err)
	}

	webpBytes, err := convertToWebP(img)
	if err != nil {
			log.Fatal(err)
	}

	// Upload the WebP image to MongoDB
	if err := uploadImageToGridFS(db, webpBytes, "your_image_name.webp"); err != nil {
			log.Fatal(err)
	}
}
