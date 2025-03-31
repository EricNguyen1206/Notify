"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface VoteButtonProps {
  topicId: string;
  optionId: string;
}

export default function VoteButton({ topicId, optionId }: VoteButtonProps) {
  const handleVote = async () => {
    try {
      await api.post(`/topics/${topicId}/options/${optionId}/vote`, {});
      alert("Vote recorded!");
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  return (
    <Button onClick={handleVote} className="w-full">
      Vote for Option {optionId}
    </Button>
  );
}
