import { Text } from "@seed-design/react";

export function TopBar({ label }: { label: string }) {
  return (
    <div className="top-bar">
      <div className="top-bar-breadcrumb">
        <Text textStyle="t3Regular" color="fg.neutralMuted">
          홈
        </Text>
        <Text textStyle="t3Regular" color="fg.neutralMuted">
          /
        </Text>
        <Text textStyle="t3Medium" color="fg.neutral">
          {label}
        </Text>
      </div>
      <div className="top-bar-user">
        <span className="user-avatar" aria-hidden="true">
          총
        </span>
        <Text textStyle="t3Medium" color="fg.neutral">
          총무
        </Text>
      </div>
    </div>
  );
}
