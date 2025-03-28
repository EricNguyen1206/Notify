"use server";

import Image from "next/image";
import Link from "next/link";
import { BASE_URL } from "@/lib/api";
interface Topic {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  thumbnail_url: string;
}

async function getTopics(page: number) {
  const res = await fetch(`${BASE_URL}/topics?page=${page}&limit=10`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    cache: "no-store", // Ensures fresh data on each request (SSR)
  });

  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json() as Promise<{ items: Topic[]; totalPages: number }>;
}

export default async function TopicsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Number(searchParams.page) || 1;
  const { items, totalPages } = await getTopics(page);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Topics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((topic) => (
          <Link href={`/topics/${topic.id}`} key={topic.id}>
            <div className="p-4 border rounded hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold">{topic.title}</h2>
              <p className="text-gray-600 mb-2">{topic.description}</p>
              <div className="text-sm text-gray-500 mb-2">
                <p>Start: {new Date(topic.start_time).toLocaleString()}</p>
                <p>End: {new Date(topic.end_time).toLocaleString()}</p>
              </div>
              {topic.thumbnail_url && (
                <div className="relative h-48">
                  <Image src={topic.thumbnail_url} alt={topic.title} fill className="object-cover rounded-md" />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      {/* Pagination Controls */}
      <div className="mt-4 flex gap-2">
        {page > 1 && (
          <Link href={`/items?page=${page - 1}`} className="px-4 py-2 bg-gray-300 rounded">
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/items?page=${page + 1}`} className="px-4 py-2 bg-gray-300 rounded">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
