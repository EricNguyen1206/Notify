package server

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrServerNotFound = errors.New("server not found")
	ErrNotAuthorized  = errors.New("not authorized")
	ErrAlreadyMember  = errors.New("user is already a member")
	ErrNotMember      = errors.New("user is not a member")
)

type ServerService interface {
	CreateServer(ctx context.Context, ownerID string, req *CreateServerRequest) (*ServerResponse, error)
	GetServer(ctx context.Context, id string) (*ServerResponse, error)
	GetUserServers(ctx context.Context, userID string) ([]*ServerResponse, error)
	UpdateServer(ctx context.Context, id string, ownerID string, req *UpdateServerRequest) (*ServerResponse, error)
	DeleteServer(ctx context.Context, id string, ownerID string) error
	JoinServer(ctx context.Context, userID string, req *JoinServerRequest) error
	LeaveServer(ctx context.Context, serverID string, userID string) error
	GetServerMembers(ctx context.Context, serverID string) ([]*JoinServerResponse, error)
}

type serverService struct {
	repo ServerRepository
}

func NewServerService(repo ServerRepository) ServerService {
	return &serverService{repo: repo}
}

func (s *serverService) CreateServer(ctx context.Context, ownerID string, req *CreateServerRequest) (*ServerResponse, error) {
	server := &Server{
		ID:      uuid.New().String(),
		Name:    req.Name,
		Owner:   ownerID,
		Avatar:  req.Avatar,
		Created: time.Now(),
	}

	if err := s.repo.Create(ctx, server); err != nil {
		return nil, err
	}

	// Auto-join the owner to the server
	join := &JoinServer{
		ID:         uuid.New().String(),
		ServerID:   server.ID,
		UserID:     ownerID,
		JoinedDate: time.Now(),
	}

	if err := s.repo.JoinServer(ctx, join); err != nil {
		return nil, err
	}

	return &ServerResponse{
		ID:      server.ID,
		Name:    server.Name,
		Owner:   server.Owner,
		Avatar:  server.Avatar,
		Created: server.Created,
	}, nil
}

func (s *serverService) GetServer(ctx context.Context, id string) (*ServerResponse, error) {
	server, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrServerNotFound
	}

	members, err := s.repo.GetServerMembers(ctx, id)
	if err != nil {
		return nil, err
	}

	memberResponses := make([]JoinServerResponse, len(members))
	for i, member := range members {
		memberResponses[i] = JoinServerResponse{
			ID:         member.ID,
			ServerID:   member.ServerID,
			UserID:     member.UserID,
			JoinedDate: member.JoinedDate,
		}
	}

	return &ServerResponse{
		ID:      server.ID,
		Name:    server.Name,
		Owner:   server.Owner,
		Avatar:  server.Avatar,
		Created: server.Created,
		Members: memberResponses,
	}, nil
}

func (s *serverService) GetUserServers(ctx context.Context, userID string) ([]*ServerResponse, error) {
	joins, err := s.repo.GetUserServers(ctx, userID)
	if err != nil {
		return nil, err
	}

	var servers []*ServerResponse
	for _, join := range joins {
		server, err := s.repo.FindByID(ctx, join.ServerID)
		if err != nil {
			continue
		}

		servers = append(servers, &ServerResponse{
			ID:      server.ID,
			Name:    server.Name,
			Owner:   server.Owner,
			Avatar:  server.Avatar,
			Created: server.Created,
		})
	}

	return servers, nil
}

func (s *serverService) UpdateServer(ctx context.Context, id string, ownerID string, req *UpdateServerRequest) (*ServerResponse, error) {
	server, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrServerNotFound
	}

	if server.Owner != ownerID {
		return nil, ErrNotAuthorized
	}

	server.Name = req.Name
	server.Avatar = req.Avatar

	if err := s.repo.Update(ctx, server); err != nil {
		return nil, err
	}

	return &ServerResponse{
		ID:      server.ID,
		Name:    server.Name,
		Owner:   server.Owner,
		Avatar:  server.Avatar,
		Created: server.Created,
	}, nil
}

func (s *serverService) DeleteServer(ctx context.Context, id string, ownerID string) error {
	server, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return ErrServerNotFound
	}

	if server.Owner != ownerID {
		return ErrNotAuthorized
	}

	return s.repo.Delete(ctx, id)
}

func (s *serverService) JoinServer(ctx context.Context, userID string, req *JoinServerRequest) error {
	// Check if server exists
	_, err := s.repo.FindByID(ctx, req.ServerID)
	if err != nil {
		return ErrServerNotFound
	}

	// Check if already a member
	isMember, err := s.repo.IsMember(ctx, req.ServerID, userID)
	if err != nil {
		return err
	}
	if isMember {
		return ErrAlreadyMember
	}

	join := &JoinServer{
		ID:         uuid.New().String(),
		ServerID:   req.ServerID,
		UserID:     userID,
		JoinedDate: time.Now(),
	}

	return s.repo.JoinServer(ctx, join)
}

func (s *serverService) LeaveServer(ctx context.Context, serverID string, userID string) error {
	// Check if server exists
	server, err := s.repo.FindByID(ctx, serverID)
	if err != nil {
		return ErrServerNotFound
	}

	// Owner cannot leave the server
	if server.Owner == userID {
		return ErrNotAuthorized
	}

	// Check if member
	isMember, err := s.repo.IsMember(ctx, serverID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return ErrNotMember
	}

	return s.repo.LeaveServer(ctx, serverID, userID)
}

func (s *serverService) GetServerMembers(ctx context.Context, serverID string) ([]*JoinServerResponse, error) {
	members, err := s.repo.GetServerMembers(ctx, serverID)
	if err != nil {
		return nil, err
	}

	var responses []*JoinServerResponse
	for _, member := range members {
		responses = append(responses, &JoinServerResponse{
			ID:         member.ID,
			ServerID:   member.ServerID,
			UserID:     member.UserID,
			JoinedDate: member.JoinedDate,
		})
	}

	return responses, nil
}
