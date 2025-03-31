'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';

import { api } from '@/lib/api';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/registry/new-york-v4/ui/form';
import { Input } from '@/registry/new-york-v4/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Improved schema with additional validation rules
const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters long' })
        .regex(/[a-zA-Z0-9]/, { message: 'Password must be alphanumeric' })
});

export default function LoginPreview() {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Assuming an async login function
            console.log(values);
            const res = await api.post('/auth/login', values);
            if (!res.data) {
                throw new Error('Failed to login');
            }
            const responseData = res.data;
            document.cookie = `token=${responseData.token}; path=/; max-age=86400`; // 1 day expiry
            console.log(responseData);
            form.reset();
            toast.success(
                <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
                    <code className='text-white'>{JSON.stringify(values, null, 2)}</code>
                </pre>
            );
            router.push('/topics'); // Redirect to home page
        } catch (error) {
            console.error('Form submission error', error);
            toast.error('Failed to submit the form. Please try again.');
        }
    }

    return (
        <div className='flex h-full min-h-[50vh] w-full flex-col items-center justify-center px-4'>
            <Card className='mx-auto max-w-sm'>
                <CardHeader>
                    <CardTitle className='text-2xl'>Login</CardTitle>
                    <CardDescription>Enter your email and password to login to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                            <div className='grid gap-4'>
                                <FormField
                                    control={form.control}
                                    name='email'
                                    render={({ field }) => (
                                        <FormItem className='grid gap-2'>
                                            <FormLabel htmlFor='email'>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    id='email'
                                                    placeholder='johndoe@mail.com'
                                                    type='email'
                                                    autoComplete='email'
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='password'
                                    render={({ field }) => (
                                        <FormItem className='grid gap-2'>
                                            <div className='flex items-center justify-between'>
                                                <FormLabel htmlFor='password'>Password</FormLabel>
                                                <Link href='#' className='ml-auto inline-block text-sm underline'>
                                                    Forgot your password?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    id='password'
                                                    type='password'
                                                    placeholder='******'
                                                    autoComplete='current-password'
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type='submit' className='w-full'>
                                    Login
                                </Button>
                                <Button variant='outline' className='w-full'>
                                    Login with Google
                                </Button>
                            </div>
                        </form>
                    </Form>
                    <div className='mt-4 text-center text-sm'>
                        Don&apos;t have an account?{' '}
                        <Link href='#' className='underline'>
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
