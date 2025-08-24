import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-chat bg-chat-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
