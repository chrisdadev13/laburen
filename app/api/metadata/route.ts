// Agent metadata interface
interface AgentMetadata {
  name: string;
  description: string;
  tools: string[];
}

interface ToolMetadata {
  name: string;
  description: string;
  agent: string;
}

interface MetadataResponse {
  agents: AgentMetadata[];
  tools: ToolMetadata[];
}

export async function GET() {
  try {
    const agents: AgentMetadata[] = [
      {
        name: "Business Assistant",
        description: "An intelligent employee assistant with access to company knowledge base and business tools",
        tools: [
          "signUp",
          "signIn",
          "signOut",
          "createSalesOrder",
          "getRecentOrders",
          "searchDocs",
          "getDocContent",
          "listDocs"
        ],
      },
    ];

    const tools: ToolMetadata[] = [
      {
        name: "signUp",
        description: "Sign up a new user with username and password. Use this when the user wants to create a new account.",
        agent: "Business Assistant",
      },
      {
        name: "signIn",
        description: "Sign in an existing user with their username and password. Use this when the user wants to log in.",
        agent: "Business Assistant",
      },
      {
        name: "signOut",
        description: "Sign out the current user. Use this when the user wants to log out.",
        agent: "Business Assistant",
      },
      {
        name: "createSalesOrder",
        description: "Create a new sales order in the system. Use this when the user wants to place an order or record a sale.",
        agent: "Business Assistant",
      },
      {
        name: "getRecentOrders",
        description: "Retrieve recent sales orders. Use this when the user wants to view, list, or check their orders.",
        agent: "Business Assistant",
      },
      {
        name: "searchDocs",
        description: "Search the company knowledge base for information about products, policies, and technical documentation using semantic search.",
        agent: "Business Assistant",
      },
      {
        name: "getDocContent",
        description: "Retrieve the full content of a specific document from the knowledge base by ID or title.",
        agent: "Business Assistant",
      },
      {
        name: "listDocs",
        description: "List all available documents in the company knowledge base with their titles and metadata.",
        agent: "Business Assistant",
      },
    ];

    const response: MetadataResponse = {
      agents,
      tools,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating metadata:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate metadata" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}