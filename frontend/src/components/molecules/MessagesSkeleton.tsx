import { Skeleton } from "../ui/skeleton"

export default function MessagesSkeleton({ isGroup }: { isGroup: boolean }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, index) => {
        const isCurrentUser = index % 3 === 0

        if (isCurrentUser) {
          // Sent message skeleton (right side)
          return (
            <div key={index} className="flex justify-end mb-4">
              <div className="max-w-xs lg:max-w-md">
                <div className="bg-gray-200 rounded-lg rounded-br-sm px-4 py-2">
                  <Skeleton className="h-4 w-32 mb-1" />
                  {index % 2 === 0 && <Skeleton className="h-4 w-24" />}
                </div>
                <div className="flex justify-end mt-1">
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          )
        }

        // Received message skeleton (left side)
        return (
          <div key={index} className="flex items-start mb-4">
            {isGroup && (
              <Skeleton className="w-8 h-8 rounded-full mr-2 flex-shrink-0" />
            )}
            <div className="max-w-xs lg:max-w-md">
              {isGroup && (
                <Skeleton className="h-4 w-20 mb-1" />
              )}
              <div className="bg-gray-100 border border-gray-200 rounded-lg rounded-bl-sm px-4 py-2">
                <Skeleton className="h-4 w-40 mb-1" />
                {index % 3 === 1 && <Skeleton className="h-4 w-28" />}
              </div>
              <div className="flex justify-start mt-1">
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}