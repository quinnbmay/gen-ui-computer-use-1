"use client";

import "./styles.css";
import { Button } from "@/components/ui/button";
import { ComputerIcon } from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";

interface RenderVMButtonProps {
  instanceId: string;
  streamUrl: string;
}

export function RenderVMButton(props: RenderVMButtonProps) {
  const { instanceId, streamUrl } = props;
  const [isShowingInstanceFrame, setIsShowingInstanceFrame] = useQueryState(
    "isShowingInstanceFrame",
    parseAsBoolean,
  );

  const onClick = () => {
    setIsShowingInstanceFrame((p) => !p);
  };

  return (
    <Button
      onClick={onClick}
      variant="secondary"
      className="w-full max-w-[536px]"
    >
      <ComputerIcon className="w-3 h-3" />
      <span className="mr-1">
        {isShowingInstanceFrame ? "Close" : "Open"} Virtual Machine View
      </span>
    </Button>
  );
}
