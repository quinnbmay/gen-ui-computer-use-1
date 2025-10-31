import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string) {
  const client = new Client({
    apiUrl,
  });

  // Monkey-patch the UI client to use our proxy route
  // This fixes mixed content errors by routing through our Next.js API
  const originalUiClient = (client as any)["~ui"];
  if (originalUiClient && typeof originalUiClient.getComponent === "function") {
    const originalGetComponent = originalUiClient.getComponent.bind(originalUiClient);

    originalUiClient.getComponent = async function(namespace: string, name: string) {
      try {
        // Call our proxy route instead of the backend directly
        const response = await fetch(`/api/ui-proxy/${namespace}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          throw new Error(`Proxy request failed: ${response.statusText}`);
        }

        return await response.text();
      } catch (error) {
        console.error("Error fetching component through proxy:", error);
        // Fallback to original method if proxy fails
        return originalGetComponent(namespace, name);
      }
    };
  }

  return client;
}
