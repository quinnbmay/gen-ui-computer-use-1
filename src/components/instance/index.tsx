import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X, Minus, Maximize, LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStreamContext } from "@/providers/Stream";
import { Button } from "../ui/button";

function StopInstanceDialog({
  isHovered,
  isStopping,
  isStopped,
  onCancel,
  disabled,
}: {
  isHovered: boolean;
  isStopping: boolean;
  isStopped: boolean;
  onCancel: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center relative bg-destructive/80" />
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <div
          className={cn(
            "w-[14px] h-[14px] rounded-full flex items-center justify-center relative",
            "bg-destructive/80",
            isStopping || isStopped ? "cursor-not-allowed" : "cursor-pointer",
          )}
          onClick={isStopping || isStopped ? undefined : () => setOpen(true)}
          role="button"
          aria-label="Stop instance"
        >
          {isHovered && (
            <X
              className={cn(
                "absolute text-black",
                "w-[10px] h-[10px]",
                isStopping || isStopped ? "opacity-50" : "opacity-100",
              )}
            />
          )}
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stop Instance</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to stop this instance? All progress will be
            lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-muted-foreground text-sm">
          You may pause the instance instead to save progress.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onCancel}
            className="bg-destructive hover:bg-destructive/80 transition-colors duration-200 ease-in-out"
          >
            Stop
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface WindowManagerButtonsProps {
  onCancel: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  isStopping: boolean;
  isStopped: boolean;
  allDisabled: boolean;
}

function WindowManagerButtons({
  onCancel,
  onMinimize,
  onExpand,
  isStopping,
  isStopped,
  allDisabled,
}: WindowManagerButtonsProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [_streamUrl, setStreamUrl] = useQueryState("streamUrl");
  const [_instanceId, setInstanceId] = useQueryState("instanceId");

  return (
    <div
      className="flex space-x-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <StopInstanceDialog
        disabled={allDisabled}
        isHovered={isHovered}
        isStopping={isStopping}
        isStopped={isStopped}
        onCancel={onCancel}
      />
      <div
        className="w-[14px] h-[14px] rounded-full bg-yellow-500/80 flex items-center justify-center relative cursor-pointer"
        onClick={() => {
          if (allDisabled) {
            setStreamUrl(null);
            setInstanceId(null);
            return;
          }
          if (isStopping || isStopped) {
            return;
          }
          onMinimize();
        }}
        role="button"
        aria-label="Minimize instance"
      >
        {isHovered && (
          <Minus
            className={cn(
              "absolute text-black w-[10px] h-[10px]",
              isStopping || isStopped || allDisabled
                ? "opacity-50"
                : "opacity-100",
            )}
          />
        )}
      </div>
      <div
        className="w-[14px] h-[14px] rounded-full bg-green-500/80 flex items-center justify-center relative cursor-pointer"
        onClick={isStopping || isStopped || allDisabled ? undefined : onExpand}
        role="button"
        aria-label="Expand instance"
      >
        {isHovered && !allDisabled && (
          <Maximize
            className={cn(
              "absolute text-black w-[10px] h-[10px]",
              isStopping || isStopped || allDisabled
                ? "opacity-50"
                : "opacity-100",
            )}
          />
        )}
      </div>
    </div>
  );
}

function BrowserView({
  children,
  handleStop,
  handlePause,
  isStopping,
  isStopped,
  allDisabled,
  handleExpand,
}: {
  children: ReactNode;
  handleStop: () => void;
  handlePause: () => void;
  isStopping: boolean;
  isStopped: boolean;
  allDisabled: boolean;
  handleExpand: () => void;
}) {
  return (
    <div className="max-w-4xl w-full h-full flex items-center justify-center p-4 my-auto pb-20">
      <div className="w-full overflow-hidden rounded-lg border border-border shadow-sm bg-card relative">
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

export function InstanceFrame() {
  const [streamUrl, setStreamUrl] = useQueryState("streamUrl");
  const [instanceId, setInstanceId] = useQueryState("instanceId");
  const [_threadId, setThreadId] = useQueryState("threadId");
  const [isStopping, setIsStopping] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [status, setStatus] = useState<
    "running" | "terminated" | "paused" | "unknown"
  >("unknown");
  const stream = useStreamContext();
  const [screenshot, setScreenshot] = useState<string>();
  const [isScreenshotHovered, setIsScreenshotHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !instanceId ||
      !stream.messages?.length
    ) {
      return;
    }

    const findAndSetScreenshot = () => {
      const lastScreenshot = stream.messages.findLast(
        (m) =>
          m.type === "tool" &&
          m.additional_kwargs?.type === "computer_call_output",
      );
      if (lastScreenshot) {
        setScreenshot(lastScreenshot.content as string);
      }
    };

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/instance/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ instanceId }),
        });
        const data = await response.json();
        console.log("data.status", data.status);
        if (["terminated", "paused", "running"].includes(data.status)) {
          setStatus(data.status);
        }

        if (data.status === "terminated") {
          setIsStopped(true);
        }
        if (["paused", "terminated"].includes(data.status)) {
          findAndSetScreenshot();
        }
      } catch (error) {
        console.error("Failed to check instance status:", error);
      }
    };

    if (status === "unknown") {
      checkStatus().finally(() => setIsLoading(false));
    }

    if (["paused", "terminated"].includes(status)) {
      findAndSetScreenshot();
      setIsLoading(false);
    }
  }, [instanceId, status, stream.messages]);

  const handleStop = async () => {
    if (!instanceId) {
      toast.warning("Instance not found", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
      return;
    }

    let loadingToastId: string | number | undefined;
    try {
      setIsStopping(true);
      loadingToastId = toast.loading("Stopping instance...", {
        richColors: true,
        closeButton: true,
        duration: 10000,
      });
      await fetch("/api/instance/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instanceId }),
      });
      setIsStopped(true);
      toast.dismiss(loadingToastId);
      toast.success("Instance stopped successfully", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
      setStreamUrl(null);
      setInstanceId(null);
    } catch (e) {
      console.error(e);
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error("Failed to stop instance", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handlePause = async () => {
    if (!instanceId) {
      toast.warning("Instance not found", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
      return;
    }

    let loadingToastId: string | number | undefined;
    try {
      setIsStopping(true);
      loadingToastId = toast.loading("Pausing instance...", {
        richColors: true,
        closeButton: true,
        duration: 10000,
      });
      await fetch("/api/instance/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instanceId }),
      });
      setStatus("paused");
      toast.dismiss(loadingToastId);
      toast.success("Instance paused successfully", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } catch (e) {
      console.error(e);
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error("Failed to pause instance", {
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } finally {
      setIsStopping(false);
    }
  };

  if (isLoading) {
    return (
      <BrowserView
        handleStop={handleStop}
        handlePause={handlePause}
        handleExpand={() => {}}
        isStopping={isStopping}
        isStopped={isStopped}
        allDisabled={false}
      >
        <div className="w-[630px] h-[420px] lg:w-[830px] lg:h-[620px] flex items-center justify-center p-4 my-auto">
          <LoaderCircle className="w-8 h-8 animate-spin" />
        </div>
      </BrowserView>
    );
  }

  if (status === "terminated" && screenshot) {
    return (
      <BrowserView
        handleStop={handleStop}
        handlePause={handlePause}
        handleExpand={() => {}}
        isStopping={isStopping}
        isStopped={isStopped}
        allDisabled={true}
      >
        <img
          src={screenshot}
          alt="Terminated instance screenshot"
          className="w-full object-contain opacity-70"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 bg-black/30">
          <div className="bg-card/90 p-6 rounded-lg shadow-lg text-center max-w-xs">
            <h3 className="text-lg font-semibold mb-2">Instance Terminated</h3>
            <p className="text-muted-foreground text-sm mb-4">
              All progress has been lost.
            </p>
            <Button
              onClick={() => {
                setStreamUrl(null);
                setInstanceId(null);
                setScreenshot(undefined);
                setStatus("unknown");
                setThreadId(null);
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-all duration-200 ease-in-out w-full"
            >
              Create New Chat
            </Button>
          </div>
        </div>
      </BrowserView>
    );
  }

  if (status === "paused" && screenshot) {
    const handleResume = async () => {
      if (!instanceId) {
        toast.warning("Instance not found", {
          richColors: true,
          closeButton: true,
          duration: 5000,
        });
        return;
      }

      let loadingToastId: string | number | undefined;
      try {
        loadingToastId = toast.loading("Resuming instance...", {
          richColors: true,
          closeButton: true,
          duration: 10000,
        });
        await fetch("/api/instance/resume", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ instanceId }),
        });
        setStatus("running");
        setScreenshot(undefined);
        toast.dismiss(loadingToastId);
        toast.success("Instance resumed successfully", {
          richColors: true,
          closeButton: true,
          duration: 5000,
        });
      } catch (e) {
        console.error(e);
        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }
        toast.error("Failed to resume instance", {
          richColors: true,
          closeButton: true,
          duration: 5000,
        });
      }
    };

    return (
      <BrowserView
        handleStop={handleStop}
        handlePause={handlePause}
        handleExpand={() => {}}
        isStopping={isStopping}
        isStopped={isStopped}
        allDisabled={true}
      >
        <div
          onMouseEnter={() => setIsScreenshotHovered(true)}
          onMouseLeave={() => setIsScreenshotHovered(false)}
        >
          <img
            src={screenshot}
            alt="Paused instance screenshot"
            className="w-full object-contain"
          />
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center pt-8 transition-all duration-300 ease-in-out gap-3",
              isScreenshotHovered
                ? "bg-black/40 opacity-100"
                : "bg-black/0 opacity-0",
            )}
          >
            <Button onClick={handleStop} variant="destructive">
              Terminate
            </Button>
            <Button onClick={handleResume}>Resume</Button>
          </div>
        </div>
      </BrowserView>
    );
  }

  if (!streamUrl) {
    return (
      <BrowserView
        handleStop={() => {}}
        handlePause={() => {}}
        handleExpand={() => {}}
        isStopping={isStopping}
        isStopped={isStopped}
        allDisabled={true}
      >
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
      </BrowserView>
    );
  }

  return (
    <BrowserView
      handleStop={handleStop}
      handlePause={handlePause}
      handleExpand={() => {}}
      isStopping={isStopping}
      isStopped={isStopped}
      allDisabled={false}
    >
      {isStopping && <div className="absolute inset-0 bg-black/20 z-10 pt-8" />}
      <iframe
        src={streamUrl}
        className="w-full h-full pt-8"
        title="Instance Frame"
        allow="clipboard-write"
      />
    </BrowserView>
  );
}
