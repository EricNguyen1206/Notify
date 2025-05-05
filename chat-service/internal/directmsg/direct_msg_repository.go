package directmsg

import (
	"chat-service/configs/database"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DirectMsgRepository struct {
	// Save(msg *DirectMessageModel) error
	// GetMessages(user1, user2 uint) ([]DirectMessageModel, error)
	db *database.MongoDB
}

func NewDirectMsgRepo(mongoDB *database.MongoDB) DirectMsgRepository {
	return DirectMsgRepository{db: mongoDB}
}

func (r *DirectMsgRepository) Save(msg *DirectMessageModel) error {
	msg.CreatedAt = time.Now()
	coll := r.db.Client.Database("chat_app").Collection("messages")
	_, err := coll.InsertOne(context.Background(), msg)
	return err
}

func (r *DirectMsgRepository) GetMessages(user1, user2 uint) ([]DirectMessageModel, error) {
	coll := r.db.Client.Database("chat_app").Collection("messages")
	filter := bson.M{
		"$or": []bson.M{
			{"sender_id": user1, "receiver_id": user2},
			{"sender_id": user2, "receiver_id": user1},
		},
	}
	opts := options.Find().SetSort(bson.D{{"created_at", 1}})
	cur, err := coll.Find(context.Background(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(context.Background())

	var messages []DirectMessageModel
	if err := cur.All(context.Background(), &messages); err != nil {
		return nil, err
	}
	return messages, nil
}
