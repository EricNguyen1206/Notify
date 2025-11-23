import { Router } from 'express';
import { ConversationController } from '@/controllers/conversation.controller';
import { validateDto } from '@/middleware/validation.middleware';
import {
  CreateConversationRequestDto,
  UpdateConversationRequestDto,
  ConversationMembershipRequest,
} from '@notify/validators';

const router = Router();
const conversationController = new ConversationController();

// GET /api/v1/conversations
router.get('/', conversationController.getUserConversations);

// POST /api/v1/conversations
router.post('/', validateDto(CreateConversationRequestDto), conversationController.createConversation);

// GET /api/v1/conversations/:id
router.get('/:id', conversationController.getConversationById);

// PUT /api/v1/conversations/:id
router.put('/:id', validateDto(UpdateConversationRequestDto), conversationController.updateConversation);

// DELETE /api/v1/conversations/:id
router.delete('/:id', conversationController.deleteConversation);

// POST /api/v1/conversations/:id/user
router.post(
  '/:id/user',
  validateDto(ConversationMembershipRequest),
  conversationController.addUserToConversation
);

// PUT /api/v1/conversations/:id/user
router.put('/:id/user', conversationController.leaveConversation);

// DELETE /api/v1/conversations/:id/user
router.delete(
  '/:id/user',
  validateDto(ConversationMembershipRequest),
  conversationController.removeUserFromConversation
);

export { router as conversationRoutes };
