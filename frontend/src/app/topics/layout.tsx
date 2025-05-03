'use client';

import { useRouter } from 'next/navigation';

import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/registry/new-york-v4/ui/button';

import { LogOut } from 'lucide-react';

export default function TopicsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const router = useRouter();

    const handleLogout = () => {
        // Clear any auth tokens or user data from localStorage
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <ProtectedRoute>
            <div className='bg-background min-h-screen'>
                <header className='border-b'>
                    <div className='container mx-auto flex h-16 items-center justify-between px-4'>
                        <h1 className='text-xl font-bold'>Notify</h1>
                        <Button variant='ghost' size='sm' onClick={handleLogout} className='flex items-center gap-2'>
                            <LogOut className='h-4 w-4' />
                            Logout
                        </Button>
                    </div>
                </header>
                <main>{children}</main>
            </div>
        </ProtectedRoute>
    );
}
