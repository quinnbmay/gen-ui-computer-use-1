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
} from "lucide-react";
import { useState } from "react";

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
          <div className="flex items-center gap-2">
            <Mouse className="w-4 h-4 text-blue-500" />
            <span>
              Click ({action.button}) at x: {action.x}, y: {action.y}
            </span>
          </div>
        );
      case "double_click":
        return (
          <div className="flex items-center gap-2">
            <Pointer className="w-4 h-4 text-blue-500" />
            <span>
              Double click at x: {action.x}, y: {action.y}
            </span>
          </div>
        );
      case "drag":
        return (
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-purple-500" />
            <span>
              Drag from ({action.path[0]?.x}, {action.path[0]?.y}) to (
              {action.path[action.path.length - 1]?.x},{" "}
              {action.path[action.path.length - 1]?.y})
            </span>
          </div>
        );
      case "keypress":
        return (
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-green-500" />
            <span>Keypress: {action.keys.join(" + ")}</span>
          </div>
        );
      case "move":
        return (
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-gray-500" />
            <span>
              Move to x: {action.x}, y: {action.y}
            </span>
          </div>
        );
      case "screenshot":
        return (
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-500" />
            <span>Take screenshot</span>
          </div>
        );
      case "scroll":
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <ArrowLeftRight className="w-4 h-4 text-amber-500" />
              <ArrowDownUp className="w-4 h-4 text-amber-500" />
            </div>
            <span>
              Scroll x: {action.scroll_x}, y: {action.scroll_y} at position (
              {action.x}, {action.y})
            </span>
          </div>
        );
      case "type":
        return (
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-teal-500" />
            <span>Type: "{action.text}"</span>
          </div>
        );
      case "wait":
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Wait</span>
          </div>
        );
      default: {
        // Handle PendingSafetyCheck or any other cases
        const pendingCheck =
          action as unknown as ResponseComputerToolCall.PendingSafetyCheck;
        if ("code" in pendingCheck && "message" in pendingCheck) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">⚠️</span>
              <span>Safety check: {pendingCheck.message}</span>
            </div>
          );
        }
        return <span>Unknown action</span>;
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start w-full p-3 border rounded-md bg-gray-50">
      <p className="text-xs font-light text-gray-500">{toolCallId}</p>
      <div className="w-full">{renderActionContent()}</div>
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

export function ComputerUseToolOutput(props: ComputerUseToolOutputProps) {
  const { screenshot, toolCallId } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 items-start justify-start w-full p-3 border rounded-md bg-gray-50">
      <div className="flex justify-between items-center w-full">
        <p className="text-xs font-light text-gray-500">{toolCallId}</p>
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
        <div className="w-full mt-2 border border-gray-200 rounded overflow-hidden">
          <img
            src={`data:image/png;base64,${screenshot}`}
            alt="Computer screenshot"
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}

const ComponentMap = {
  "computer-use-tool-output": ComputerUseToolOutput,
  "computer-use-tool-call": ComputerUseToolCall,
} as const;
export default ComponentMap;
