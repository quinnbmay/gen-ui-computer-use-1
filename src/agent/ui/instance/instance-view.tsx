import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { WindowManagerButtons } from "./window-manager-buttons";

export function InstanceView({
  children,
  handleStop,
  handlePause,
  isStopping,
  isStopped,
  allDisabled,
  handleExpand,
  isExpanded,
}: {
  children: ReactNode;
  handleStop: () => void;
  handlePause: () => void;
  isStopping: boolean;
  isStopped: boolean;
  allDisabled: boolean;
  handleExpand: () => void;
  isExpanded?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center my-auto",
        isExpanded
          ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-2"
          : "max-w-4xl p-4 pb-20",
      )}
    >
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg border border-border shadow-sm bg-card relative",
          isExpanded && "mx-auto transition-all duration-300 ease-in-out",
          isExpanded && "aspect-[4/3] max-h-[90vh] max-w-[calc(90vh*1.33)]",
        )}
      >
        <div className="sticky top-0 left-0 right-0 h-8 bg-muted/30 backdrop-blur-sm flex items-center px-3 z-10">
          <WindowManagerButtons
            onCancel={handleStop}
            onMinimize={handlePause}
            onExpand={handleExpand}
            isStopping={isStopping}
            isStopped={isStopped}
            allDisabled={allDisabled}
          />
        </div>
        <div className="relative w-full">{children}</div>
      </div>
    </div>
  );
}
