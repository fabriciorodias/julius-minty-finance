import { cn } from "@/lib/utils"

function EnhancedSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[pulse_1.5s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  )
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <EnhancedSkeleton className="h-4 w-4 rounded" />
      <div className="flex-1 space-y-2">
        <EnhancedSkeleton className="h-4 w-3/4" />
        <EnhancedSkeleton className="h-3 w-1/2" />
      </div>
      <div className="text-right space-y-2">
        <EnhancedSkeleton className="h-4 w-20" />
        <EnhancedSkeleton className="h-3 w-16 ml-auto" />
      </div>
      <EnhancedSkeleton className="h-8 w-8 rounded" />
    </div>
  )
}

function BalanceCardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <EnhancedSkeleton className="h-4 w-32" />
          <EnhancedSkeleton className="h-8 w-48" />
          <EnhancedSkeleton className="h-3 w-40" />
        </div>
        <div className="space-y-2 text-right">
          <EnhancedSkeleton className="h-4 w-32" />
          <EnhancedSkeleton className="h-8 w-48" />
          <EnhancedSkeleton className="h-3 w-36" />
        </div>
      </div>
      <EnhancedSkeleton className="h-20 w-full rounded" />
    </div>
  )
}

function AccountListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <EnhancedSkeleton className="h-4 w-4 rounded" />
          <EnhancedSkeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-1">
            <EnhancedSkeleton className="h-4 w-3/4" />
            <EnhancedSkeleton className="h-3 w-1/2" />
          </div>
          <div className="text-right space-y-1">
            <EnhancedSkeleton className="h-4 w-20" />
            <EnhancedSkeleton className="h-2 w-2 rounded-full ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { 
  EnhancedSkeleton, 
  TransactionRowSkeleton, 
  BalanceCardSkeleton, 
  AccountListSkeleton 
}