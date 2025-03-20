"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CustomDialog from "@/components/Dialog";
import CreateTopicForm from "@/components/CreateTopicForm";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";

interface Topic {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  thumbnail_url: string;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTopics = useCallback(
    () => async () => {
      try {
        const response = await api.get("/topics", {
          params: { search: searchQuery },
        });
        setTopics(response.data);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Topics</h1>
        <div className="flex justify-between mb-4">
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <CustomDialog trigger={<Button>Create Topic</Button>} title="Create Topic">
            <CreateTopicForm onSuccess={fetchTopics} />
          </CustomDialog>
        </div>
        <div className="space-y-4">
          {topics.map((topic) => (
            <div key={topic.id} className="p-4 border rounded">
              <h2 className="text-xl font-bold">{topic.title}</h2>
              <p>{topic.description}</p>
              <p>Start: {new Date(topic.start_time).toLocaleString()}</p>
              <p>End: {new Date(topic.end_time).toLocaleString()}</p>
              {topic.thumbnail_url && <Image src={topic.thumbnail_url} alt={topic.title} className="mt-2 rounded" />}
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
