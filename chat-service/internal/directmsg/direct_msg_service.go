package directmsg

type DirectMsgService interface {
	SendMessage(msg *DirectMessageModel) error
	GetMessagesBetween(user1, user2 uint) ([]DirectMessageModel, error)
}

type directMsgService struct {
	repo DirectMsgRepository
}

func NewDirectMsgService(r DirectMsgRepository) DirectMsgService {
	return &directMsgService{repo: r}
}

func (s *directMsgService) SendMessage(msg *DirectMessageModel) error {
	return s.repo.Save(msg)
}

func (s *directMsgService) GetMessagesBetween(user1, user2 uint) ([]DirectMessageModel, error) {
	return s.repo.GetMessages(user1, user2)
}
