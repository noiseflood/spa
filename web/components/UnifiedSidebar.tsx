import { useState } from 'react';

interface UnifiedSidebarProps {
  presetCategories: Record<string, Record<string, string>>;
  onLoadPreset: (category: string, preset: string) => void;
  playSoundEffect: (sound: string) => void;
}

export default function UnifiedSidebar({
  presetCategories,
  onLoadPreset,
  playSoundEffect,
}: UnifiedSidebarProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'chat'>('presets');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('UI Feedback');
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([
    {
      role: 'assistant',
      content:
        '👋 Welcome to the SPA Sound Editor!\n\n💡 New here? Start with the **Presets** tab above to explore ready-made sounds and learn how the editor works.\n\nI can help you:\n• Create custom sound effects\n• Modify existing presets\n• Understand how different parameters affect sounds\n• Build complex layered compositions\n\nJust describe the sound you want to create!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setChatMessages([...chatMessages, { role: 'user', content: inputValue }]);
      // TODO: Integrate with actual AI backend
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'I understand you want to work with SPA audio. This feature is coming soon! For now, try exploring the presets to see examples of different sound effects.',
          },
        ]);
      }, 500);
      setInputValue('');
    }
  };

  const suggestedPrompts = [
    'Create a button click sound',
    'Make an error notification',
    'Design a success chime',
    'Build a swoosh transition',
  ];

  return (
    <div className="w-[450px] bg-navy border-r border-navy-light/20 flex flex-col h-full">
      {/* Tab Header */}
      <div className="flex border-b border-navy-light/20">
        <button
          onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
          onClick={() => {
            playSoundEffect('ui-feedback/tab-switch');
            setActiveTab('presets');
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'presets'
              ? 'bg-navy-dark text-white border-b-2 border-green'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-navy-dark/50'
          }`}
        >
          🎵 Presets
        </button>
        <button
          onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
          onClick={() => {
            playSoundEffect('ui-feedback/tab-switch');
            setActiveTab('chat');
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'chat'
              ? 'bg-navy-dark text-white border-b-2 border-green'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-navy-dark/50'
          }`}
        >
          💬 AI Assistant
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'presets' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Sound Library</h3>
              <p className="text-xs text-gray-400">
                Click any preset to load it into the editor. Great for learning and as starting
                points!
              </p>
            </div>

            {Object.entries(presetCategories).map(([category, presets]) => (
              <div key={category} className="mb-3">
                <button
                  onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                  onClick={() => {
                    playSoundEffect('ui-feedback/tab-switch');
                    setExpandedCategory(expandedCategory === category ? null : category);
                  }}
                  className="w-full flex items-center justify-between p-2 bg-navy-dark rounded hover:bg-navy-light/10 transition-colors"
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
                    {Object.keys(presets).map((presetName) => (
                      <button
                        key={presetName}
                        onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                        onClick={() => {
                          playSoundEffect('ui-feedback/button-click');
                          onLoadPreset(category, presetName);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-navy-light/20 hover:text-white rounded transition-colors truncate group flex items-center justify-between"
                      >
                        <span>{presetName}</span>
                        <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                          Load →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
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
          <div className="p-4 border-t border-navy-light/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about sounds or describe what you want..."
                className="flex-1 px-3 py-2 bg-navy-dark text-white rounded border border-navy-light/20 focus:outline-none focus:border-green text-sm"
              />
              <button
                onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                onClick={() => {
                  playSoundEffect('ui-feedback/button-click');
                  handleSendMessage();
                }}
                className="px-4 py-2 bg-green text-navy-dark rounded hover:bg-green/80 transition-colors font-medium text-sm"
              >
                Send
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Tip: Check the Presets tab for examples and inspiration!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
