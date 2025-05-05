package channel

type ChannelService interface {
	GetAll() ([]ChannelModel, error)
	Create(server ChannelModel) (ChannelModel, error)
	Update(id uint, server ChannelModel) (ChannelModel, error)
	Delete(id uint) error
}

type serverService struct {
	repo ChannelRepository
}

func NewChannelService(repo ChannelRepository) ChannelService {
	return &serverService{repo}
}

func (s *serverService) GetAll() ([]ChannelModel, error) {
	return s.repo.FindAll()
}

func (s *serverService) Create(server ChannelModel) (ChannelModel, error) {
	err := s.repo.Create(&server)
	return server, err
}
func (s *serverService) Update(id uint, server ChannelModel) (ChannelModel, error) {
	updatedServer, err := s.repo.Update(id, &server)
	return *updatedServer, err
}

func (s *serverService) Delete(id uint) error {
	return s.repo.Delete(id)
}
