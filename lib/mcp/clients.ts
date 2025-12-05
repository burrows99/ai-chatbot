import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";

/**
 * Get all available MCP tools from configured servers
 * Creates fresh clients, gets tools, and returns them along with a cleanup function
 * Returns empty object if no servers are configured
 */
export async function getMCPTools() {
  const clients: Awaited<ReturnType<typeof createMCPClient>>[] = [];
  const allTools: Record<string, any> = {};

  // Try GitHub tools if configured
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_MCP_URL) {
    try {
      const githubClient = await createMCPClient({
        transport: {
          type: "http",
          url: process.env.GITHUB_MCP_URL,
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      });
      clients.push(githubClient);

      const githubTools = await githubClient.tools();
      Object.assign(allTools, githubTools);
    } catch (error) {
      console.warn(
        "GitHub MCP tools unavailable:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return {
    tools: allTools,
    cleanup: async () => {
      await Promise.all(clients.map((client) => client.close()));
    },
  };
}
