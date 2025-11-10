import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KpiGroup({
  title,
  children,
  className = "",
  titleClassName = "",
  contentClassName = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={`border-0 shadow-none bg-white rounded-2xl ring-1 ring-black/5 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-base ${titleClassName}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={`grid gap-3 ${contentClassName}`}>
        {children}
      </CardContent>
    </Card>
  );
}