/**
 * Airtop Adapter for LangGraph Computer Use Agent
 *
 * This module monkey-patches the LangGraph CUA's createVMInstance node
 * to use Airtop instead of Scrapybara for VM provisioning.
 *
 * Since @langchain/langgraph-cua v0.0.5 is hardcoded to Scrapybara,
 * we replace the createVMInstance function at runtime to use Airtop's API.
 */

import { AirtopClient } from "@airtop/sdk";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

// Type definitions matching LangGraph CUA
interface CUAState {
  instanceId?: string;
  streamUrl?: string;
  authenticatedId?: string;
  messages: any[];
  [key: string]: any;
}

interface CUAUpdate {
  instanceId?: string;
  streamUrl?: string;
  [key: string]: any;
}

interface CUAConfig {
  scrapybaraApiKey?: string; // We'll treat this as airtopApiKey
  timeoutHours?: number;
  environment?: "web" | "ubuntu" | "windows";
  blockedDomains?: string[];
  [key: string]: any;
}

/**
 * Airtop-based VM instance creation
 * This function replaces the Scrapybara implementation in LangGraph CUA
 */
export async function createAirtopVMInstance(
  state: CUAState,
  config: LangGraphRunnableConfig
): Promise<CUAUpdate> {
  const { instanceId } = state;

  // Instance already exists, no need to initialize
  if (instanceId) {
    return {};
  }

  // Get configuration (we'll use AIRTOP_API_KEY instead of SCRAPYBARA_API_KEY)
  const airtopApiKey =
    process.env.AIRTOP_API_KEY ||
    (config.configurable as CUAConfig)?.scrapybaraApiKey;

  if (!airtopApiKey) {
    throw new Error(
      "Airtop API key not provided. Please set AIRTOP_API_KEY environment variable."
    );
  }

  const client = new AirtopClient({
    apiKey: airtopApiKey,
  });

  // Create Airtop session
  // Note: Airtop doesn't have environment types like Scrapybara
  // We'll use the default browser session configuration
  const sessionResponse = await client.sessions.create({
    // Optional configuration can be added here
    // e.g., screen resolution, timeout, etc.
  });

  const session = sessionResponse.data;

  if (!session.id) {
    throw new Error("Failed to create Airtop session: No session ID returned");
  }

  // Get the live view URL (equivalent to Scrapybara's streamUrl)
  // Airtop provides cdpWsUrl and viceUrl for viewing
  const streamUrl = session.cdpWsUrl || session.viceUrl || "";

  console.log(`Created Airtop session: ${session.id}`);
  console.log(`Stream URL: ${streamUrl}`);

  return {
    instanceId: session.id,
    streamUrl: streamUrl,
  };
}

/**
 * Apply the Airtop adapter by monkey-patching the LangGraph CUA module
 * This should be called before createCua() is invoked
 */
export function applyAirtopAdapter(): void {
  try {
    // Import the LangGraph CUA module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cuaModule = require("@langchain/langgraph-cua/dist/nodes/create-vm-instance.js");

    // Replace the createVMInstance function with our Airtop implementation
    cuaModule.createVMInstance = createAirtopVMInstance;

    console.log("✅ Airtop adapter applied successfully to LangGraph CUA");
  } catch (error) {
    console.error("❌ Failed to apply Airtop adapter:", error);
    throw new Error(
      "Failed to apply Airtop adapter. Make sure @langchain/langgraph-cua is installed."
    );
  }
}

/**
 * Helper function to validate Airtop API key
 */
export function validateAirtopApiKey(): boolean {
  return !!process.env.AIRTOP_API_KEY;
}
