'use client';

import { useActionState } from 'react';

import Image from 'next/image';

import { Option } from '@/models/option';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/registry/new-york-v4/ui/card';

import { voteForOption } from '../actions';

interface OptionProps {
    option: Option;
    topicId: string;
}

export function OptionCard({ option, topicId }: OptionProps) {
    const { id, title, image_url, vote_count } = option;
    const formAction = useActionState(voteForOption, { error: null, success: null })[1];

    return (
        <Card className='shadow-lg'>
            <CardHeader>
                <h3 className='font-semibold'>{title}</h3>
            </CardHeader>
            <CardContent>
                <Image src={image_url} alt={title} width={200} height={200} className='rounded-md object-cover' />
                <p className='mt-2 text-sm text-gray-600'>Votes: {vote_count}</p>
            </CardContent>
            <CardFooter>
                <form action={formAction}>
                    <input type='hidden' name='optionId' value={id} />
                    <input type='hidden' name='topicId' value={topicId} />
                    <Button type='submit'>Vote</Button>
                </form>
            </CardFooter>
        </Card>
    );
}
