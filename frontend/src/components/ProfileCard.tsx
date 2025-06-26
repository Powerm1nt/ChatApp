import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileCardItem {
  label: string;
  value: string;
}

interface ProfileCardProps {
  title: string;
  icon?: ReactNode;
  items: ProfileCardItem[];
  className?: string;
}

export function ProfileCard({ title, icon, items, className }: ProfileCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm font-medium text-right max-w-[60%] truncate" title={item.value}>
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}