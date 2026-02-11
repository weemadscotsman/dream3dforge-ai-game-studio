import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";

const STORAGE_KEY = "dream3dforge.settings";

type Provider = "openai" | "openrouter" | "gemini" | "ollama";

const Input = ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/30 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
    </div>
);

const SettingsPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [provider, setProvider] = useState<Provider>("openai");
    const [openAIKey, setOpenAIKey] = useState("");
    const [openRouterKey, setOpenRouterKey] = useState("");
    const [openRouterModel, setOpenRouterModel] = useState("");
    const [geminiKey, setGeminiKey] = useState("");
    const [geminiModel, setGeminiModel] = useState("gemini-2.5-pro");
    const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434");
    const [ollamaModel, setOllamaModel] = useState("llama3");
    const [useSovereignStack, setUseSovereignStack] = useState(false);

    /* ---------------- Load saved settings ---------------- */
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        try {
            const data = JSON.parse(raw);
            setProvider(data.provider ?? "openai");
            setOpenAIKey(data.openAIKey ?? "");
            setOpenRouterKey(data.openRouterKey ?? "");
            setOpenRouterModel(data.openRouterModel ?? "");
            setGeminiKey(data.geminiKey ?? "");
            setGeminiModel(data.geminiModel ?? "gemini-2.5-pro");
            setOllamaEndpoint(data.ollamaEndpoint ?? "http://localhost:11434");
            setOllamaModel(data.ollamaModel ?? "llama3");
            setUseSovereignStack(data.useSovereignStack ?? false);
        } catch {
            console.warn("[Settings] Corrupt localStorage ignored");
        }
    }, []);

    /* ---------------- Save + Close ---------------- */
    const saveAndClose = () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                provider,
                openAIKey,
                openRouterKey,
                openRouterModel,
                geminiKey,
                geminiModel,
                ollamaEndpoint,
                ollamaModel,
                useSovereignStack,
            })
        );
        onClose();
    };

    /* ---------------- Key bindings ---------------- */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") saveAndClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-3xl bg-zinc-900 text-zinc-100 rounded-lg shadow-xl flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

                    {/* Provider Selection */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Active Provider
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: "openai", label: "OpenAI", icon: Icons.Brain },
                                { id: "openrouter", label: "OpenRouter", icon: Icons.Network },
                                { id: "gemini", label: "Google Gemini", icon: Icons.Sparkles },
                                { id: "ollama", label: "Ollama (Local)", icon: Icons.Cpu },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setProvider(p.id as Provider)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded border transition-all ${
                                        provider === p.id
                                            ? "bg-indigo-600 border-indigo-500 text-white"
                                            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750"
                                    }`}
                                >
                                    <p.icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Provider-specific forms */}
                    <div className="bg-black/20 rounded-lg p-4 border border-zinc-800">
                        {provider === "openai" && (
                            <Input
                                label="OpenAI API Key"
                                value={openAIKey}
                                onChange={setOpenAIKey}
                                placeholder="sk-..."
                                type="password"
                            />
                        )}

                        {provider === "openrouter" && (
                            <>
                                <Input
                                    label="OpenRouter API Key"
                                    value={openRouterKey}
                                    onChange={setOpenRouterKey}
                                    placeholder="sk-or-v1-..."
                                    type="password"
                                />
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                        Model (Optional)
                                    </label>
                                    <select
                                        value={openRouterModel}
                                        onChange={(e) => setOpenRouterModel(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 rounded text-sm"
                                    >
                                        <option value="">Auto-select (Recommended)</option>
                                        <optgroup label="🆓 FREE Models (No Credits Needed)">
                                            <option value="arcee-ai/trinity-large-preview:free">Trinity Large Preview ⭐ FREE</option>
                                            <option value="upstage/solar-pro:free">Solar Pro 3 (Free)</option>
                                        </optgroup>
                                        <optgroup label="Kimi (Moonshot)">
                                            <option value="moonshotai/kimi-k2.5">Kimi K2.5 (Kimi Code) ⭐</option>
                                            <option value="moonshotai/kimi-k2">Kimi K2</option>
                                            <option value="moonshotai/kimi-k1.5">Kimi K1.5</option>
                                        </optgroup>
                                        <optgroup label="Anthropic Claude">
                                            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet ⭐</option>
                                            <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                                            <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast)</option>
                                        </optgroup>
                                        <optgroup label="OpenAI">
                                            <option value="openai/gpt-4o">GPT-4o ⭐</option>
                                            <option value="openai/gpt-4o-mini">GPT-4o Mini (Cheap)</option>
                                            <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                                        </optgroup>
                                        <optgroup label="Google">
                                            <option value="google/gemini-pro-1.5">Gemini 1.5 Pro</option>
                                            <option value="google/gemini-flash-1.5">Gemini 1.5 Flash (Fast)</option>
                                        </optgroup>
                                        <optgroup label="DeepSeek">
                                            <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
                                            <option value="deepseek/deepseek-r1">DeepSeek R1 (Reasoning)</option>
                                        </optgroup>
                                        <optgroup label="Meta">
                                            <option value="meta-llama/llama-3.1-405b">Llama 3.1 405B</option>
                                            <option value="meta-llama/llama-3.1-70b">Llama 3.1 70B</option>
                                        </optgroup>
                                        <optgroup label="Auto Tags">
                                            <option value="preferred-reasoning-model">Auto: Best Reasoning</option>
                                            <option value="preferred-fast-model">Auto: Fast/Cheap</option>
                                        </optgroup>
                                    </select>
                                    <p className="text-[10px] text-zinc-500 mt-1">🆓 Select "Trinity Large Preview" or "Solar Pro 3" for FREE generation (no credits needed)</p>
                                </div>
                            </>
                        )}

                        {provider === "gemini" && (
                            <>
                                <Input
                                    label="Google Gemini API Key"
                                    value={geminiKey}
                                    onChange={setGeminiKey}
                                    placeholder="AIza..."
                                />
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                        Gemini Model
                                    </label>
                                    <select
                                        value={geminiModel}
                                        onChange={(e) => setGeminiModel(e.target.value)}
                                        className="w-full bg-black/30 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    >
                                        <optgroup label="Recommended (Working)">
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro ⭐ BEST</option>
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                        </optgroup>
                                        <optgroup label="Legacy (Working)">
                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                        </optgroup>
                                        <optgroup label="Preview (May Not Work)">
                                            <option value="gemini-3-pro-preview">Gemini 3 Pro Preview</option>
                                        </optgroup>
                                    </select>
                                    <p className="text-[10px] text-zinc-500 mt-2">
                                        💡 <strong>gemini-2.5-pro</strong> is the best for coding. Get your key from{" "}
                                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-indigo-400 hover:underline">
                                            Google AI Studio
                                        </a>
                                    </p>
                                </div>
                            </>
                        )}

                        {provider === "ollama" && (
                            <>
                                <Input
                                    label="Ollama Endpoint"
                                    value={ollamaEndpoint}
                                    onChange={setOllamaEndpoint}
                                    placeholder="http://localhost:11434"
                                />
                                <Input
                                    label="Ollama Model"
                                    value={ollamaModel}
                                    onChange={setOllamaModel}
                                    placeholder="llama3"
                                />
                                <div className="flex items-center gap-3 mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded">
                                    <input
                                        type="checkbox"
                                        id="sovereign"
                                        checked={useSovereignStack}
                                        onChange={(e) => setUseSovereignStack(e.target.checked)}
                                        className="w-4 h-4 accent-indigo-500"
                                    />
                                    <label htmlFor="sovereign" className="text-sm text-indigo-200">
                                        Enable Local Sovereignty Stack (Smart Routing)
                                    </label>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info box */}
                    <div className="bg-zinc-800/50 rounded p-3 text-xs text-zinc-400">
                        <strong className="text-zinc-300">Provider Notes:</strong>
                        <ul className="mt-1 space-y-1 list-disc list-inside">
                            <li><strong>OpenRouter:</strong> Requires account credits. Use free models (Trinity, Solar) to avoid charges.</li>
                            <li><strong>Google Gemini:</strong> Free tier available. Rate limited but generous limits.</li>
                            <li><strong>Ollama:</strong> Completely free local AI. Requires GPU for good performance.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveAndClose}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export { SettingsPage };
