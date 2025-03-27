"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Topic } from "@/models/topic";
import OptionCard from "@/components/OptionCard";

export default function TopicDetailPage() {
  const params = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  const fetchTopicDetails = useCallback(async () => {
    try {
      const response = await api.get(`/topics/${params.id}`);
      setTopic(response.data);
    } catch (error) {
      console.error("Failed to fetch topic details:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTopicDetails();
  }, [fetchTopicDetails]);

  const handleVote = async (optionId: string) => {
    try {
      setVoting(optionId);
      await api.post(`/topics/${params.id}/vote`, { option_id: optionId });
      fetchTopicDetails(); // Refresh the data after voting
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Topic not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
        <p className="text-gray-600 mb-4">{topic.description}</p>
        <div className="flex gap-2 text-sm text-gray-500">
          <Badge variant="secondary">
            Start: {new Date(topic.start_time).toLocaleString()}
          </Badge>
          <Badge variant="secondary">
            End: {new Date(topic.end_time).toLocaleString()}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topic.options.map((option) => (
          <OptionCard key={option.id} option={option} handleVote={handleVote} voting={voting ?? ""} />
        ))}
      </div>
    </div>
  );
}
