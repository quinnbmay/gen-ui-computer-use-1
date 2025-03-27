"use client";

import "./styles.css";
import { Button } from "@/components/ui/button";
import { ComputerIcon } from "lucide-react";

interface RenderVMButtonProps {
  instanceId: string;
  streamUrl: string;
}

export function RenderVMButton(props: RenderVMButtonProps) {
  const { instanceId, streamUrl } = props;

  const onClick = () => {
    // Create a URL object based on the current URL
    const url = new URL(window.location.href);

    // Set or update the query parameters
    url.searchParams.set("instanceId", instanceId);
    url.searchParams.set("streamUrl", streamUrl);

    // Update the URL without refreshing the page
    window.history.pushState({}, "", url.toString());
  };

  return (
    <Button
      onClick={onClick}
      variant="secondary"
      className="w-full max-w-[536px]"
    >
      <ComputerIcon className="w-3 h-3" />
      <span className="mr-1">Open Virtual Machine View</span>
    </Button>
  );
}