"use client";

import "./styles.css";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
