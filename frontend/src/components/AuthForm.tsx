/* eslint-disable @typescript-eslint/no-explicit-any */
// AuthForm.tsx
'use client';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/registry/new-york-v4/ui/form';
import { Input } from '@/registry/new-york-v4/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';

import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

/* eslint-disable @typescript-eslint/no-explicit-any */
// AuthForm.tsx

interface AuthFormProps {
    schema: z.ZodObject<any>;
    onSubmit: (values: any) => void;
    buttonText: string;
    isLoading?: boolean;
}

export default function AuthForm({ schema, onSubmit, buttonText, isLoading }: AuthFormProps) {
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema)
    });

    return (
        <Card className='w-full max-w-md'>
            <CardHeader>
                <CardTitle className='text-center text-2xl font-bold'>{buttonText}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder='your@email.com'
                                            {...field}
                                            className='focus-visible:ring-primary focus-visible:ring-2'
                                        />
                                    </FormControl>
                                    <FormMessage className='text-xs' />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='password'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='password'
                                            placeholder='••••••••'
                                            {...field}
                                            className='focus-visible:ring-primary focus-visible:ring-2'
                                        />
                                    </FormControl>
                                    <FormMessage className='text-xs' />
                                </FormItem>
                            )}
                        />
                        <Button type='submit' className='w-full' disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Please wait
                                </>
                            ) : (
                                buttonText
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
