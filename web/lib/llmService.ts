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

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

const TOOLS: AnthropicTool[] = [
  {
    name: 'update_spa_editor',
    description: 'Updates the SPA sound editor with new XML markup. Use this when the user asks you to create, modify, or generate a sound effect. The XML must be complete and valid SPA format.',
    input_schema: {
      type: 'object',
      properties: {
        xml: {
          type: 'string',
          description: 'Complete SPA XML markup including <?xml> declaration, <spa> root element with xmlns and version attributes, and all sound elements. Must be valid and well-formed.',
        },
        explanation: {
          type: 'string',
          description: 'Brief explanation of what the sound does and the design choices made.',
        },
      },
      required: ['xml', 'explanation'],
    },
  },
];

export interface EditorUpdateCallback {
  (xml: string, explanation: string): boolean;
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
 * @param onEditorUpdate Optional callback to update the editor when tool is used
 * @returns Updated messages array with assistant response
 */
export async function sendChatMessages(
  messages: Message[],
  apiKey: string,
  onEditorUpdate?: EditorUpdateCallback
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
        tools: TOOLS,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Anthropic API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Check if Claude wants to use a tool
    const toolUseBlock = data.content?.find((block: any) => block.type === 'tool_use');

    if (toolUseBlock && onEditorUpdate) {
      // Claude wants to use the update_spa_editor tool
      const toolInput = toolUseBlock.input;

      // Execute the tool (update the editor)
      const success = onEditorUpdate(toolInput.xml, toolInput.explanation);

      // Send tool result back to Claude to get final response
      const toolResultMessages: AnthropicMessage[] = [
        ...anthropicMessages,
        {
          role: 'assistant',
          content: JSON.stringify(data.content),
        },
        {
          role: 'user',
          content: JSON.stringify([
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: success
                ? 'Successfully updated the editor with the new SPA XML.'
                : 'Failed to update the editor. The XML may be invalid.',
            },
          ]),
        },
      ];

      // Make another request to get Claude's final text response
      const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
          messages: toolResultMessages,
          tools: TOOLS,
        }),
      });

      if (!finalResponse.ok) {
        const errorData = await finalResponse.json().catch(() => ({}));
        throw new Error(
          `Anthropic API error: ${finalResponse.status} ${finalResponse.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      const finalData = await finalResponse.json();
      const finalMessage = finalData.content?.find((block: any) => block.type === 'text')?.text || toolInput.explanation;

      return [
        ...messages,
        {
          role: 'assistant',
          content: finalMessage,
        },
      ];
    }

    // No tool use - extract regular text response
    const textBlock = data.content?.find((block: any) => block.type === 'text');
    const assistantMessage = textBlock?.text || 'Sorry, I could not generate a response.';

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
