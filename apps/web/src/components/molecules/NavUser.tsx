"use client";

import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Moon, Sparkles, Sun } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";
import UserSettingDialog from "../organisms/UserSettingDialog";
import { useState } from "react";
import { useCurrentUserQuery } from "@/services/api/users";
import { useSignoutMutation } from "@/services/api/auth";
import { useQueryClient } from "@tanstack/react-query";

const NavUser = () => {
  const { data: user, isLoading } = useCurrentUserQuery();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const signoutMutation = useSignoutMutation({
    onSuccess: () => {
      queryClient.clear();
      toast.success("Sign out successfully");
      router.replace("/login");
    },
    onError: () => {
      toast.error("An error occurred during sign out");
    },
  });

  const handleSignOut = () => {
    signoutMutation.mutate();
  };

  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-[40px] data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user && <AvatarImage src={user.avatar || undefined} alt={user.username} />}
                <AvatarFallback className="rounded-lg">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.username ?? (isLoading ? "Loading..." : "User")}</span>
                <span className="truncate text-xs">{user?.email ?? ""}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg border-gray-200 bg-white dark:bg-primary-purple"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user && <AvatarImage src={user.avatar || undefined} alt={user.username} />}
                  <AvatarFallback className="rounded-lg">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.username ?? (isLoading ? "Loading..." : "User")}</span>
                  <span className="truncate text-xs">{user?.email ?? ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <UserSettingDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <div></div>
      </UserSettingDialog>
    </SidebarMenu>
  );
};

export default NavUser;
