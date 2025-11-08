import { Skeleton } from "../ui/skeleton";

export default function ChannelsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center py-1.5 px-3 mb-1">
          <div className="mr-3 flex items-center">
            <Skeleton className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-20 mb-1" />
            </div>
            <div className="flex items-center space-x-2">
              {index % 3 === 0 && <Skeleton className="w-6 h-4" />}
              <Skeleton className="w-12 h-3" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}