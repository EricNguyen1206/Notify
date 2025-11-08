import { useState } from "react";
import { toast } from "react-toastify";

import { usePostChannels } from "@/services/endpoints/channels/channels";
import type {
  ChatServiceInternalModelsCreateChannelRequest,
  ChatServiceInternalModelsUserResponse,
} from "@/services/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { EnhancedConversation, useConversationStore } from "@/store/useConversationStore";

interface UseCreateConversationOptions {
  onSuccess?: (conversation: EnhancedConversation) => void;
  onError?: (error: any) => void;
  showToast?: boolean;
  defaultType?: "group" | "direct";
}

interface CreateConversationFormData {
  name: string;
  type: "group" | "direct";
  selectedUsers: ChatServiceInternalModelsUserResponse[];
}

export const useCreateConversation = (options: UseCreateConversationOptions = {}) => {
  const { onSuccess, onError, showToast = true, defaultType = "group" } = options;

  const { user } = useAuthStore((state) => state);
  const { addGroupConversation, addDirectConversation } = useConversationStore((state) => state);

  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateConversationFormData>({
    name: "",
    type: defaultType,
    selectedUsers: [],
  });

  const postConversationMutation = usePostChannels({
    mutation: {
      onSuccess: (data) => {
        if (showToast) {
          toast.success("Conversation created successfully");
        }

        // Transform API response to EnhancedConversation format
        const newConversation: EnhancedConversation = {
          id: data.data.id!,
          name: data.data.name!,
          ownerId: data.data.ownerId!,
          type: formData.type,
          avatar: "",
          lastActivity: new Date(),
          unreadCount: 0,
          members: [],
        };

        // Add to appropriate conversation list in store
        if (newConversation.type === "group") {
          addGroupConversation(newConversation);
        } else {
          addDirectConversation(newConversation);
        }

        // Reset form
        resetForm();
        setLoading(false);

        // Call custom success callback
        onSuccess?.(newConversation);
      },
      onError: (error) => {
        if (showToast) {
          toast.error("Failed to create conversation");
        }
        setLoading(false);
        onError?.(error);
      },
    },
  });

  const validateForm = (data: CreateConversationFormData): string | null => {
    if (!data.name.trim() && data.type === "group") {
      return "Please enter a conversation name";
    }

    if (data.name.length > 0 && data.name.length < 2) {
      return "Conversation name must be at least 2 characters long";
    }

    if (data.name.length > 50) {
      return "Conversation name cannot exceed 50 characters";
    }

    if (!user?.id) {
      return "User authentication required";
    }

    // Validate user selection based on conversation type
    if (data.type === "group") {
      if (data.selectedUsers.length < 2) {
        return "Please select at least 2 users for the conversation";
      }
      if (data.selectedUsers.length > 4) {
        return "Cannot select more than 4 users for a conversation";
      }
    } else if (data.type === "direct") {
      if (data.selectedUsers.length !== 1) {
        return "Please select exactly 1 user for direct message";
      }
    }

    // Ensure current user is included for group conversations
    if (data.type === "group") {
      const currentUserIncluded = data.selectedUsers.some((u) => u.id === user.id);
      if (!currentUserIncluded) {
        return "You must include yourself when creating a conversation";
      }
    }

    return null;
  };

  const createConversation = async (conversationData?: Partial<CreateConversationFormData>) => {
    const dataToSubmit = { ...formData, ...conversationData };

    // Validate form data
    const validationError = validateForm(dataToSubmit);
    if (validationError) {
      if (showToast) {
        toast.error(validationError);
      }
      return { success: false, error: validationError };
    }

    setLoading(true);

    try {
      // Prepare API request body using generated schema
      const selectedUserIds = dataToSubmit.selectedUsers.map((u) => u.id!);
      const userIds =
        dataToSubmit.type === "direct"
          ? [...selectedUserIds, user!.id] // Add current user for direct messages
          : selectedUserIds; // Group conversations already include current user

      const requestBody: ChatServiceInternalModelsCreateChannelRequest = {
        name: dataToSubmit.name.trim() || "", // Backend will auto-generate name for direct messages
        type: dataToSubmit.type,
        userIds: [...new Set(userIds)], // Remove duplicates
      };

      const response = await postConversationMutation.mutateAsync({
        data: requestBody,
      });

      return { success: true, data: response.data };
    } catch (error) {
      // Error is handled by the mutation's onError callback
      return { success: false, error };
    }
  };

  const updateFormData = (updates: Partial<CreateConversationFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateSelectedUsers = (users: ChatServiceInternalModelsUserResponse[]) => {
    setFormData((prev) => ({ ...prev, selectedUsers: users }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: defaultType,
      selectedUsers: [],
    });
  };

  return {
    // State
    formData,
    loading,

    // Actions
    createConversation,
    updateFormData,
    updateSelectedUsers,
    resetForm,

    // Utilities
    validateForm: (data?: CreateConversationFormData) => validateForm(data || formData),

    // Raw mutation for advanced usage
    mutation: postConversationMutation,
  };
};

