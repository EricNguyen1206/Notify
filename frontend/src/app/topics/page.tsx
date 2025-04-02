'use server';

import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

import { BASE_URL } from '@/lib/api';

interface Topic {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string | null;
    title: string;
    description: string;
    image_url: string;
    start_time: string | Date;
    end_time: string | Date;
}

async function getTopics(token?: string) {
    if (!token) return [];
    try {
        const res = await fetch(`${BASE_URL}/topics`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            cache: 'no-store' // Ensures fresh data on each request (SSR)
        });
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json() as Promise<Topic[]>;
    } catch (error) {
        console.error('Error fetching topics:', error);
        return [];
    }
}

export default async function TopicsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const topics = await getTopics(token);
    // const page = (searchParams && Number(searchParams.page)) || 1;

    return (
        <div className='container mx-auto p-4'>
            <h1 className='mb-4 text-2xl font-bold'>Topics</h1>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {topics.map((topic) => (
                    <Link href={`/topics/${topic.ID}`} key={topic.ID}>
                        <div className='rounded border p-4 transition-shadow hover:shadow-lg'>
                            <h2 className='text-xl font-bold'>{topic.title}</h2>
                            <p className='mb-2 text-gray-600'>{topic.description}</p>
                            <div className='mb-2 text-sm text-gray-500'>
                                <p>Start: {new Date(topic.start_time).toLocaleString()}</p>
                                <p>End: {new Date(topic.end_time).toLocaleString()}</p>
                            </div>
                            {topic.image_url && (
                                <div className='relative h-48'>
                                    <Image
                                        src={topic.image_url}
                                        alt={topic.title}
                                        fill
                                        className='rounded-md object-cover'
                                    />
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
            {/* Pagination Controls */}
            {/* <div className="mt-4 flex gap-2">
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
      </div> */}
        </div>
    );
}
