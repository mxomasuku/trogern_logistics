import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  title,
  value,
  icon,
  loading,
  description,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
  description?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-gray-400"
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        <div className="rounded-xl border p-2 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>

      <div className="px-6 pb-5">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
        )}
      </div>
    </Card>
  );
}