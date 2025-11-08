"use client";

// External libraries
import React, { useRef, useState } from "react";

// Third-party utilities
import { toast } from "react-toastify";

// Icons
import { User } from "lucide-react";

// Helpers
import { handleFileUpload } from "@/lib/supabase";

// UI components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

// Store/state
import { useAuthStore } from "@/store/useAuthStore";

// API
import { usePutUsersProfile } from "@/services/endpoints/users/users";
import type { ChatServiceInternalModelsUpdateProfileRequest } from "@/services/schemas";

type ParentComponentProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const UserSettingDialog: React.FC<ParentComponentProps> = ({ children, open, onOpenChange }) => {
  // Store/state/hooks
  const profile = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [formData, setFormData] = useState<any>({
    username: "",
    password: "",
    currentPassword: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [image, setImage] = useState<any>(null);
  const avatarRef = useRef<any>(null);

  // API hooks
  const updateProfileMutation = usePutUsersProfile({
    mutation: {
      onSuccess: (data) => {
        toast.success("Profile updated successfully");
        // Update local state
        updateUser({
          id: data.data.id ?? profile?.id!,
          email: data.data.email ?? profile?.email!,
          username: data.data.username ?? profile?.username!,
          avatar: data.data.avatar ?? profile?.avatar,
        });
        // Reset form
        setFormData({
          username: "",
          password: "",
          currentPassword: "",
        });
        setImage(null);
        if (avatarRef.current) {
          avatarRef.current.value = null;
        }
        setLoading(false);
        // Auto close dialog
        if (onOpenChange) {
          onOpenChange(false);
        }
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || "Failed to update profile";
        toast.error(errorMessage);
        setLoading(false);
      },
    },
  });

  const handleImageSelection = (event: any) => {
    setImage(event.target.files[0]);
  };

  // Async event handlers
  const handleEditUserProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    let avatar = null;
    let checkEdit = false;

    const updateData: ChatServiceInternalModelsUpdateProfileRequest = {
      current_password: formData.currentPassword,
    };

    // Check edit avatar
    if (image !== null) {
      setLoading(true);

      const res = await handleFileUpload("uploads", "public", image);
      const { fullPath }: any = res;

      if (res === null) {
        toast.error("Upload image failed");
        setLoading(false);
        return;
      }

      // Create avatar url
      avatar = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${fullPath}`;
      updateData.avatar = avatar;
      checkEdit = true;
    }

    // Check other fields
    if (formData.username && formData.username.trim() !== "") {
      updateData.username = formData.username.trim();
      checkEdit = true;
    }

    if (formData.password && formData.password.trim() !== "") {
      updateData.password = formData.password.trim();
      checkEdit = true;
    }

    if (!checkEdit) {
      toast.error("Please make at least one change");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      await updateProfileMutation.mutateAsync({ data: updateData });
    } catch (error) {
      // Error handling is done in onError callback
      console.error("Update profile error:", error);
    }
  };

  // Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile?.avatar} alt="avatar" />
            <AvatarFallback className="text-2xl">
              {profile?.username && profile.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <p className="font-semibold text-lg">{profile?.username}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleEditUserProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">New Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter new username (optional)"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">New Avatar</Label>
            <Input id="avatar" type="file" accept="image/*" ref={avatarRef} onChange={handleImageSelection} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password (optional)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password *</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Enter current password (required)"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingDialog;
