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
  (xml: string, explanation: string): { success: boolean; error?: string };
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
 * @param currentSPA Optional current SPA XML in the editor for context
 * @returns Updated messages array with assistant response
 */
export async function sendChatMessages(
  messages: Message[],
  apiKey: string,
  onEditorUpdate?: EditorUpdateCallback,
  currentSPA?: string
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
    let systemPrompt = await getSystemPrompt();

    // Add current SPA context if provided
    if (currentSPA && currentSPA.trim()) {
      systemPrompt += `\n\n## Current Editor State\n\nThe user currently has the following SPA XML in their editor:\n\n\`\`\`xml\n${currentSPA}\n\`\`\`\n\nWhen the user asks you to modify, adjust, or improve the sound, use this as the starting point. When generating new XML with the update_spa_editor tool, include your modifications to this existing code.`;
    }

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
    let toolUseBlock = data.content?.find((block: any) => block.type === 'tool_use');

    if (toolUseBlock && onEditorUpdate) {
      const MAX_RETRIES = 3;
      let attempt = 0;
      let currentMessages = anthropicMessages;
      let currentResponse = data;

      // Retry loop for tool execution
      while (attempt < MAX_RETRIES) {
        attempt++;
        toolUseBlock = currentResponse.content?.find((block: any) => block.type === 'tool_use');

        if (!toolUseBlock) {
          // No more tool use - Claude gave up or provided a text response
          break;
        }

        const toolInput = toolUseBlock.input;

        // Execute the tool (update the editor)
        const result = onEditorUpdate(toolInput.xml, toolInput.explanation);

        // Build tool result messages
        const toolResultMessages: AnthropicMessage[] = [
          ...currentMessages,
          {
            role: 'assistant',
            content: JSON.stringify(currentResponse.content),
          },
          {
            role: 'user',
            content: JSON.stringify([
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: result.success
                  ? 'Successfully updated the editor with the new SPA XML.'
                  : `Failed to update the editor. Error: ${result.error || 'The XML may be invalid.'}. Please try again with corrected XML.`,
              },
            ]),
          },
        ];

        // Make another request to get Claude's response
        const followUpResponse = await fetch('https://api.anthropic.com/v1/messages', {
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

        if (!followUpResponse.ok) {
          const errorData = await followUpResponse.json().catch(() => ({}));
          throw new Error(
            `Anthropic API error: ${followUpResponse.status} ${followUpResponse.statusText} - ${JSON.stringify(errorData)}`
          );
        }

        const followUpData = await followUpResponse.json();

        // If tool execution succeeded, return the final message
        if (result.success) {
          const finalMessage =
            followUpData.content?.find((block: any) => block.type === 'text')?.text ||
            toolInput.explanation;

          return [
            ...messages,
            {
              role: 'assistant',
              content: finalMessage,
            },
          ];
        }

        // Tool execution failed - check if Claude wants to retry
        const hasAnotherToolUse = followUpData.content?.some(
          (block: any) => block.type === 'tool_use'
        );

        if (hasAnotherToolUse) {
          // Claude is trying again - continue the loop
          currentMessages = toolResultMessages;
          currentResponse = followUpData;
        } else {
          // Claude gave up - return the text response
          const finalMessage =
            followUpData.content?.find((block: any) => block.type === 'text')?.text ||
            `I apologize, but I couldn't generate valid SPA XML after ${attempt} attempt(s). ${result.error || 'Please try describing the sound differently.'}`;

          return [
            ...messages,
            {
              role: 'assistant',
              content: finalMessage,
            },
          ];
        }
      }

      // Exceeded max retries
      return [
        ...messages,
        {
          role: 'assistant',
          content: `I apologize, but I couldn't generate valid SPA XML after ${MAX_RETRIES} attempts. Please try describing the sound differently or check the SPA specification.`,
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
