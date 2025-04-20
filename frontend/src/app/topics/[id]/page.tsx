'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import ApiUtils from '@/lib/api';
import { useWebSocket } from '@/lib/socket';
import { Option } from '@/models';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card } from '@/registry/new-york-v4/ui/card';

import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { toast } from 'sonner';

type VoteMessage = {
    type: 'vote';
    optionId: string;
    newVoteCount: number;
};

type NewOptionMessage = {
    type: 'new_option';
    option: Option;
};

export default function TopicDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [optionMap, setOptionMap] = useState<Map<number, Option>>(new Map());

    useEffect(() => {
        (async () => {
            try {
                const res = await ApiUtils.get<Option[]>(`/topics/${id}/options`);
                console.log('res', res);
                if (res.status === 401) {
                    router.push('/login');
                }
                if (res.status !== 200) throw new Error('Failed to fetch options');
                const options: Option[] = res.data;
                const map = new Map<number, Option>();
                options.forEach((option) => map.set((option as any).ID, option));
                setOptionMap(map);
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 401) {
                    router.push('/login');
                }
                console.error('Error fetching options:', error);

                toast.error('Failed to fetch options');
            }
        })();
    }, [id]);

    // WebSocket listener to update vote count and add new options
    // const handleWebSocketMessage = useCallback((data: VoteMessage | NewOptionMessage) => {
    //     setOptionMap((prevMap) => {
    //         const newMap = new Map(prevMap);

    //         if (data.type === 'vote') {
    //             const option = newMap.get(data.optionId);
    //             if (option) {
    //                 newMap.set(data.optionId, { ...option, votes: data.newVoteCount });
    //             }
    //         } else if (data.type === 'new_option') {
    //             newMap.set(data.option.id, data.option);
    //         }

    //         return newMap;
    //     });
    // }, []);

    // // Connect WebSocket
    // useWebSocket<VoteMessage | NewOptionMessage>(`ws://localhost:8080/ws/ranking/${id}`, handleWebSocketMessage);

    // Handle Vote Click
    async function handleVote(optionId: number) {
        try {
            setOptionMap((prevMap) => {
                const newMap = new Map(prevMap);
                const option = newMap.get(optionId);
                if (option) {
                    newMap.set(optionId, { ...option, vote_count: option.vote_count + 1 }); // Optimistic UI update
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
                    <Card key={option.ID} className='flex flex-col items-center p-4'>
                        <h2 className='text-xl font-semibold'>{option.title}</h2>
                        <Image
                            src={(option as any).image_url}
                            alt={option.title}
                            width={128}
                            height={128}
                            className='my-2'
                        />
                        <p className='text-lg'>Votes: {option.vote_count}</p>
                        <Button onClick={() => handleVote(option.ID)}>Vote</Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
