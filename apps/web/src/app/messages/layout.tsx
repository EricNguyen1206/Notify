import type { Metadata } from "next";

import AppSidebar from "@/components/organisms/AppSidebar";
import ScreenProvider from "@/components/templates/ScreenProvider";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { MessagesLayoutClient } from "@/components/templates/MessagesLayoutClient";
import { getAccessToken } from "@/lib/getCookies";

export const metadata: Metadata = {
    title: "Notify | Messages",
    description: "Developed by ericnguyen1206",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
    // Retrieve access token from httpOnly cookie server-side
    const accessToken = await getAccessToken();

    return (
        <ScreenProvider>
            <MessagesLayoutClient accessToken={accessToken}>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-chat-border bg-background">
                            <div className="flex items-center gap-2 px-chat-outer">
                                <SidebarTrigger className="-ml-1" />
                                <Separator
                                    orientation="vertical"
                                    className="mr-2 data-[orientation=vertical]:h-4 bg-chat-border"
                                />
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink href="/messages" className="font-normal">
                                                Conversation
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage className="font-medium">#conversation-id</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        </header>
                        <div className="w-full h-full flex overflow-y-auto bg-background">
                            {children}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </MessagesLayoutClient>
        </ScreenProvider>
    );
}
