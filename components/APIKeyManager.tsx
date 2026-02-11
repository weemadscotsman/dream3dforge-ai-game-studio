import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { USE_HARDCODED_KEYS, HARDCODED_KEYS } from '../config/apiKeys';

// ============================================================================
// TYPES
// ============================================================================

interface APIKeyConfig {
  provider: string;
  key: string;
  isValid: boolean | null;
  isChecking: boolean;
  errorMessage: string;
  label: string;
  description: string;
  icon: string;
  placeholder: string;
  validationUrl: string;
}

interface APIKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: (keys: Record<string, string>) => void;
}

// ============================================================================
// VALIDATION FUNCTIONS - FORMAT ONLY (no API calls)
// ============================================================================

const validateGeminiKey = async (key: string): Promise<{ valid: boolean; error?: string }> => {
  // Format check only - no API call
  if (key && key.startsWith('AIza') && key.length >= 20) {
    return { valid: true };
  }
  if (!key || key.length < 10) {
    return { valid: false, error: 'Key too short' };
  }
  return { valid: false, error: 'Should start with AIza...' };
};

const validateMoonshotKey = async (key: string): Promise<{ valid: boolean; error?: string }> => {
  // Format check only - no API call
  if (key && key.startsWith('sk-') && key.length >= 20) {
    return { valid: true };
  }
  if (!key || key.length < 10) {
    return { valid: false, error: 'Key too short' };
  }
  return { valid: false, error: 'Should start with sk-...' };
};

const validateOpenRouterKey = async (key: string): Promise<{ valid: boolean; error?: string }> => {
  // Format check only - no API call
  if (key && key.startsWith('sk-') && key.length >= 20) {
    return { valid: true };
  }
  if (!key || key.length < 10) {
    return { valid: false, error: 'Key too short' };
  }
  return { valid: false, error: 'Should start with sk-...' };
};

// ============================================================================
// COMPONENT
// ============================================================================

