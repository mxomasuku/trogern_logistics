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
      className="cursor-pointer bg-white hover:bg-blue-50 transition-all duration-200 rounded-xl shadow-none hover:shadow-md border-0"
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-blue-800">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-gray-500">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="rounded-lg bg-white p-2 text-blue-500 group-hover:text-blue-700 transition-colors">
          {icon}
        </div>
      </CardHeader>

      <div className="px-6 pb-5">
        {loading ? (
          <Skeleton className="h-8 w-16 rounded-lg" />
        ) : (
          <div className="text-3xl font-semibold tracking-tight text-blue-800">
            {value}
          </div>
        )}
      </div>
    </Card>
  );
}