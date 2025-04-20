'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import ApiUtils from '@/lib/api';

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

async function getTopics() {
    try {
        const res = await ApiUtils.get<Topic[]>('/topics');
        if (res.status !== 200) throw new Error('Failed to fetch data');

        return res.data;
    } catch (error) {
        console.error('Error fetching topics:', error);

        return [];
    }
}

export default function TopicsPage() {
    // const topics = await getTopics();
    const [topics, setTopics] = useState<Topic[]>([]);
    useEffect(() => {
        async function fetchData() {
            const topics = await getTopics();
            setTopics(topics);
        }
        fetchData();
    }, []);

    // const page = (searchParams && Number(searchParams.page)) || 1;

    return (
        <div className='container mx-auto p-4'>
            <h1 className='mb-4 text-2xl font-bold'>Topics</h1>
            <Link href='/topics/create'>
                <button className='mb-4 rounded bg-blue-500 px-4 py-2 text-white'>Create Topic</button>
            </Link>
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
