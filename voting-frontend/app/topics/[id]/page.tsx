"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ThumbsUp } from "lucide-react";

interface Option {
  id: string;
  title: string;
  description: string;
  image_url: string;
  vote_count: number;
  link: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  thumbnail_url: string;
  options: Option[];
}

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
          <Card key={option.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-xl">{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {option.image_url && (
                <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={option.image_url}
                    alt={option.title}
                    fill
                    className="object-cover transition-transform duration-200 hover:scale-105"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {option.vote_count}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(option.link, "_blank")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Link
              </Button>
              <Button
                size="sm"
                onClick={() => handleVote(option.id)}
                disabled={voting === option.id}
              >
                {voting === option.id ? "Voting..." : "Vote"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
