import {
  createCua,
  CUAAnnotation,
  CUAState,
  CUAUpdate,
  getToolOutputs,
  isComputerCallToolMessage,
} from "@langchain/langgraph-cua";
import {
  typedUi,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui/server";
import type ComponentMap from "./ui/index";
import { Annotation, LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";

const GraphAnnotation = Annotation.Root({
  ...CUAAnnotation.spec,
  ui: Annotation<
    UIMessage[],
    UIMessage | RemoveUIMessage | (UIMessage | RemoveUIMessage)[]
  >({ default: () => [], reducer: uiMessageReducer }),
});

type GraphState = typeof GraphAnnotation.State & CUAState;

async function beforeNode(
  state: GraphState,
  config: LangGraphRunnableConfig,
): Promise<CUAUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = getToolOutputs(lastMessage);

  const hasRenderVMButton = state.ui.some(
    (message) => message.name === "render-vm-button",
  );
  const hasInstanceFrame = state.ui.some(
    (message) => message.name === "instance",
  );

  if (state.instanceId && state.streamUrl) {
    if (!hasInstanceFrame) {
      ui.push(
        {
          name: "instance",
          props: {
            instanceId: state.instanceId,
            streamUrl: state.streamUrl,
          },
        },
        {
          message: lastMessage,
        },
      );
    }

    // Check if there are any UI messages in state. If there are not, we can assume the UI button for rendering the VM is not visible
    if (!hasRenderVMButton) {
      ui.push(
        {
          name: "render-vm-button",
          props: {
            instanceId: state.instanceId,
            streamUrl: state.streamUrl,
          },
        },
        {
          message: lastMessage,
        },
      );
    }
  }

  if (toolCalls?.length) {
    toolCalls.map((tc) => {
      ui.push(
        {
          name: "computer-use-tool-call",
          props: {
            toolCallId: tc.id,
            action: tc.action,
          },
        },
        {
          message: lastMessage,
        },
      );
    });
  }

  return {};
}

async function afterNode(
  state: GraphState,
  config: LangGraphRunnableConfig,
): Promise<CUAUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);
  const lastMessage = state.messages[state.messages.length - 1];
  if (isComputerCallToolMessage(lastMessage)) {
    ui.push(
      {
        name: "computer-use-tool-output",
        props: {
          toolCallId: lastMessage.tool_call_id,
          screenshot: lastMessage.content as string,
        },
      },
      {
        message: lastMessage,
      },
    );
  }

  return {};
}

export const graph = createCua({
  nodeBeforeAction: beforeNode,
  nodeAfterAction: afterNode,
  stateModifier: GraphAnnotation,
  recursionLimit: 150,
  timeoutHours: 0.1,
  zdrEnabled: true,
});

// function formatMessages(state: GraphState, config: LangGraphRunnableConfig) {
//   const { messages } = state;
//   // Get the most recent AI message with computer tool calls
//   const lastAiMsgToolCall = messages.findLast((m) => {
//     if (m.getType() !== "ai") {
//       return false;
//     }
//     const toolCalls = getToolOutputs(m);
//     return !!toolCalls?.length;
//   }) as AIMessage | undefined;
//   // Get the tool calls from the last AI message, if exists
//   const toolCalls = lastAiMsgToolCall
//     ? getToolOutputs(lastAiMsgToolCall)
//     : undefined;

//   // If there is no last AI message with tool calls, proceed as normal
//   if (!lastAiMsgToolCall || !toolCalls) {
//     return {};
//   }

//   // If there are tool calls, look for the matching tool response
//   const lastToolCallId = toolCalls[toolCalls.length - 1].call_id;
//   const matchingToolMessage = messages.find(
//     (m) => isComputerCallToolMessage(m) && m.tool_call_id === lastToolCallId,
//   );

//   if (matchingToolMessage) {
//     // There is a matching tool response to the latest tool call. We can proceed as normal
//     return {};
//   }

//   // There is no matching tool response to the latest tool call. We must remove it from the state
//   const removeMsg = new RemoveMessage({ id: lastAiMsgToolCall.id ?? "" });
//   return {
//     messages: [removeMsg],
//   };
// }

// const workflow = new StateGraph(GraphAnnotation)
//   .addNode("formatMessages", formatMessages)
//   .addNode("cua", cua)
//   .addEdge(START, "formatMessages")
//   .addEdge("formatMessages", "cua")
//   .addEdge("cua", END);

// export const graph = workflow.compile();
