import { useState } from "react";
import { toast } from "react-toastify";

import { usePostChannels } from "@/services/endpoints/channels/channels";
import { PostChannelsBody } from "@/services/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { EnhancedChannel, useChannelStore } from "@/store/useChannelStore";

interface UseCreateChannelOptions {
  onSuccess?: (channel: EnhancedChannel) => void;
  onError?: (error: any) => void;
  showToast?: boolean;
}

interface CreateChannelFormData {
  name: string;
  type?: 'group' | 'direct';
}

export const useCreateChannel = (options: UseCreateChannelOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;

  const { user } = useAuthStore((state) => state);
  const { addGroupChannel, addDirectChannel } = useChannelStore((state) => state);

  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateChannelFormData>({
    name: "",
    type: 'group' // default to group channel
  });

  const postChannelMutation = usePostChannels({
    mutation: {
      onSuccess: (data) => {
        if (showToast) {
          toast.success("Channel created successfully");
        }

        // Transform API response to EnhancedChannel format
        const newChannel: EnhancedChannel = {
          id: data.data.id!,
          name: data.data.name!,
          ownerId: data.data.ownerId!,
          type: formData.type || 'group',
          avatar: "",
          lastActivity: new Date(),
          unreadCount: 0,
          members: []
        };

        // Add to appropriate channel list in store
        if (newChannel.type === 'group') {
          addGroupChannel(newChannel);
        } else {
          addDirectChannel(newChannel);
        }

        // Reset form
        resetForm();
        setLoading(false);

        // Call custom success callback
        onSuccess?.(newChannel);
      },
      onError: (error) => {
        if (showToast) {
          toast.error("Failed to create channel");
        }
        setLoading(false);
        onError?.(error);
      }
    }
  });

  const validateForm = (data: CreateChannelFormData): string | null => {
    if (!data.name.trim()) {
      return "Please enter a channel name";
    }

    if (data.name.length < 2) {
      return "Channel name must be at least 2 characters long";
    }

    if (data.name.length > 50) {
      return "Channel name cannot exceed 50 characters";
    }

    if (!user?.id) {
      return "User authentication required";
    }

    return null;
  };

  const createChannel = async (channelData?: Partial<CreateChannelFormData>) => {
    const dataToSubmit = { ...formData, ...channelData };

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
      // Prepare API request body
      const requestBody: PostChannelsBody = {
        name: dataToSubmit.name.trim(),
        ownerId: user!.id!.toString()
      };

      const response = await postChannelMutation.mutateAsync({
        data: requestBody
      });

      return { success: true, data: response.data };
    } catch (error) {
      // Error is handled by the mutation's onError callback
      return { success: false, error };
    }
  };

  const updateFormData = (updates: Partial<CreateChannelFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: 'group'
    });
  };

  return {
    // State
    formData,
    loading,

    // Actions
    createChannel,
    updateFormData,
    resetForm,

    // Utilities
    validateForm: (data?: CreateChannelFormData) => validateForm(data || formData),

    // Raw mutation for advanced usage
    mutation: postChannelMutation
  };
};
