package directmsg

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DirectMessageModel struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	SenderID   uint               `bson:"sender_id"`
	ReceiverID uint               `bson:"receiver_id"`
	Content    string             `bson:"content"`
	ImageURL   *string            `bson:"image_url,omitempty"`
	CreatedAt  time.Time          `bson:"created_at"`
}
