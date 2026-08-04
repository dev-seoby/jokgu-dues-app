import { HStack, Text } from "@seed-design/react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <HStack justify="space-between" align="flex-end" style={{ marginBottom: 28 }}>
      <div>
        <Text as="h1" textStyle="t8Bold" color="fg.neutral">
          {title}
        </Text>
        {subtitle && (
          <Text as="p" textStyle="t4Regular" color="fg.neutralMuted" style={{ marginTop: 4 }}>
            {subtitle}
          </Text>
        )}
      </div>
      {action}
    </HStack>
  );
}
