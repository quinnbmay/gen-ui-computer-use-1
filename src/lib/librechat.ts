/**
 * LibreChat API Client
 * Handles authentication and API calls to LibreChat backend
 */

export interface LibreChatConfig {
  baseUrl: string;
  email?: string;
  password?: string;
  token?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface Conversation {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  endpoint: string;
  model?: string;
}

export interface Message {
  messageId: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Memory {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export class LibreChatClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(config: LibreChatConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    if (config.token) {
      this.token = config.token;
    }
  }

  /**
   * Authenticate with LibreChat
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.token;
    return data;
  }

  /**
   * Set authentication token directly
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): HeadersInit {
    if (!this.token) {
      throw new Error('No authentication token set. Call login() first or set token with setToken()');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation(params: {
    title?: string;
    endpoint: string;
    model?: string;
  }): Promise<Conversation> {
    const response = await fetch(`${this.baseUrl}/api/conversations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(params: {
    conversationId: string;
    text: string;
    parentMessageId?: string;
  }): Promise<Message> {
    const response = await fetch(`${this.baseUrl}/api/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    const response = await fetch(
      `${this.baseUrl}/api/conversations/${conversationId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all conversations
   */
  async listConversations(params?: {
    limit?: number;
    before?: string;
  }): Promise<Conversation[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.before) queryParams.set('before', params.before);

    const url = `${this.baseUrl}/api/conversations${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to list conversations: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a memory entry
   */
  async createMemory(params: {
    content: string;
    metadata?: Record<string, any>;
  }): Promise<Memory> {
    const response = await fetch(`${this.baseUrl}/api/memory`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to create memory: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search memories
   */
  async searchMemories(query: string, limit: number = 10): Promise<Memory[]> {
    const response = await fetch(`${this.baseUrl}/api/memory/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, limit }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search memories: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * List memories
   */
  async listMemories(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Memory[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const url = `${this.baseUrl}/api/memory${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to list memories: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Sync memory with Supermemory
   */
  async syncMemory(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/memory/sync`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync memory: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Create a LibreChat client from environment variables
 */
export function createLibreChatClient(): LibreChatClient {
  const baseUrl = process.env.LIBRECHAT_URL || 'https://chat.combinedmemory.com';
  const token = process.env.LIBRECHAT_TOKEN;

  const client = new LibreChatClient({ baseUrl });

  if (token) {
    client.setToken(token);
  }

  return client;
}
