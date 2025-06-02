package repository

import (
	"context"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

type PresenceRepository struct {
	client *redis.Client
}

func NewPresenceRepository(client *redis.Client) *PresenceRepository {
	return &PresenceRepository{client: client}
}

// SetOnline - Key: "presence:{userID}", TTL: 5 phút
func (r *PresenceRepository) SetOnline(userID string) error {
	ctx := context.Background()
	return r.client.Set(ctx, "presence:"+userID, "online", 5*time.Minute).Err()
}

// SetOffline - Đánh dấu offline, nhưng giữ key trong 1 phút (tránh flicker)
func (r *PresenceRepository) SetOffline(userID string) error {
	ctx := context.Background()
	return r.client.Set(ctx, "presence:"+userID, "offline", 1*time.Minute).Err()
}

// GetStatus - Kiểm tra trạng thái user
func (r *PresenceRepository) GetStatus(userID string) (string, error) {
	ctx := context.Background()
	return r.client.Get(ctx, "presence:"+userID).Result()
}

// GetOnlineFriends - Lấy danh sách bạn bè online
func (r *PresenceRepository) GetOnlineFriends(userIDs []uint) ([]uint, error) {
	ctx := context.Background()
	keys := make([]string, len(userIDs))
	for i, id := range userIDs {
		keys[i] = "presence:" + strconv.Itoa(int(id))
	}

	// Pipeline để giảm roundtrip
	cmds, err := r.client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		for _, key := range keys {
			pipe.Get(ctx, key)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	onlineUsers := make([]uint, 0)
	for i, cmd := range cmds {
		if val, _ := cmd.(*redis.StringCmd).Result(); val == "online" {
			onlineUsers = append(onlineUsers, userIDs[i])
		}
	}
	return onlineUsers, nil
}
