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
    <div className="flex flex-col gap-2 items-start justify-start w-full min-w-[320px] max-w-[360px] p-3 border rounded-md bg-gray-50 sm:max-w-[536px] sm:min-w-[500px]">
      {/* Desktop and mobile header row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full gap-1 lg:gap-0">
        {/* Mobile layout: Title and toggle button in first row */}
        <div className="flex justify-between items-center w-full lg:hidden">
          <p className="text-sm font-medium">Computer Output</p>
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

        {/* Desktop layout: Title and ID on left, button on right */}
        <div className="hidden lg:flex lg:items-center lg:gap-2 lg:flex-grow">
          <p className="text-sm font-medium">Computer Output</p>
          <p className="text-xs font-light text-gray-500">{toolCallId}</p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden lg:flex items-center text-xs text-blue-500 hover:text-blue-700 transition-colors"
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

        {/* Mobile only: Tool call ID in second row */}
        <p className="text-xs font-light text-gray-500 w-full lg:hidden">
          {toolCallId}
        </p>
      </div>

      {/* Screenshot container */}
      {isExpanded && (
        <div className="w-full mt-2 border border-gray-200 rounded overflow-hidden lg:max-w-[536px]">
          <img
            src={screenshot}
            alt="Computer screenshot"
            className="w-full h-auto lg:h-[384px] lg:max-w-[536px]"
          />
        </div>
      )}
    </div>
  );
}