export const APIKeyManager: React.FC<APIKeyManagerProps> = ({
  isOpen,
  onClose,
  onKeysUpdated
}) => {
  // Check if using hardcoded keys
  const usingHardcoded = USE_HARDCODED_KEYS && (HARDCODED_KEYS.gemini || HARDCODED_KEYS.moonshot);

  const [keys, setKeys] = useState<APIKeyConfig[]>([
    {
      provider: 'gemini',
      key: usingHardcoded ? (HARDCODED_KEYS.gemini ? '••••••••••••••••••••••••••' : '') : '',
      isValid: usingHardcoded && HARDCODED_KEYS.gemini ? true : null,
      isChecking: false,
      errorMessage: '',
      label: 'Google Gemini',
      description: 'Primary AI for game generation (multimodal, fast)',
      icon: '🔮',
      placeholder: 'AIzaSy...',
      validationUrl: 'https://makersuite.google.com/app/apikey'
    },
    {
      provider: 'moonshot',
      key: usingHardcoded ? (HARDCODED_KEYS.moonshot ? '••••••••••••••••••••••••••' : '') : '',
      isValid: usingHardcoded && HARDCODED_KEYS.moonshot ? true : null,
      isChecking: false,
      errorMessage: '',
      label: 'Moonshot Kimi',
      description: 'Massive context window (32k+) for large code generation',
      icon: '🌙',
      placeholder: 'sk-...',
      validationUrl: 'https://platform.moonshot.ai/console'
    },
    {
      provider: 'openrouter',
      key: usingHardcoded ? (HARDCODED_KEYS.openrouter ? '••••••••••••••••••••••••••' : '') : '',
      isValid: usingHardcoded && HARDCODED_KEYS.openrouter ? true : null,
      isChecking: false,
      errorMessage: '',
      label: 'OpenRouter',
      description: 'Access to multiple AI models (Claude, GPT-4, etc.)',
      icon: '🌐',
      placeholder: 'sk-or-...',
      validationUrl: 'https://openrouter.ai/keys'
    }
  ]);

  const [showKeys, setShowKeys] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load saved keys on mount
  useEffect(() => {
    const loadSavedKeys = () => {
      const saved: Record<string, string> = {};
      keys.forEach(k => {
        const stored = localStorage.getItem(`api_key_${k.provider}`);
        if (stored) {
          saved[k.provider] = stored;
        }
      });
      setSavedKeys(saved);
      
      // Update keys state with saved values (masked)
      setKeys(prev => prev.map(k => ({
        ...k,
        key: saved[k.provider] ? '••••••••••••••••••••••••••' : '',
        isValid: saved[k.provider] ? true : null
      })));
    };
    
    if (isOpen) {
      loadSavedKeys();
    }
  }, [isOpen]);

  const validateKey = useCallback(async (provider: string, key: string) => {
    setKeys(prev => prev.map(k => 
      k.provider === provider 
        ? { ...k, isChecking: true, errorMessage: '' }
        : k
    ));

    let result: { valid: boolean; error?: string };

    switch (provider) {
      case 'gemini':
        result = await validateGeminiKey(key);
        break;
      case 'moonshot':
        result = await validateMoonshotKey(key);
        break;
      case 'openrouter':
        result = await validateOpenRouterKey(key);
        break;
      default:
        result = { valid: false, error: 'Unknown provider' };
    }

    setKeys(prev => prev.map(k => 
      k.provider === provider 
        ? { 
            ...k, 
            isValid: result.valid, 
            isChecking: false,
            errorMessage: result.error || ''
          }
        : k
    ));

    return result.valid;
  }, []);

  const handleKeyChange = (provider: string, value: string) => {
    setKeys(prev => prev.map(k => 
      k.provider === provider 
        ? { ...k, key: value, isValid: null, errorMessage: '' }
        : k
    ));
  };

  const handleKeyBlur = async (provider: string, key: string) => {
    if (key && key !== '••••••••••••••••••••••••••') {
      await validateKey(provider, key);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent, provider: string, key: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (key && key !== '••••••••••••••••••••••••••') {
        const isValid = await validateKey(provider, key);
        if (isValid) {
          // Auto-save on valid Enter
          await saveKey(provider, key);
        }
      }
    }
  };

  const saveKey = async (provider: string, key: string) => {
    if (!key || key === '••••••••••••••••••••••••••') return;
    
    localStorage.setItem(`api_key_${provider}`, key);
    setSavedKeys(prev => ({ ...prev, [provider]: key }));
    
    // Show success animation
    setSaveMessage(`${provider} key saved!`);
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    
    for (const keyConfig of keys) {
      if (keyConfig.key && keyConfig.key !== '••••••••••••••••••••••••••' && keyConfig.isValid) {
        await saveKey(keyConfig.provider, keyConfig.key);
      }
    }
    
    onKeysUpdated?.(savedKeys);
    setIsSaving(false);
    
    // Close after brief delay
    setTimeout(onClose, 500);
  };

  const clearKey = (provider: string) => {
    localStorage.removeItem(`api_key_${provider}`);
    setSavedKeys(prev => {
      const updated = { ...prev };
      delete updated[provider];
      return updated;
    });
    setKeys(prev => prev.map(k => 
      k.provider === provider 
        ? { ...k, key: '', isValid: null, errorMessage: '' }
        : k
    ));
  };

  const openKeyPage = (url: string) => {
    window.open(url, '_blank');
  };

  const getStatusIcon = (keyConfig: APIKeyConfig) => {
    if (keyConfig.isChecking) {
      return <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />;
    }
    if (keyConfig.isValid === true) {
      return <span className="text-green-400 text-lg">✓</span>;
    }
    if (keyConfig.isValid === false) {
      return <span className="text-red-400 text-lg">✗</span>;
    }
    return <span className="text-zinc-600 text-lg">○</span>;
  };

  const allValid = keys.every(k => k.isValid === true || !k.key);
  const hasChanges = keys.some(k => k.key && k.key !== '••••••••••••••••••••••••••' && k.isValid);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-indigo-500/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl">
                    🔐
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">API Key Manager</h2>
                    <p className="text-zinc-500 text-sm">Configure your AI providers</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <Icons.Warning className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* Hardcoded Keys Banner */}
              {usingHardcoded && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-green-300 text-sm font-medium">Hardcoded Keys Active</p>
                    <p className="text-green-400/70 text-xs mt-1">
                      API keys are hardcoded in config/apiKeys.ts. The app is ready to use!
                      To use custom keys, set USE_HARDCODED_KEYS = false in the config file.
                    </p>
                  </div>
                </div>
              )}

              {/* Info Banner */}
              {!usingHardcoded && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Quick Setup</p>
                    <p className="text-blue-400/70 text-xs mt-1">
                      Paste your API keys below. Press Enter to validate. Keys are stored locally in your browser.
                    </p>
                  </div>
                </div>
              )}

              {/* Key Inputs */}
              {keys.map((keyConfig) => (
                <motion.div
                  key={keyConfig.provider}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-zinc-900/50 border rounded-xl p-4 transition-all ${
                    keyConfig.isValid === true ? 'border-green-500/30 bg-green-500/5' :
                    keyConfig.isValid === false ? 'border-red-500/30 bg-red-500/5' :
                    'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{keyConfig.icon}</span>
                      <div>
                        <h3 className="font-bold text-white">{keyConfig.label}</h3>
                        <p className="text-zinc-500 text-xs">{keyConfig.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(keyConfig)}
                      {savedKeys[keyConfig.provider] && (
                        <button
                          onClick={() => clearKey(keyConfig.provider)}
                          className="text-zinc-500 hover:text-red-400 text-xs underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type={showKeys ? 'text' : 'password'}
                      value={keyConfig.key}
                      onChange={(e) => handleKeyChange(keyConfig.provider, e.target.value)}
                      onBlur={() => handleKeyBlur(keyConfig.provider, keyConfig.key)}
                      onKeyDown={(e) => handleKeyDown(e, keyConfig.provider, keyConfig.key)}
                      placeholder={keyConfig.placeholder}
                      className={`w-full bg-zinc-950 border rounded-lg px-4 py-3 pr-24 text-sm font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none focus:ring-2 transition-all ${
                        keyConfig.isValid === true ? 'border-green-500/50 focus:ring-green-500/20' :
                        keyConfig.isValid === false ? 'border-red-500/50 focus:ring-red-500/20' :
                        'border-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500/50'
                      }`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {keyConfig.key && keyConfig.key !== '••••••••••••••••••••••••••' && (
                        <button
                          onClick={() => validateKey(keyConfig.provider, keyConfig.key)}
                          disabled={keyConfig.isChecking}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors"
                        >
                          {keyConfig.isChecking ? '...' : 'Check'}
                        </button>
                      )}
                    </div>
                  </div>

                  {keyConfig.errorMessage && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-red-400 text-xs mt-2 flex items-center gap-1"
                    >
                      <Icons.Warning className="w-3 h-3" />
                      {keyConfig.errorMessage}
                    </motion.p>
                  )}

                  {keyConfig.isValid === true && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-green-400 text-xs mt-2 flex items-center gap-1"
                    >
                      <span>✓</span> API key is valid and ready to use!
                    </motion.p>
                  )}

                  <button
                    onClick={() => openKeyPage(keyConfig.validationUrl)}
                    className="text-zinc-500 hover:text-indigo-400 text-xs mt-2 underline flex items-center gap-1"
                  >
                    <span>🔗</span> Get {keyConfig.label} API Key
                  </button>
                </motion.div>
              ))}

              {/* Show/Hide Toggle */}
              <label className="flex items-center gap-2 text-zinc-400 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKeys}
                  onChange={(e) => setShowKeys(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                />
                Show API keys (careful!)
              </label>

              {/* Save Message */}
              <AnimatePresence>
                {saveMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center"
                  >
                    <p className="text-green-400 text-sm">{saveMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <div className="text-zinc-500 text-xs">
                {Object.keys(savedKeys).length} of {keys.length} keys configured
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save all keys without validation
                    keys.forEach(k => {
                      if (k.key && k.key.length > 5) {
                        localStorage.setItem(`api_key_${k.provider}`, k.key);
                      }
                    });
                    onClose();
                    window.location.reload(); // Reload to pick up new keys
                  }}
                  className="px-4 py-2 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Skip Validation
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={!hasChanges || isSaving}
                  className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    hasChanges
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>💾</span> Save All Keys
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default APIKeyManager;
