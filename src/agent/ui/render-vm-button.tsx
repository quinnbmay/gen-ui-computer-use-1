"use client";

import "./styles.css";
import { Button } from "@/components/ui/button";
import { ComputerIcon } from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";

export function RenderVMButton() {
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
      className="-full min-w-[320px] max-w-[360px] sm:max-w-[536px] sm:min-w-[500px]"
    >
      <ComputerIcon className="w-3 h-3" />
      <span className="mr-1">
        {isShowingInstanceFrame ? "Close" : "Open"} Virtual Machine View
      </span>
    </Button>
  );
}
