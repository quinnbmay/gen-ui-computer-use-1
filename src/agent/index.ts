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
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { createLibreChatClient } from "@/lib/librechat";
import { applyAirtopAdapter } from "@/lib/cua-airtop-adapter";

// Apply Airtop adapter to replace Scrapybara in LangGraph CUA
applyAirtopAdapter();

const GraphAnnotation = Annotation.Root({
  ...CUAAnnotation.spec,
  ui: Annotation<
    UIMessage[],
    UIMessage | RemoveUIMessage | (UIMessage | RemoveUIMessage)[]
  >({ default: () => [], reducer: uiMessageReducer }),
  libreChatConversationId: Annotation<string | null>({
    default: () => null,
    reducer: (state, value) => value ?? state,
  }),
});

type GraphState = typeof GraphAnnotation.State & CUAState;

// Initialize LibreChat client
let libreChatClient: ReturnType<typeof createLibreChatClient> | null = null;

function getLibreChatClient() {
  if (!libreChatClient && process.env.LIBRECHAT_TOKEN) {
    libreChatClient = createLibreChatClient();
  }
  return libreChatClient;
}

function convertBase64ToBlob(screenshot: string): Blob | null {
  let base64Data = screenshot;
  if (screenshot.startsWith("data:image/png;base64,")) {
    base64Data = screenshot.slice("data:image/png;base64,".length);
  }

  try {
    // Decode the base64 string
    const byteCharacters = atob(base64Data);
    // Create an array of byte values
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    // Convert to a typed array
    const byteArray = new Uint8Array(byteNumbers);
    // Create and return the Blob
    return new Blob([byteArray], { type: "image/png" });
  } catch (error) {
    console.error("Failed to convert base64 to Blob:", error);
    // Return null or handle the error as appropriate
    return null;
  }
}

async function uploadScreenshot(screenshot: string): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseApiKey = process.env.SUPABASE_API_KEY;
  if (!supabaseUrl || !supabaseApiKey) {
    throw new Error("Missing Supabase credentials");
  }

  const bucketName = "cua-screenshots";

  const client = createClient(supabaseUrl, supabaseApiKey);

  const fileName = `${uuidv4()}.png`;

  const blob = convertBase64ToBlob(screenshot);
  if (!blob) {
    console.error("Failed to convert screenshot to blob. Aborting upload.");
    throw new Error("Failed to process screenshot for upload.");
  }

  const { error: uploadError } = await client.storage
    .from(bucketName)
    .upload(fileName, blob, {
      contentType: "image/png",
      duplex: "half",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
  }

  const expiresIn = 60 * 60 * 24 * 90; // 90 days

  const { data, error: signedUrlError } = await client.storage
    .from(bucketName)
    .createSignedUrl(fileName, expiresIn);

  if (signedUrlError) {
    throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
  }

  return data.signedUrl;
}

/**
 * Log message to LibreChat if configured
 */
async function logMessageToLibreChat(
  state: GraphState,
  message: string,
  sender: 'user' | 'assistant'
): Promise<string | null> {
  const client = getLibreChatClient();
  if (!client) return null;

  try {
    // Create conversation if it doesn't exist
    if (!state.libreChatConversationId) {
      const conversation = await client.createConversation({
        title: 'Computer Use Agent Session',
        endpoint: 'computer-use',
        model: 'gpt-4',
      });
      return conversation.conversationId;
    }

    // Send message to existing conversation
    await client.sendMessage({
      conversationId: state.libreChatConversationId,
      text: message,
    });

    return state.libreChatConversationId;
  } catch (error) {
    console.error('Failed to log message to LibreChat:', error);
    return state.libreChatConversationId;
  }
}

/**
 * Store important context in LibreChat memory
 */
async function storeMemory(content: string): Promise<void> {
  const client = getLibreChatClient();
  if (!client) return;

  try {
    await client.createMemory({
      content,
      metadata: {
        source: 'computer-use-agent',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to store memory:', error);
  }
}

async function beforeNode(
  state: GraphState,
  config: LangGraphRunnableConfig,
): Promise<CUAUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);
  const lastMessage = state.messages[state.messages.length - 1];

  // Log user message to LibreChat
  if (lastMessage && 'content' in lastMessage && typeof lastMessage.content === 'string') {
    const conversationId = await logMessageToLibreChat(state, lastMessage.content, 'user');
    if (conversationId && !state.libreChatConversationId) {
      return {
        libreChatConversationId: conversationId,
      };
    }
  }
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

  // Log assistant response to LibreChat
  if (lastMessage && 'content' in lastMessage && typeof lastMessage.content === 'string') {
    await logMessageToLibreChat(state, lastMessage.content, 'assistant');

    // Store important computer use actions as memories
    if (isComputerCallToolMessage(lastMessage)) {
      const toolCall = 'tool_call_id' in lastMessage ? lastMessage.tool_call_id : 'unknown';
      await storeMemory(`Computer action performed: ${toolCall}`);
    }
  }

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
  uploadScreenshot,
});
