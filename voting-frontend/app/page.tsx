"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socket";
import VoteButton from "@/components/VoteButton";

export default function Home() {
  const [voteCounts, setVoteCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Listen for vote updates
    socket.on("vote_update", (data: { option_id: string; vote_count: number }) => {
      setVoteCounts((prev) => ({
        ...prev,
        [data.option_id]: data.vote_count,
      }));
    });

    // Cleanup on unmount
    return () => {
      socket.off("vote_update");
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Real-Time Voting</h1>
      <div className="space-y-4">
        {Object.entries(voteCounts).map(([optionId, count]) => (
          <div key={optionId} className="p-4 border rounded">
            <p>
              Option {optionId}: {count} votes
            </p>
            <VoteButton topicId="1" optionId={optionId} />
          </div>
        ))}
      </div>
    </div>
  );
}
