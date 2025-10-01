import React, { useState, useEffect } from 'react';

const AI_MODELS = ['Gemini', 'Qwen', 'DeepSeek'];

const Settings: React.FC = () => {
    const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('ai_model') || 'Gemini');
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
        try {
            const storedKeys = localStorage.getItem('api_keys');
            return storedKeys ? JSON.parse(storedKeys) : {};
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem('ai_model', selectedModel);
    }, [selectedModel]);

    useEffect(() => {
        localStorage.setItem('api_keys', JSON.stringify(apiKeys));
    }, [apiKeys]);

    const handleApiKeyChange = (model: string, key: string) => {
        setApiKeys(prev => ({ ...prev, [model]: key }));
    };

    return (
        <div className="p-4 border-t border-theme-default">
            <h2 className="text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">Settings</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="ai-model" className="block text-sm font-medium text-theme-default mb-1">AI Model</label>
                    <select
                        id="ai-model"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 bg-theme-secondary border border-theme-default rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary-light"
                    >
                        {AI_MODELS.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-theme-default mb-1">API Key</label>
                    <input
                        type="password"
                        id="api-key"
                        value={apiKeys[selectedModel] || ''}
                        onChange={(e) => handleApiKeyChange(selectedModel, e.target.value)}
                        className="w-full px-3 py-2 bg-theme-secondary border border-theme-default rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary-light"
                        placeholder={`Enter ${selectedModel} API Key`}
                    />
                </div>
            </div>
        </div>
    );
};

export default Settings;
