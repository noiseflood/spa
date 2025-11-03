/**
 * LLM Service for client-side AI interactions
 * System prompt is loaded from /public/system-prompt.md at runtime
 */

import Anthropic from '@anthropic-ai/sdk';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_spa_editor',
    description:
      'Updates the SPA sound editor with new XML markup. Use this when the user asks you to create, modify, or generate a sound effect. The XML must be complete and valid SPA format.',
    input_schema: {
      type: 'object',
      properties: {
        xml: {
          type: 'string',
          description:
            'Complete SPA XML markup including <?xml> declaration, <spa> root element with xmlns and version attributes, and all sound elements. Must be valid and well-formed.',
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
  // Filter out the initial welcome message and loading messages
  const conversationMessages = messages.filter(
    (msg) =>
      !msg.isLoading &&
      !(msg.role === 'assistant' && msg.content.includes('👋 Welcome to the SPA Sound Editor!'))
  );

  // Convert messages to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = conversationMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  try {
    // Initialize Anthropic client with dangerouslyAllowBrowser for client-side usage
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
      timeout: 60 * 1000 * 2, // 120 seconds (default is 10 minutes)
    });

    // Load the system prompt at runtime
    let systemPrompt = await getSystemPrompt();

    // Add current SPA context if provided
    if (currentSPA && currentSPA.trim()) {
      systemPrompt += `\n\n## Current Editor State\n\nThe user currently has the following SPA XML in their editor:\n\n\`\`\`xml\n${currentSPA}\n\`\`\`\n\nWhen the user asks you to modify, adjust, or improve the sound, use this as the starting point. When generating new XML with the update_spa_editor tool, include your modifications to this existing code.`;
    }

    // First API call
    let response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 64000,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: TOOLS,
    });

    // Log the entire response
    console.log('=== FULL API RESPONSE ===');
    console.log(JSON.stringify(response, null, 2));
    console.log('=== RESPONSE CONTENT ===');
    console.log(JSON.stringify(response.content, null, 2));

    const MAX_RETRIES = 3;
    let attempt = 0;

    // Retry loop for tool execution
    while (attempt < MAX_RETRIES) {
      // Check if Claude wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      console.log('=== TOOL USE BLOCK ===');
      console.log(JSON.stringify(toolUseBlock, null, 2));

      if (!toolUseBlock || !onEditorUpdate) {
        // No tool use - extract text response
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );
        const assistantMessage = textBlock?.text || 'Sorry, I could not generate a response.';

        return [
          ...messages,
          {
            role: 'assistant',
            content: assistantMessage,
          },
        ];
      }

      attempt++;

      // Execute the tool
      const toolInput = toolUseBlock.input as { xml?: string; explanation?: string };

      // Debug logging
      console.log('=== TOOL INPUT ===');
      console.log('Type of input:', typeof toolUseBlock.input);
      console.log('Input keys:', Object.keys(toolUseBlock.input || {}));
      console.log('XML value:', toolInput.xml);
      console.log('XML length:', toolInput.xml?.length);
      console.log('Explanation value:', toolInput.explanation);

      const result = onEditorUpdate(toolInput.xml || '', toolInput.explanation || '');

      console.log('=== TOOL EXECUTION RESULT ===');
      console.log(JSON.stringify(result, null, 2));

      // Build tool result messages
      const toolResultMessages: Anthropic.MessageParam[] = [
        ...anthropicMessages,
        {
          role: 'assistant',
          content: response.content,
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: result.success
                ? 'Successfully updated the editor with the new SPA XML.'
                : `Failed to update the editor. Error: ${result.error || 'The XML may be invalid.'}. Please try again with corrected XML.`,
            },
          ],
        },
      ];

      // Make another request to get Claude's response
      response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 64000,
        system: systemPrompt,
        messages: toolResultMessages,
        tools: TOOLS,
      });

      // If tool execution succeeded, return the final message
      if (result.success) {
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );
        const finalMessage = textBlock?.text || toolInput.explanation || '';

        return [
          ...messages,
          {
            role: 'assistant',
            content: finalMessage,
          },
        ];
      }

      // Check if Claude wants to retry
      const hasAnotherToolUse = response.content.some((block) => block.type === 'tool_use');

      if (!hasAnotherToolUse) {
        // Claude gave up - return the text response
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );
        const finalMessage =
          textBlock?.text ||
          `I apologize, but I couldn't generate valid SPA XML after ${attempt} attempt(s). ${result.error || 'Please try describing the sound differently.'}`;

        return [
          ...messages,
          {
            role: 'assistant',
            content: finalMessage,
          },
        ];
      }

      // Continue loop for another retry
      anthropicMessages.length = 0;
      anthropicMessages.push(...toolResultMessages);
    }

    // Exceeded max retries
    return [
      ...messages,
      {
        role: 'assistant',
        content: `I apologize, but I couldn't generate valid SPA XML after ${MAX_RETRIES} attempts. Please try describing the sound differently or check the SPA specification.`,
      },
    ];
  } catch (error) {
    console.error('Error calling chat API:', error);
    throw error;
  }
}
