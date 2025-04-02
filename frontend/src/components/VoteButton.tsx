'use client';

import api from '@/lib/api';
import { Button } from '@/registry/new-york-v4/ui/button';

interface VoteButtonProps {
    topicId: string;
    optionId: string;
}

export default function VoteButton({ topicId, optionId }: VoteButtonProps) {
    const handleVote = async () => {
        try {
            await api.post(`/topics/${topicId}/options/${optionId}/vote`, {});
            alert('Vote recorded!');
        } catch (error) {
            console.error('Failed to vote:', error);
        }
    };

    return (
        <Button onClick={handleVote} className='w-full'>
            Vote for Option {optionId}
        </Button>
    );
}
