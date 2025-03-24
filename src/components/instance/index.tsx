import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function InstanceFrame() {
  const [streamUrl] = useQueryState("streamUrl");
  const [instanceId] = useQueryState("instanceId");
  const [isStopping, setIsStopping] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  const handleStop = async () => {
    if (!instanceId) {
      toast.warning("Instance not found", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
      return;
    }

    try {
      setIsStopping(true);
      await fetch("/api/stop_instance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instanceId }),
      });
      setIsStopped(true);
      toast.success("Instance stopped successfully", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to stop instance", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } finally {
      setIsStopping(false);
    }
  };

  if (!streamUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="w-full h-full overflow-hidden rounded-lg border border-border shadow-sm bg-card flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-muted/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect width="18" height="14" x="3" y="3" rx="2" />
              <path d="M7 7h10" />
              <path d="M7 11h10" />
              <path d="M7 15h10" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Instance not running
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full h-full flex items-center justify-center p-4">
      <div className="w-full h-full overflow-hidden rounded-lg border border-border shadow-sm bg-card relative">
        <div className="absolute top-0 left-0 right-0 h-8 bg-muted/30 backdrop-blur-sm flex items-center px-3 z-10">
          <div className="flex space-x-1.5">
            <div
              className={cn(
                "w-3 h-3 rounded-full bg-destructive/80",
                isStopping || isStopped
                  ? "cursor-not-allowed"
                  : "cursor-pointer",
              )}
              onClick={isStopping || isStopped ? undefined : handleStop}
              role="button"
              aria-label="Stop instance"
            />
            <div className="w-3 h-3 rounded-full bg-accent/80" />
            <div className="w-3 h-3 rounded-full bg-primary/80" />
          </div>
        </div>
        <iframe
          src={streamUrl}
          className="w-full h-full pt-8"
          title="Instance Frame"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}
