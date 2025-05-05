package channel

import "gorm.io/gorm"

type ChannelRepository interface {
	FindAll() ([]ChannelModel, error)
	Create(server *ChannelModel) error
	Update(id uint, updated *ChannelModel) (*ChannelModel, error)
	Delete(id uint) error
}

type serverRepository struct {
	db *gorm.DB
}

func NewChannelRepository(db *gorm.DB) ChannelRepository {
	return &serverRepository{db}
}

func (r *serverRepository) FindAll() ([]ChannelModel, error) {
	var servers []ChannelModel
	err := r.db.Find(&servers).Error
	return servers, err
}

func (r *serverRepository) Create(server *ChannelModel) error {
	return r.db.Create(server).Error
}

func (r *serverRepository) Update(id uint, updated *ChannelModel) (*ChannelModel, error) {
	var server ChannelModel
	if err := r.db.First(&server, id).Error; err != nil {
		return nil, err
	}
	server.Name = updated.Name
	server.Host = updated.Host
	if err := r.db.Save(&server).Error; err != nil {
		return nil, err
	}
	return &server, nil
}

func (r *serverRepository) Delete(id uint) error {
	return r.db.Delete(&ChannelModel{}, id).Error
}
