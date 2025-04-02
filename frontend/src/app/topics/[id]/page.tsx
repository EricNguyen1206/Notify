'use client';

import { useCallback, useState } from 'react';

import Image from 'next/image';

import { useWebSocket } from '@/lib/socket';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card } from '@/registry/new-york-v4/ui/card';

import { toast } from 'sonner';

type Option = {
    id: string;
    title: string;
    imageUrl: string;
    votes: number;
};

type VoteMessage = {
    type: 'vote';
    optionId: string;
    newVoteCount: number;
};

type NewOptionMessage = {
    type: 'new_option';
    option: Option;
};

export default function TopicDetail({ topicId }: { topicId: string }) {
    const [optionMap, setOptionMap] = useState<Map<string, Option>>(new Map());

    // WebSocket listener to update vote count and add new options
    const handleWebSocketMessage = useCallback((data: VoteMessage | NewOptionMessage) => {
        setOptionMap((prevMap) => {
            const newMap = new Map(prevMap);

            if (data.type === 'vote') {
                const option = newMap.get(data.optionId);
                if (option) {
                    newMap.set(data.optionId, { ...option, votes: data.newVoteCount });
                }
            } else if (data.type === 'new_option') {
                newMap.set(data.option.id, data.option);
            }

            return newMap;
        });
    }, []);

    // Connect WebSocket
    useWebSocket<VoteMessage | NewOptionMessage>(`ws://localhost:8080/ws/ranking/${topicId}`, handleWebSocketMessage);

    // Handle Vote Click
    async function handleVote(optionId: string) {
        try {
            setOptionMap((prevMap) => {
                const newMap = new Map(prevMap);
                const option = newMap.get(optionId);
                if (option) {
                    newMap.set(optionId, { ...option, votes: option.votes + 1 }); // Optimistic UI update
                }
                return newMap;
            });

            // Send vote request to the server
            const res = await fetch(`/api/vote`, {
                method: 'POST',
                body: JSON.stringify({ optionId })
            });

            if (!res.ok) throw new Error('Failed to vote');

            toast.success('Vote submitted!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit vote.');
        }
    }

    return (
        <div>
            <h1 className='text-2xl font-bold'>Topic Details</h1>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {[...optionMap.values()].map((option) => (
                    <Card key={option.id} className='flex flex-col items-center p-4'>
                        <h2 className='text-xl font-semibold'>{option.title}</h2>
                        <Image src={option.imageUrl} alt={option.title} width={128} height={128} className='my-2' />
                        <p className='text-lg'>Votes: {option.votes}</p>
                        <Button onClick={() => handleVote(option.id)}>Vote</Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
