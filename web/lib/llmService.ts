/**
 * LLM Service for client-side AI interactions
 * System prompt is loaded from /public/system-prompt.md at runtime
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Cache for the system prompt
let cachedSystemPrompt: string | null = null;

/**
 * Fetch and cache the system prompt from the public directory
 */
async function getSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  try {
    const response = await fetch('/system-prompt.md');
    if (!response.ok) {
      throw new Error(`Failed to load system prompt: ${response.statusText}`);
    }
    const promptContent = await response.text();

    // Add AI-specific instructions at the end
    cachedSystemPrompt = `${promptContent}

You are an expert sound designer helping users create SPA audio files. When a user asks for a sound:
1. Generate valid SPA XML code
2. Explain your design choices briefly
3. Format the XML in a code block
4. Keep sounds simple and effective

Always ensure your XML is valid and follows the SPA specification exactly.`;

    return cachedSystemPrompt;
  } catch (error) {
    console.error('Error loading system prompt:', error);
    // Fallback to a minimal prompt if loading fails
    return 'You are an expert sound designer helping users create SPA (Synthetic Parametric Audio) files. Generate valid SPA XML when requested.';
  }
}

/**
 * Send chat messages to the LLM and get a response
 * @param messages Array of chat messages
 * @param apiKey Anthropic API key
 * @returns Updated messages array with assistant response
 */
export async function sendChatMessages(
  messages: Message[],
  apiKey: string
): Promise<Message[]> {
  // Filter out the initial welcome message if it's still there
  const conversationMessages = messages.filter(
    (msg) =>
      !(
        msg.role === 'assistant' &&
        msg.content.includes('👋 Welcome to the SPA Sound Editor!')
      )
  );

  // Convert messages to Anthropic format
  const anthropicMessages: AnthropicMessage[] = conversationMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  try {
    // Load the system prompt at runtime
    const systemPrompt = await getSystemPrompt();

    // Call Anthropic API directly from the browser using the CORS header
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Anthropic API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Extract the assistant's message
    const assistantMessage = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    // Return the updated messages array
    return [
      ...messages,
      {
        role: 'assistant',
        content: assistantMessage,
      },
    ];
  } catch (error) {
    console.error('Error calling chat API:', error);
    throw error;
  }
}
