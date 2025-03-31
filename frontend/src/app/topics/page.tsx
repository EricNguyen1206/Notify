'use server';

import { GetServerSideProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';

interface Topic {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    thumbnail_url: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // 1. Get token from cookies (sent from the browser)
    const token = context.req.cookies.token;

    if (!token) {
        // Redirect to login if no token
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        };
    }

    // 2. Fetch data with the token
    try {
        const response = await fetch('http://localhost:8000/api/v1/topics', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) {
            // Redirect to login if token is invalid
            return {
                redirect: {
                    destination: '/login',
                    permanent: false
                }
            };
        }
        const responseData = await response.json();
        return {
            props: {
                topics: responseData
            }
        };
    } catch (error) {
        // Handle errors (e.g., token expired)
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        };
    }
};

// async function getTopics(page: number) {
//   const res = await fetch(`${BASE_URL}/topics?page=${page}&limit=10`, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//     cache: "no-store", // Ensures fresh data on each request (SSR)
//   });

//   if (!res.ok) throw new Error("Failed to fetch data");
//   return res.json() as Promise<{ items: Topic[]; totalPages: number }>;
// }

type Props = {
    searchParams?: { page?: string };
    topics: Topic[];
};

export default async function TopicsPage({ topics }: Props) {
    // const page = (searchParams && Number(searchParams.page)) || 1;

    return (
        <div className='container mx-auto p-4'>
            <h1 className='mb-4 text-2xl font-bold'>Topics</h1>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {topics.map((topic) => (
                    <Link href={`/topics/${topic.id}`} key={topic.id}>
                        <div className='rounded border p-4 transition-shadow hover:shadow-lg'>
                            <h2 className='text-xl font-bold'>{topic.title}</h2>
                            <p className='mb-2 text-gray-600'>{topic.description}</p>
                            <div className='mb-2 text-sm text-gray-500'>
                                <p>Start: {new Date(topic.start_time).toLocaleString()}</p>
                                <p>End: {new Date(topic.end_time).toLocaleString()}</p>
                            </div>
                            {topic.thumbnail_url && (
                                <div className='relative h-48'>
                                    <Image
                                        src={topic.thumbnail_url}
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
