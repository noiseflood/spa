/**
 * LLM Service for client-side AI interactions
 * This will be analogous to a backend service we'll write later
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  // For now, return a mock response
  // TODO: Implement actual Anthropic API call

  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    ...messages,
    {
      role: 'assistant',
      content: 'I understand you want to work with SPA audio. This feature is coming soon! For now, try exploring the presets to see examples of different sound effects.',
    },
  ];
}
