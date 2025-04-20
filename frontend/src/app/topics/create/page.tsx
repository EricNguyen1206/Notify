'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import ApiUtils, { BASE_URL } from '@/lib/api';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/registry/new-york-v4/ui/form';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Textarea } from '@/registry/new-york-v4/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';

import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Define the form schema using Zod
const topicFormSchema = z.object({
    title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
    startTime: z.string().refine((val) => !!val, { message: 'Start time is required' }),
    endTime: z.string().refine((val) => !!val, { message: 'End time must be after start time' })
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

// Helper function to get JWT token from cookies
const getAuthToken = () => {
    // For browser environments only
    if (typeof document !== 'undefined') {
        // Parse document.cookie to find JWT
        const cookies = document.cookie.split(';');
        console.log('TEST', cookies);
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token') {
                return value;
            }
        }
    }

    return null;
};

export default function CreateTopicPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with react-hook-form
    const form = useForm<TopicFormValues>({
        resolver: zodResolver(topicFormSchema),
        defaultValues: {
            title: '',
            description: '',
            startTime: '',
            endTime: ''
        }
    });

    // Handle form submission
    const onSubmit = async (data: TopicFormValues) => {
        try {
            setIsSubmitting(true);

            // Get JWT token from cookies
            const token = getAuthToken();

            if (!token) {
                toast.error('Authentication token not found. Please log in again.');
                router.push('/login'); // Redirect to login if no token

                return;
            }

            ApiUtils.post('/topics', {});
            // Make API request with token
            const response = await fetch(`topics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    start_time: dayjs(new Date(data.startTime), 'YYYY-MM-DD HH:mm:ss'),
                    end_time: dayjs(new Date(data.endTime), 'YYYY-MM-DD HH:mm:ss')
                })
            });

            if (!response.ok) {
                // Handle different error cases
                if (response.status === 401) {
                    toast.error('Session expired. Please log in again.');
                    router.push('/login');

                    return;
                }

                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to create topic');
            }

            toast.success('Topic created successfully!');

            // Redirect to topics list page
            setTimeout(() => router.push('/topics'), 500);
        } catch (error) {
            console.error('Error creating topic:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create topic. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='flex min-h-screen items-center justify-center bg-gray-100 p-6'>
            <Card className='w-full max-w-lg shadow-lg'>
                <CardHeader>
                    <CardTitle>Create Topic</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                            {/* Title Field */}
                            <FormField
                                control={form.control}
                                name='title'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder='Enter topic title' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Description Field */}
                            <FormField
                                control={form.control}
                                name='description'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder='Enter topic description' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Start Time Field */}
                            <FormField
                                control={form.control}
                                name='startTime'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Time</FormLabel>
                                        <FormControl>
                                            <Input type='datetime-local' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* End Time Field */}
                            <FormField
                                control={form.control}
                                name='endTime'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Time</FormLabel>
                                        <FormControl>
                                            <Input type='datetime-local' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Submit Button */}
                            <Button type='submit' className='w-full' disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Topic'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
