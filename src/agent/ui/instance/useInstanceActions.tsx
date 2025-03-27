import { useState } from "react";
import { toast } from "sonner";

export function useInstanceActions({ instanceId }: { instanceId: string }) {
  const [isStopping, setIsStopping] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [status, setStatus] = useState<
    "running" | "terminated" | "paused" | "unknown"
  >("unknown");
  const [screenshot, setScreenshot] = useState<string>();
  const [isScreenshotHovered, setIsScreenshotHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

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
      setStatus("terminated");
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

  const handleExpand = () => {
    setIsExpanded((e) => !e);
  };

  return {
    handleStop,
    handlePause,
    handleResume,
    handleExpand,
    isStopping,
    setIsStopped,
    isStopped,
    setStatus,
    status,
    setScreenshot,
    screenshot,
    setIsScreenshotHovered,
    isScreenshotHovered,
    setIsLoading,
    isLoading,
    isExpanded,
  };
}
