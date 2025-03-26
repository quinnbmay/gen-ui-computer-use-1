"use client";

import "./styles.css";
import type { ResponseComputerToolCall } from "openai/resources/responses/responses";
import {
  ArrowLeftRight,
  ArrowDownUp,
  Camera,
  Clock,
  MousePointer,
  Pointer,
  Type as TypeIcon,
  Mouse,
  KeyRound,
  ChevronDown,
  ChevronUp,
  ComputerIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface ComputerUseToolCallProps {
  toolCallId: string;
  action: ResponseComputerToolCall["action"];
}

export function ComputerUseToolCall(props: ComputerUseToolCallProps) {
  const { toolCallId, action } = props;

  const renderActionContent = () => {
    switch (action.type) {
      case "click":
        return (
          <div className="flex items-center justify-start gap-2">
            <Mouse className="w-4 h-4 text-blue-500" />
            <p>
              Click ({action.button}) at x: {action.x}, y: {action.y}
            </p>
          </div>
        );
      case "double_click":
        return (
          <div className="flex items-center justify-start gap-2">
            <Pointer className="w-4 h-4 text-blue-500" />
            <p>
              Double click at x: {action.x}, y: {action.y}
            </p>
          </div>
        );
      case "drag":
        return (
          <div className="flex items-center justify-start gap-2">
            <MousePointer className="w-4 h-4 text-purple-500" />
            <p>
              Drag from ({action.path[0]?.x}, {action.path[0]?.y}) to (
              {action.path[action.path.length - 1]?.x},{" "}
              {action.path[action.path.length - 1]?.y})
            </p>
          </div>
        );
      case "keypress":
        return (
          <div className="flex items-center justify-start gap-2">
            <KeyRound className="w-4 h-4 text-green-500" />
            <p>Keypress: {action.keys.join(" + ")}</p>
          </div>
        );
      case "move":
        return (
          <div className="flex items-center justify-start gap-2">
            <MousePointer className="w-4 h-4 text-gray-500" />
            <p>
              Move to x: {action.x}, y: {action.y}
            </p>
          </div>
        );
      case "screenshot":
        return (
          <div className="flex items-center justify-start gap-2">
            <Camera className="w-4 h-4 text-indigo-500" />
            <p>Take screenshot</p>
          </div>
        );
      case "scroll":
        return (
          <div className="flex items-center justify-start gap-2">
            <div className="flex flex-col">
              <ArrowLeftRight className="w-4 h-4 text-amber-500" />
              <ArrowDownUp className="w-4 h-4 text-amber-500" />
            </div>
            <p>
              Scroll x: {action.scroll_x}, y: {action.scroll_y} at position (
              {action.x}, {action.y})
            </p>
          </div>
        );
      case "type":
        return (
          <div className="flex items-center justify-start gap-2">
            <TypeIcon className="w-4 h-4 text-teal-500" />
            <p>Type: "{action.text}"</p>
          </div>
        );
      case "wait":
        return <WaitCountdown toolCallId={toolCallId} />;
      default: {
        // Handle PendingSafetyCheck or any other cases
        const pendingCheck =
          action as unknown as ResponseComputerToolCall.PendingSafetyCheck;
        if ("code" in pendingCheck && "message" in pendingCheck) {
          return (
            <div className="flex items-center justify-start gap-2">
              <span className="text-yellow-500">⚠️</span>
              <p>Safety check: {pendingCheck.message}</p>
            </div>
          );
        }
        return <span>Unknown action</span>;
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start max-w-[536px] min-w-[500px] w-full border rounded-md bg-gray-50">
      <div className="flex items-center gap-2 px-3 py-2 border-b-[1px] border-gray-200 w-full">
        <p className="text-sm font-medium">Computer Action</p>
        <p className="text-xs font-light text-gray-500">{toolCallId}</p>
      </div>
      <div className="w-full px-3 pb-2">{renderActionContent()}</div>
    </div>
  );
}

interface ComputerUseToolOutputProps {
  toolCallId: string;
  /**
   * The base64 encoded screenshot of the computer
   */
  screenshot: string;
}

function WaitCountdown({ toolCallId }: { toolCallId: string }) {
  const [isMostRecent, setIsMostRecent] = useState(true);
  const [timeLeft, setTimeLeft] = useState(2000); // Start at 2000ms
  const state = useStreamContext();

  useEffect(() => {
    if (!isMostRecent) return;
    const mostRecentToolCall = state.messages[state.messages.length - 1];
    if (
      mostRecentToolCall.type !== "tool" ||
      mostRecentToolCall.tool_call_id !== toolCallId
    ) {
      setIsMostRecent(false);
      setTimeLeft(0); // Set timeLeft to 0 when no longer the most recent
    }
  }, [state.messages]);

  useEffect(() => {
    // Don't set up the interval if we've already counted down to zero
    if (timeLeft <= 0) return;

    // Set up interval to update every 100ms
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 100;
        return newTime < 0 ? 0 : newTime;
      });
    }, 100);

    // Clean up the interval when component unmounts or when timeLeft reaches 0
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // Format the time to display with 1 decimal place
  const displayTime = (timeLeft / 1000).toFixed(1);

  return (
    <div className="flex items-center justify-start gap-2">
      <Clock className="w-4 h-4 text-gray-400" />
      <p>Wait: {displayTime}s</p>
    </div>
  );
}

export function ComputerUseToolOutput(props: ComputerUseToolOutputProps) {
  const { screenshot, toolCallId } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 items-start justify-start max-w-[536px] min-w-[500px] w-full p-3 border rounded-md bg-gray-50">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Computer Output</p>
          <p className="text-xs font-light text-gray-500">{toolCallId}</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-xs text-blue-500 hover:text-blue-700 transition-colors"
        >
          <span className="mr-1">
            {isExpanded ? "Hide" : "Show"} screenshot
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="max-w-[536px] w-full mt-2 border border-gray-200 rounded overflow-hidden">
          <img
            src={screenshot}
            alt="Computer screenshot"
            className="max-w-[536px] w-full h-[384px]"
          />
        </div>
      )}
    </div>
  );
}

interface RenderVMButtonProps {
  instanceId: string;
  streamUrl: string;
}

function RenderVMButton(props: RenderVMButtonProps) {
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

const ComponentMap = {
  "computer-use-tool-output": ComputerUseToolOutput,
  "computer-use-tool-call": ComputerUseToolCall,
  "render-vm-button": RenderVMButton,
} as const;
export default ComponentMap;
