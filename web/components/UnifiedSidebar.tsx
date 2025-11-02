import { useState, useEffect, useRef } from 'react';
import { sendChatMessages, EditorUpdateCallback, Message } from '../lib/llmService';

interface UnifiedSidebarProps {
  presetCategories: Record<string, Record<string, string>>;
  onLoadPreset: (category: string, preset: string) => void;
  playSoundEffect: (sound: string) => void;
  onEditorUpdate?: EditorUpdateCallback;
  currentSPA?: string;
}

export default function UnifiedSidebar({
  presetCategories,
  onLoadPreset,
  playSoundEffect,
  onEditorUpdate,
  currentSPA,
}: UnifiedSidebarProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'chat'>('presets');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<{
    type: 'category' | 'preset';
    category: string;
    preset?: string;
  } | null>(null);
  const [activePreset, setActivePreset] = useState<{
    category: string;
    preset: string;
  } | null>(null);
  const presetsContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedCategory = useRef(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('Composing');
  const [dotCount, setDotCount] = useState(1);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Audio-themed loading words
  const loadingWords = [
    'Composing',
    'Orchestrating',
    'Motzarting',
    'Synthesizing',
    'Harmonizing',
    'Beethovening',
    'Mixing',
    'Mastering',
    'Sampling',
    'Conducting',
  ];

  // Cycle through loading text every 5 seconds
  useEffect(() => {
    if (!isGenerating) return;

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % loadingWords.length;
      setLoadingText(loadingWords[index]);
    }, 5000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Animate dots: . -> .. -> ... -> . (every 400ms)
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 400);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Update the loading message in chat when loadingText or dotCount changes
  useEffect(() => {
    if (!isGenerating) return;

    const dots = '.'.repeat(dotCount);
    setChatMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage?.isLoading) {
        return [...prevMessages.slice(0, -1), { ...lastMessage, content: `${loadingText}${dots}` }];
      }
      return prevMessages;
    });
  }, [loadingText, dotCount, isGenerating]);

  // Auto-grow textarea
  useEffect(() => {
    const textarea = chatInputRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height based on scrollHeight, with a max of ~5 lines (120px)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [inputValue]);

  // Load active tab from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('spa_sidebar_tab');
    if (saved === 'presets' || saved === 'chat') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(saved);
    }
  }, []);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('spa_sidebar_tab', activeTab);
  }, [activeTab]);

  // Load API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('anthropic_api_key');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(saved);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowApiKeyInput(!saved);
  }, []);

  // Load expanded category from localStorage on mount, or default to first category
  useEffect(() => {
    // Only initialize once
    if (hasInitializedCategory.current) return;

    const categories = Object.keys(presetCategories);
    if (categories.length === 0) return;

    const saved = localStorage.getItem('spa_expanded_category');
    if (saved && categories.includes(saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedCategory(saved);
    } else {
      // Default to first category if no saved state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedCategory(categories[0]);
    }

    // Mark as initialized AFTER setting state to allow this first change to be saved
    hasInitializedCategory.current = true;
  }, [presetCategories]);

  // Save expanded category to localStorage when it changes (but only after initialization)
  useEffect(() => {
    // Only save if we've initialized (prevents removing saved value on mount)
    if (!hasInitializedCategory.current) {
      return;
    }

    if (expandedCategory) {
      localStorage.setItem('spa_expanded_category', expandedCategory);
    } else {
      localStorage.removeItem('spa_expanded_category');
    }
  }, [expandedCategory]);

  // Keyboard navigation for presets
  useEffect(() => {
    if (activeTab !== 'presets') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle arrow keys if a textarea or input is focused
      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement &&
        (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')
      ) {
        return;
      }

      const categories = Object.keys(presetCategories);

      if (!categories.length) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        playSoundEffect('ui-feedback/hover');

        if (!focusedItem) {
          // Initialize focus - use activePreset if available, otherwise start from first preset
          let targetCategory: string;
          let targetPreset: string | null = null;

          if (activePreset) {
            // Start from the currently active preset
            targetCategory = activePreset.category;
            targetPreset = activePreset.preset;
            setExpandedCategory(targetCategory);
          } else {
            // No active preset, start from first preset of first category
            targetCategory = categories[0];
            setExpandedCategory(targetCategory);
            const firstPresets = Object.keys(presetCategories[targetCategory]);
            if (firstPresets.length > 0) {
              targetPreset = firstPresets[0];
            }
          }

          if (targetPreset) {
            setFocusedItem({ type: 'preset', category: targetCategory, preset: targetPreset });
            if (!activePreset) {
              // Only load if there wasn't already an active preset
              onLoadPreset(targetCategory, targetPreset);
              setActivePreset({ category: targetCategory, preset: targetPreset });
            }
          } else {
            setFocusedItem({ type: 'category', category: targetCategory });
          }
          return;
        }

        const currentCategoryIndex = categories.indexOf(focusedItem.category);

        if (e.key === 'ArrowDown') {
          if (focusedItem.type === 'category') {
            // If category is expanded, move to first preset
            if (expandedCategory === focusedItem.category) {
              const presets = Object.keys(presetCategories[focusedItem.category]);
              if (presets.length > 0) {
                const firstPreset = presets[0];
                setFocusedItem({
                  type: 'preset',
                  category: focusedItem.category,
                  preset: firstPreset,
                });
                onLoadPreset(focusedItem.category, firstPreset); // Load the preset
                setActivePreset({ category: focusedItem.category, preset: firstPreset });
              }
            } else {
              // Move to next category
              const nextIndex = (currentCategoryIndex + 1) % categories.length;
              const nextCategory = categories[nextIndex];
              // Automatically expand the next category and select its first preset
              setExpandedCategory(nextCategory);
              const nextPresets = Object.keys(presetCategories[nextCategory]);
              if (nextPresets.length > 0) {
                const firstPreset = nextPresets[0];
                setFocusedItem({ type: 'preset', category: nextCategory, preset: firstPreset });
                onLoadPreset(nextCategory, firstPreset); // Load the preset
                setActivePreset({ category: nextCategory, preset: firstPreset });
              } else {
                setFocusedItem({ type: 'category', category: nextCategory });
              }
            }
          } else {
            // Currently on a preset
            const presets = Object.keys(presetCategories[focusedItem.category]);
            const currentPresetIndex = presets.indexOf(focusedItem.preset!);

            if (currentPresetIndex < presets.length - 1) {
              // Move to next preset
              const nextPreset = presets[currentPresetIndex + 1];
              setFocusedItem({
                type: 'preset',
                category: focusedItem.category,
                preset: nextPreset,
              });
              onLoadPreset(focusedItem.category, nextPreset); // Load the preset
              setActivePreset({ category: focusedItem.category, preset: nextPreset });
            } else {
              // Move to next category, expand it, and select first preset
              const nextIndex = (currentCategoryIndex + 1) % categories.length;
              const nextCategory = categories[nextIndex];
              setExpandedCategory(nextCategory);
              const nextPresets = Object.keys(presetCategories[nextCategory]);
              if (nextPresets.length > 0) {
                const firstPreset = nextPresets[0];
                setFocusedItem({ type: 'preset', category: nextCategory, preset: firstPreset });
                onLoadPreset(nextCategory, firstPreset); // Load the preset
                setActivePreset({ category: nextCategory, preset: firstPreset });
              } else {
                setFocusedItem({ type: 'category', category: nextCategory });
              }
            }
          }
        } else {
          // ArrowUp
          if (focusedItem.type === 'preset') {
            // Currently on a preset
            const presets = Object.keys(presetCategories[focusedItem.category]);
            const currentPresetIndex = presets.indexOf(focusedItem.preset!);

            if (currentPresetIndex > 0) {
              // Move to previous preset in same category
              const prevPreset = presets[currentPresetIndex - 1];
              setFocusedItem({
                type: 'preset',
                category: focusedItem.category,
                preset: prevPreset,
              });
              onLoadPreset(focusedItem.category, prevPreset); // Load the preset
              setActivePreset({ category: focusedItem.category, preset: prevPreset });
            } else {
              // This is the first preset in the current category
              // Move to previous category and select its last preset
              const prevIndex =
                currentCategoryIndex === 0 ? categories.length - 1 : currentCategoryIndex - 1;
              const prevCategory = categories[prevIndex];
              const prevPresets = Object.keys(presetCategories[prevCategory]);

              // Always expand the previous category and navigate to last preset
              setExpandedCategory(prevCategory);

              if (prevPresets.length > 0) {
                // Select the last preset of the previous category
                const lastPreset = prevPresets[prevPresets.length - 1];
                setFocusedItem({ type: 'preset', category: prevCategory, preset: lastPreset });
                onLoadPreset(prevCategory, lastPreset); // Load the preset
                setActivePreset({ category: prevCategory, preset: lastPreset });
              } else {
                // No presets in previous category, just focus the category
                setFocusedItem({ type: 'category', category: prevCategory });
              }
            }
          } else {
            // Currently on a category (shouldn't happen with current navigation, but handle it)
            // Move to previous category and select its last preset
            const prevIndex =
              currentCategoryIndex === 0 ? categories.length - 1 : currentCategoryIndex - 1;
            const prevCategory = categories[prevIndex];
            const prevPresets = Object.keys(presetCategories[prevCategory]);

            setExpandedCategory(prevCategory);

            if (prevPresets.length > 0) {
              const lastPreset = prevPresets[prevPresets.length - 1];
              setFocusedItem({ type: 'preset', category: prevCategory, preset: lastPreset });
              onLoadPreset(prevCategory, lastPreset); // Load the preset
            } else {
              setFocusedItem({ type: 'category', category: prevCategory });
            }
          }
        }
      } else if (e.key === 'ArrowRight' && focusedItem?.type === 'category') {
        // Expand category
        e.preventDefault();
        playSoundEffect('ui-feedback/tab-switch');
        setExpandedCategory(focusedItem.category);
      } else if (e.key === 'ArrowLeft' && focusedItem) {
        // Collapse category or move to parent
        e.preventDefault();
        if (focusedItem.type === 'preset') {
          // Move focus to parent category and collapse
          playSoundEffect('ui-feedback/tab-switch');
          setFocusedItem({ type: 'category', category: focusedItem.category });
          setExpandedCategory(null);
        } else if (expandedCategory === focusedItem.category) {
          // Collapse current category
          playSoundEffect('ui-feedback/tab-switch');
          setExpandedCategory(null);
        }
      } else if (e.key === 'Enter' && focusedItem) {
        e.preventDefault();
        if (focusedItem.type === 'category') {
          // Toggle category expansion
          playSoundEffect('ui-feedback/tab-switch');
          setExpandedCategory(
            expandedCategory === focusedItem.category ? null : focusedItem.category
          );
        } else {
          // Load preset
          playSoundEffect('ui-feedback/button-click');
          onLoadPreset(focusedItem.category, focusedItem.preset!);
          setActivePreset({ category: focusedItem.category, preset: focusedItem.preset! });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, focusedItem, expandedCategory, presetCategories, onLoadPreset, playSoundEffect]);

  // Scroll focused item into view
  useEffect(() => {
    if (!focusedItem) return;

    const focusedElement = presetsContainerRef.current?.querySelector?.('[data-focused="true"]');
    if (focusedElement) {
      focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedItem]);

  const handleSendMessage = async () => {
    if (inputValue.trim() && apiKey) {
      const userMessage = { role: 'user' as const, content: inputValue };
      const updatedMessages = [...chatMessages, userMessage];

      setChatMessages(updatedMessages);
      setInputValue('');
      setIsGenerating(true);
      setDotCount(1); // Reset dot animation

      // Reset textarea height
      if (chatInputRef.current) {
        chatInputRef.current.style.height = 'auto';
      }

      // Add loading message
      const loadingMessage = {
        role: 'assistant' as const,
        content: `${loadingText}.`,
        isLoading: true,
      };
      setChatMessages([...updatedMessages, loadingMessage]);

      try {
        const responseMessages = await sendChatMessages(
          updatedMessages,
          apiKey,
          onEditorUpdate,
          currentSPA
        );
        setChatMessages(responseMessages);
      } catch (error) {
        console.error('Error sending message:', error);
        setChatMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.',
          },
        ]);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const suggestedPrompts = [
    'Create a button click sound',
    'Make an error notification',
    'Design a success chime',
    'Build a swoosh transition',
  ];

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('anthropic_api_key', apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setShowApiKeyInput(false);
      setApiKeyInput('');
      playSoundEffect('ui-feedback/button-click');
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('anthropic_api_key');
    setApiKey(null);
    setShowApiKeyInput(true);
    setChatMessages([
      {
        role: 'assistant',
        content:
          '👋 Welcome to the SPA Sound Editor!\n\n💡 New here? Start with the **Presets** tab above to explore ready-made sounds and learn how the editor works.\n\nI can help you:\n• Create custom sound effects\n• Modify existing presets\n• Understand how different parameters affect sounds\n• Build complex layered compositions\n\nJust describe the sound you want to create!',
      },
    ]);
    playSoundEffect('ui-feedback/button-click');
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        content:
          '👋 Welcome to the SPA Sound Editor!\n\n💡 New here? Start with the **Presets** tab above to explore ready-made sounds and learn how the editor works.\n\nI can help you:\n• Create custom sound effects\n• Modify existing presets\n• Understand how different parameters affect sounds\n• Build complex layered compositions\n\nJust describe the sound you want to create!',
      },
    ]);
    playSoundEffect('ui-feedback/button-click');
  };

  return (
    <div className="w-[450px] bg-navy-medium border-r-2 border-navy-light flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <a href="/" rel="noopener noreferrer" className="px-4">
            SPA
          </a>
        </div>
        {/* Tab Header */}
        <div className="flex select-none">
          <button
            onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
            onClick={() => {
              playSoundEffect('ui-feedback/tab-switch');
              setActiveTab('presets');
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'presets'
                ? 'text-white border-green'
                : 'text-gray-400 hover:text-white border-transparent'
            }`}
          >
            Presets
          </button>
          <button
            onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
            onClick={() => {
              playSoundEffect('ui-feedback/tab-switch');
              setActiveTab('chat');
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'chat'
                ? 'text-white border-green'
                : 'text-gray-400 hover:text-white border-transparent'
            }`}
          >
            AI Assistant
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'presets' ? (
        <div className="flex-1 overflow-y-auto" ref={presetsContainerRef}>
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Sound Library</h3>
              <p className="text-xs text-gray-400">
                Click any preset to load it into the editor. Great for learning and as starting
                points! Use arrow keys to navigate.
              </p>
            </div>

            {Object.entries(presetCategories).map(([category, presets]) => {
              const isFocused =
                focusedItem?.type === 'category' && focusedItem.category === category;
              return (
                <div key={category} className="mb-3 select-none">
                  <button
                    data-focused={isFocused}
                    onMouseEnter={() => {
                      playSoundEffect('ui-feedback/hover');
                      setFocusedItem({ type: 'category', category });
                    }}
                    onMouseLeave={() => {
                      if (focusedItem?.type === 'category' && focusedItem.category === category) {
                        setFocusedItem(null);
                      }
                    }}
                    onClick={() => {
                      playSoundEffect('ui-feedback/tab-switch');
                      setExpandedCategory(expandedCategory === category ? null : category);
                      setFocusedItem({ type: 'category', category });
                    }}
                    className={`w-full flex items-center justify-between p-2 bg-navy-dark rounded hover:bg-navy-light/10 transition-colors ${
                      isFocused ? 'ring-2 ring-green ring-offset-2 ring-offset-navy' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-navy-light">{category}</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategory === category ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  {expandedCategory === category && (
                    <div className="space-y-0.5 ml-2 mt-1">
                      {Object.keys(presets).map((presetName) => {
                        const isPresetFocused =
                          focusedItem?.type === 'preset' &&
                          focusedItem.category === category &&
                          focusedItem.preset === presetName;
                        const isActive =
                          activePreset?.category === category &&
                          activePreset?.preset === presetName;
                        return (
                          <button
                            key={presetName}
                            data-focused={isPresetFocused}
                            onMouseEnter={() => {
                              playSoundEffect('ui-feedback/hover');
                              setFocusedItem({ type: 'preset', category, preset: presetName });
                            }}
                            onMouseLeave={() => {
                              if (
                                focusedItem?.type === 'preset' &&
                                focusedItem.category === category &&
                                focusedItem.preset === presetName
                              ) {
                                setFocusedItem(null);
                              }
                            }}
                            onClick={() => {
                              playSoundEffect('ui-feedback/button-click');
                              onLoadPreset(category, presetName);
                              setActivePreset({ category, preset: presetName });
                              // Ensure category stays expanded when preset is selected
                              if (expandedCategory !== category) {
                                setExpandedCategory(category);
                              }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-navy-light/20 hover:text-white rounded transition-colors truncate group flex items-center justify-between ${
                              isPresetFocused
                                ? 'ring-2 ring-green ring-offset-2 ring-offset-navy bg-navy-light/20 text-white'
                                : isActive
                                  ? 'bg-green/20 text-green border-l-2 border-green font-medium'
                                  : 'text-gray-300'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              {isActive && <span className="text-green">●</span>}
                              <span>{presetName}</span>
                            </span>
                            <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                              {isActive ? 'Active' : 'Load →'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.role === 'user' ? 'bg-green text-navy-dark' : 'bg-navy-dark text-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Prompts (only show if no user messages yet) */}
          {chatMessages.filter((m) => m.role === 'user').length === 0 && (
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                    onClick={() => {
                      playSoundEffect('ui-feedback/button-click');
                      setInputValue(prompt);
                    }}
                    className="px-2 py-1 text-xs bg-navy-dark hover:bg-navy-light/20 rounded border border-navy-light/20 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-navy-light/20 flex-shrink-0">
            {showApiKeyInput ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-400 mb-2">
                  <p className="font-semibold text-white mb-1">🔑 API Key Required</p>
                  <p>To use the AI Assistant, please enter your Anthropic API key.</p>
                  <p className="mt-1">
                    Get your key from:{' '}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green hover:underline"
                    >
                      console.anthropic.com
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveApiKey();
                      }
                    }}
                    placeholder="sk-ant-api..."
                    className="flex-1 px-3 py-2 bg-navy-dark text-white rounded border border-navy-light/20 focus:outline-none focus:border-green text-sm font-mono"
                  />
                  <button
                    onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput.trim()}
                    className="px-4 py-2 bg-green text-navy-dark rounded hover:bg-green/80 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 mb-2">
                  <div className="relative bg-navy-dark border-2 border-navy-light/20 rounded-lg focus-within:border-green/50 transition-colors">
                    <textarea
                      ref={chatInputRef}
                      id="chat-input"
                      rows={1}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask about sounds or describe what you want..."
                      className="w-full p-3 bg-transparent text-white rounded-lg focus:outline-none text-sm resize-none overflow-y-auto"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      disabled={isGenerating}
                    />
                    <div className="p-3 flex justify-between items-center gap-2">
                      <div></div>
                      <button
                        onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                        onClick={() => {
                          playSoundEffect('ui-feedback/button-click');
                          handleSendMessage();
                        }}
                        disabled={!inputValue.trim() || isGenerating}
                        className="px-3 py-1.5 bg-green text-navy-dark rounded hover:bg-green/80 transition-colors font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? '...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div></div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClearChat}
                      className="text-[10px] text-gray-400 hover:text-gray-300 transition-colors"
                      title="Clear chat history"
                    >
                      Clear Chat
                    </button>
                    <button
                      onClick={handleClearApiKey}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                      title="Clear API key"
                    >
                      Clear Key
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
