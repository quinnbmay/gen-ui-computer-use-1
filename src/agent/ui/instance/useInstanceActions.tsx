export function useInstanceActions({ instanceId }) {
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

  return {
    handleStop,
    handlePause,
    handleResume,
  }
}