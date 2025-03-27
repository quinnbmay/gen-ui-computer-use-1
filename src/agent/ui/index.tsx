import { ComputerUseToolCall } from "./computer-use-tool-call";
import { ComputerUseToolOutput } from "./computer-use-tool-output";
import { RenderVMButton } from "./render-vm-button";

const ComponentMap = {
  "computer-use-tool-output": ComputerUseToolOutput,
  "computer-use-tool-call": ComputerUseToolCall,
  "render-vm-button": RenderVMButton,
} as const;
export default ComponentMap;
