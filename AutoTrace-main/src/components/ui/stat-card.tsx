
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className,
  iconClassName,
  valueClassName 
}: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-all duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && (
          <div className={cn("p-2 rounded-full", iconClassName || "bg-primary/10 text-primary")}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1 flex items-end">
          <span className={cn(valueClassName)}>{value}</span>
          {trend && (
            <span className={cn(
              "text-sm ml-2 flex items-center",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
