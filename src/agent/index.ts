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

  const renderVMButton = state.ui.find(
    (message) => message.name === "render-vm-button",
  );
  const instanceFrame = state.ui.find((message) => message.name === "instance");

  if (state.instanceId && state.streamUrl) {
    if (!instanceFrame) {
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
    } else if (
      instanceFrame.props.instanceId !== state.instanceId ||
      instanceFrame.props.streamUrl !== state.streamUrl
    ) {
      // First, remove the existing instance frame
      ui.delete(instanceFrame.id);
      // Then, add the new instance frame
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
    if (!renderVMButton) {
      ui.push(
        {
          name: "render-vm-button",
          props: {},
          metadata: {
            instanceId: state.instanceId,
            streamUrl: state.streamUrl,
          },
        },
        {
          message: lastMessage,
        },
      );
    } else if (
      renderVMButton.metadata.instanceId !== state.instanceId ||
      renderVMButton.metadata.streamUrl !== state.streamUrl
    ) {
      // There is a render VM button, but it's tied to an old instance. Push a new one.
      // This will improve the UX so the render button is "closer" in the UI to the new request
      ui.delete(renderVMButton.id);
      ui.push(
        {
          name: "render-vm-button",
          props: {},
          metadata: {
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
});
