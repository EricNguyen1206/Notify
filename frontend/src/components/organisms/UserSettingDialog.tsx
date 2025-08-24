"use client";

// External libraries
import { useRouter } from "next/navigation";
import React, { ReactNode, useRef, useState } from "react";

// Third-party utilities
import { toast } from "react-toastify";

// Types
// (none)

// Icons
import { LogOut, Settings, User } from "lucide-react";

// Helpers
import { getSummaryName } from "@/lib/helper";
import { handleFileUpload } from "@/lib/supabase";

// UI components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "../atoms/ThemeToggle";
import { Button } from "../ui/button";

// Store/state
import { useAuthStore } from "@/store/useAuthStore";

// Types
// (none)

type ParentComponentProps = {
    children: ReactNode;
};

const UserSettingDialog: React.FC<ParentComponentProps> = ({ children }) => {
    // Store/state/hooks
    const profile = useAuthStore((state) => state.user);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const router = useRouter();
    const [formData, setFormData] = useState<any>({
        id: "",
        name: "",
        provider: "",
        avatar: "",
        password: "",
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [image, setImage] = useState<any>(null);
    const avatarRef = useRef<any>(null);

    // Synchronous event handlers
    const handleSignOut = () => {
        clearAuth();
        toast.success("Sign out successfully");
        router.replace("/login");
    };

    const handleImageSelection = (event: any) => {
        setImage(event.target.files[0]);
    };

    // Async event handlers
    const handleEditUserProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let avatar = null;
        let checkEdit = false;

        const editUser: any = {
            id: profile?.id,
        };

        // Check edit avatar
        if (image !== null) {
            setLoading(true);

            const res = await handleFileUpload("uploads", "user_avatars", image);
            const { fullPath }: any = res;

            if (res === null) {
                toast.error("Upload image failed");
                return;
            }

            // Create avatar url
            avatar = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${fullPath}`;
            editUser.avatar = avatar;
            checkEdit = true;
        }

        for (const key in formData) {
            if (Object.hasOwn(formData, key) && formData[key] !== "") {
                editUser[key] = formData[key];
                checkEdit = true;
            }
        }

        if (!checkEdit) {
            toast.error("Edit user failed");
            setLoading(false);
            return;
        }

        setLoading(true);

        // const res = await editUserByUserId(editUser);
        // console.log(res);
        // const { message } = res;
        const message = "" + "1";

        if (message === "Edit user successfully")
            toast.success("Edit user successfully");
        else toast.error("Edit user failed");

        setLoading(false);
        avatarRef.current.value = null;
        setFormData({
            id: "",
            name: "",
            provider: "",
            password: "",
        });
    };

    // Render
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div>{children}</div>
            </DialogTrigger>
            <DialogContent className="bg-secondary-white dark:bg-primary-gray max-w-[100vw] h-[100vh]">
                <div className="absolute right-[50px] top-[10px] flex items-center gap-3">
                    <ThemeToggle />
                    <Button
                        variant="default"
                        onClick={handleSignOut}
                    >
                        <LogOut size={16} />
                        Log Out
                    </Button>
                </div>
                <Tabs defaultValue="account">
                    <TabsList>
                        <TabsTrigger value="account" className="flex items-center gap-2">
                            <User size={16} />
                            My Account
                        </TabsTrigger>
                        <TabsTrigger value="profiles" className="flex items-center gap-2">
                            <Settings size={16} />
                            Profiles
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="account">
                        <div className="mt-10 flex justify-center max-h-[100vh] overflow-y-auto">
                            <div className="flex flex-col gap-5 bg-white dark:bg-primary-black w-[100%] lg:w-[900px] p-4 rounded-md">
                                <div className="flex justify-between">
                                    <div className="flex gap-5 items-center">
                                        <Avatar className="w-[100px] h-[100px]">
                                            <AvatarImage
                                                src={`${profile?.avatar}`}
                                                alt="avatar"
                                            />
                                            <AvatarFallback className="text-[40px]">
                                                {profile?.username &&
                                                    getSummaryName(profile?.username)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[20px] font-bold">
                                                {profile?.username}
                                            </p>
                                            <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-semibold">
                                                {profile?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <Button
                                            className="flex items-center gap-2"
                                            variant="destructive"
                                            onClick={() => {
                                                handleSignOut();
                                            }}
                                        >
                                            <LogOut size={20} />
                                            <p>Log out</p>
                                        </Button>
                                    </div>
                                </div>
                                <form
                                    className="p-4 rounded-md flex flex-col gap-5 bg-zinc-100 dark:bg-primary-gray"
                                    onSubmit={handleEditUserProfile}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-2 text-[15px]">
                                            <p className="font-black dark:text-zinc-400">USER ID</p>
                                            <p className="truncate max-w-[200px] md:max-w-[500px]">
                                                {profile?.id}
                                            </p>
                                        </div>
                                        <Button variant="default" disabled>
                                            Edit
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-2 text-[15px]">
                                            <p className="font-black dark:text-zinc-400">
                                                DISPLAY NAME
                                            </p>
                                            <Input
                                                className="w-[200px] md:w-[600px]"
                                                type="text"
                                                placeholder={`${profile?.username}`}
                                                value={formData.username}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                            />
                                        </div>
                                        <Button
                                            variant="default"
                                            type="submit"
                                            disabled={loading ? true : false}
                                        >
                                            {loading ? "Loading..." : "Edit"}
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-2 text-[15px]">
                                            <p className="font-black dark:text-zinc-400">PROVIDER</p>
                                            <p className="truncate max-w-[200px] md:max-w-[500px]">
                                                provider
                                            </p>
                                        </div>
                                        <Button variant="default" disabled>
                                            Edit
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-2 text-[15px]">
                                            <p className="font-black dark:text-zinc-400">AVATAR</p>
                                            <Input
                                                className="w-[200px] md:w-[600px]"
                                                type="file"
                                                ref={avatarRef}
                                                onChange={(e) =>
                                                    //   setFormData({ ...formData, avatar: e.target.value })
                                                    handleImageSelection(e)
                                                }
                                            />
                                        </div>
                                        {/* {profile?.provider === "email" ? ( */}
                                        <Button
                                            variant="default"
                                            type="submit"
                                            disabled={loading ? true : false}
                                        >
                                            {loading ? "Loading..." : "Edit"}
                                        </Button>
                                        {/* ) : (
                      <Button variant="default" type="submit" disabled>
                        Edit
                      </Button>
                    )} */}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-2 text-[15px]">
                                            <p className="font-black dark:text-zinc-400">PASSWORD</p>
                                            <Input
                                                className="w-[200px] md:w-[600px]"
                                                type="password"
                                                disabled={
                                                    true //profile?.password === null ? true : false
                                                }
                                                placeholder={`${"Password is not available"
                                                    // profile?.password === null
                                                    //   ? "Password is not available"
                                                    //   : censorPassword(profile?.password)
                                                    }`}
                                                value={formData.password}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, password: e.target.value })
                                                }
                                            />
                                        </div>
                                        {/* {profile?.password === null ? (
                      <Button variant="default" type="submit" disabled>
                        Edit
                      </Button>
                    ) : ( */}
                                        <Button
                                            variant="outline"
                                            type="submit"
                                            disabled={loading ? true : false}
                                        >
                                            {loading ? "Loading..." : "Edit"}
                                        </Button>
                                        {/* )} */}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="profiles">
                        <div className="mt-10 flex justify-center">Profiles content</div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default UserSettingDialog;
