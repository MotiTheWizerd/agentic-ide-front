"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface ModelOption {
  id: string;
  name: string;
  supportsVision: boolean;
}

interface Provider {
  id: string;
  name: string;
  supportsVision: boolean;
  models?: ModelOption[];
}

interface ImageItem {
  data: string;
  filename: string;
  type: "reference" | "persona" | "target";
}

type Mode = "describe" | "replace";

export default function Home() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [replaceResult, setReplaceResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("mistral");
  const [selectedModel, setSelectedModel] = useState("glm-4.7-flash");
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>("describe");
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const personaInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const referenceImages = images.filter((img) => img.type === "reference");
  const personaImage = images.find((img) => img.type === "persona");
  const targetImage = images.find((img) => img.type === "target");

  // Fetch available providers on mount
  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data) => {
        setProviders(data.providers);
        setSelectedProvider(data.defaultProvider);
      })
      .catch(console.error);
  }, []);

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  const addImage = useCallback((file: File, type: "reference" | "persona" | "target") => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImage: ImageItem = {
        data: event.target?.result as string,
        filename: file.name,
        type,
      };
      setImages((prev) => {
        if (type === "persona" || type === "target") {
          // Replace existing persona or target
          return [...prev.filter((img) => img.type !== type), newImage];
        } else {
          // Add to reference (max 5)
          const refs = prev.filter((img) => img.type === "reference");
          if (refs.length >= 5) return prev;
          return [...prev, newImage];
        }
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // In replace mode, paste goes to target; otherwise reference
          if (mode === "replace") {
            addImage(file, "target");
          } else {
            const refs = images.filter((img) => img.type === "reference");
            const type = refs.length >= 5 ? "persona" : "reference";
            addImage(file, type);
          }
        }
        break;
      }
    }
  }, [images, addImage, mode]);

  const handleReferenceDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      addImage(file, "reference");
    }
  }, [addImage]);

  const handlePersonaDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      addImage(file, "persona");
    }
  }, [addImage]);

  const handleTargetDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      addImage(file, "target");
    }
  }, [addImage]);

  const handleReferenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addImage(file, "reference");
    }
    if (referenceInputRef.current) {
      referenceInputRef.current.value = "";
    }
  };

  const handlePersonaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addImage(file, "persona");
    }
    if (personaInputRef.current) {
      personaInputRef.current.value = "";
    }
  };

  const handleTargetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addImage(file, "target");
    }
    if (targetInputRef.current) {
      targetInputRef.current.value = "";
    }
  };

  const removeImage = (index: number, type: "reference" | "persona" | "target") => {
    setImages((prev) => {
      if (type === "persona" || type === "target") {
        return prev.filter((img) => img.type !== type);
      } else {
        const refs = prev.filter((img) => img.type === "reference");
        const others = prev.filter((img) => img.type !== "reference");
        refs.splice(index, 1);
        return [...refs, ...others];
      }
    });
  };

  // Step 1: Generate persona description
  const handleDescribe = async () => {
    if (images.filter(i => i.type !== "target").length === 0 && !text) return;

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.filter(i => i.type !== "target"),
          text: text,
          providerId: selectedProvider,
          model: selectedProvider === "glm" ? selectedModel : undefined,
          thinking: thinkingEnabled,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setResult(`Error: ${data.error}`);
      } else {
        setResult(data.description || "Empty response from API");
      }
    } catch {
      setResult("Failed to process request. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Replace agent - combine persona description with target image
  const handleReplace = async () => {
    if (!result || !targetImage) return;

    setReplaceLoading(true);
    setReplaceResult("");

    try {
      const response = await fetch("/api/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaDescription: result,
          targetImage: targetImage.data,
          providerId: selectedProvider,
          model: selectedProvider === "glm" ? selectedModel : undefined,
          thinking: thinkingEnabled,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setReplaceResult(`Error: ${data.error}`);
      } else {
        setReplaceResult(data.description || "Empty response from API");
      }
    } catch {
      setReplaceResult("Failed to process request. Please check your API key.");
    } finally {
      setReplaceLoading(false);
    }
  };

  const clearAll = () => {
    setImages([]);
    setText("");
    setResult("");
    setReplaceResult("");
    setMode("describe");
  };

  const hasDescribeInput = images.filter(i => i.type !== "target").length > 0 || text.trim();
  const canReplace = result && !result.startsWith("Error");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Prompt Creator
        </h1>
        <p className="text-gray-400 text-center">
          Generate AI image prompts with persona replacement
        </p>

        {/* Mode Toggle */}
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => setMode("describe")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "describe"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Step 1: Describe Persona
          </button>
          <button
            onClick={() => setMode("replace")}
            disabled={!canReplace}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "replace"
                ? "bg-purple-600 text-white"
                : canReplace
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            Step 2: Replace in Target
          </button>
        </div>
      </div>

      {/* Main Content - Side by Side */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Input */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-300">
              {mode === "describe" ? "Input" : "Target Image"}
            </h2>

            {/* Provider Dropdown & Thinking Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Provider:</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProvider === "glm" && currentProvider?.models && (
                <>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {currentProvider.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={thinkingEnabled}
                      onChange={(e) => setThinkingEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                    />
                    <span className="text-sm text-gray-400">Thinking</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* DESCRIBE MODE */}
          {mode === "describe" && (
            <>
              {/* Images Container */}
              <div className="border border-gray-700 rounded-xl bg-gray-800/50 mb-4">
                {/* Reference Images Section */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300">
                      Reference Images <span className="text-gray-500">({referenceImages.length}/5)</span>
                    </h3>
                    {referenceImages.length > 0 && (
                      <button
                        onClick={() => setImages((prev) => prev.filter((img) => img.type !== "reference"))}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div
                    onDrop={handleReferenceDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex flex-wrap gap-3"
                  >
                    {referenceImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.data}
                          alt={img.filename}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          onClick={() => removeImage(index, "reference")}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-gray-300 px-1 py-0.5 rounded-b-lg truncate">
                          {index + 1}. {img.filename}
                        </div>
                      </div>
                    ))}

                    {referenceImages.length < 5 && (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-[10px] text-gray-500 mt-1">Add</span>
                        <input
                          ref={referenceInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Scene/style to place the persona into</p>
                </div>

                {/* Persona Image Section */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300">
                      Persona Image <span className="text-gray-500">(1)</span>
                    </h3>
                    {personaImage && (
                      <button
                        onClick={() => setImages((prev) => prev.filter((img) => img.type !== "persona"))}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div
                    onDrop={handlePersonaDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex gap-3"
                  >
                    {personaImage ? (
                      <div className="relative group">
                        <img
                          src={personaImage.data}
                          alt={personaImage.filename}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-purple-500"
                        />
                        <button
                          onClick={() => removeImage(0, "persona")}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-gray-300 px-1 py-0.5 rounded-b-lg truncate">
                          {personaImage.filename}
                        </div>
                      </div>
                    ) : (
                      <label className="w-20 h-20 border-2 border-dashed border-purple-500/50 hover:border-purple-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-[10px] text-purple-400 mt-1">Add</span>
                        <input
                          ref={personaInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePersonaSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Person whose face/identity to use</p>
                </div>
              </div>

              {/* Text Input */}
              <div
                onPaste={handlePaste}
                className="border border-gray-700 rounded-xl p-4 bg-gray-800/50 mb-4"
              >
                <h3 className="text-sm font-medium text-gray-300 mb-2">Additional Prompt (optional)</h3>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Add custom instructions... e.g., 'make it cinematic' or 'add dramatic lighting'"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">Paste images here (Ctrl+V) or drag to sections above</p>
              </div>

              {/* Describe Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleDescribe}
                  disabled={loading || !hasDescribeInput}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    loading || !hasDescribeInput
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/20"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    "Generate Persona Description"
                  )}
                </button>
                {hasDescribeInput && (
                  <button
                    onClick={clearAll}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </>
          )}

          {/* REPLACE MODE */}
          {mode === "replace" && (
            <>
              {/* Persona Description Preview */}
              <div className="border border-blue-500/30 rounded-xl p-4 bg-blue-900/20 mb-4">
                <h3 className="text-sm font-medium text-blue-400 mb-2">Persona Description (from Step 1)</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap max-h-32 overflow-auto">
                  {result.substring(0, 300)}{result.length > 300 ? "..." : ""}
                </p>
              </div>

              {/* Target Image Section */}
              <div
                onPaste={handlePaste}
                className="border border-gray-700 rounded-xl p-4 bg-gray-800/50 mb-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">
                    Target Image <span className="text-orange-400">(person to replace)</span>
                  </h3>
                  {targetImage && (
                    <button
                      onClick={() => setImages((prev) => prev.filter((img) => img.type !== "target"))}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  onDrop={handleTargetDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex gap-3"
                >
                  {targetImage ? (
                    <div className="relative group">
                      <img
                        src={targetImage.data}
                        alt={targetImage.filename}
                        className="w-32 h-32 object-cover rounded-lg border-2 border-orange-500"
                      />
                      <button
                        onClick={() => removeImage(0, "target")}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-gray-300 px-1 py-0.5 rounded-b-lg truncate">
                        {targetImage.filename}
                      </div>
                    </div>
                  ) : (
                    <label className="w-32 h-32 border-2 border-dashed border-orange-500/50 hover:border-orange-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-orange-400 mt-2">Add Target</span>
                      <input
                        ref={targetInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleTargetSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Upload an image with a person. The persona&apos;s face will replace this person, but their <span className="text-orange-400">clothes and pose</span> will be kept.
                </p>
              </div>

              {/* Replace Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleReplace}
                  disabled={replaceLoading || !targetImage}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    replaceLoading || !targetImage
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-500/20"
                  }`}
                >
                  {replaceLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Replace Prompt...
                    </span>
                  ) : (
                    "Generate Replace Prompt"
                  )}
                </button>
                <button
                  onClick={() => setMode("describe")}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          )}

          {/* Status */}
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            {mode === "describe" && (
              <>
                {referenceImages.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {referenceImages.length} reference{referenceImages.length > 1 ? "s" : ""}
                  </span>
                )}
                {personaImage && (
                  <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Persona set
                  </span>
                )}
              </>
            )}
            {mode === "replace" && targetImage && (
              <span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Target set
              </span>
            )}
            {currentProvider && (
              <span className="px-3 py-1 rounded-full text-xs bg-gray-700/50 text-gray-400 border border-gray-600/30">
                {currentProvider.name}
              </span>
            )}
          </div>
        </div>

        {/* Right Side - Result */}
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">
            {mode === "describe" ? "Persona Description" : "Replace Prompt"}
          </h2>

          <div className="flex-1 p-6 bg-gray-800/50 border border-gray-700 rounded-xl min-h-[300px]">
            {(mode === "describe" ? loading : replaceLoading) ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-purple-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-gray-400">Processing with {currentProvider?.name || "AI"}...</p>
                </div>
              </div>
            ) : (mode === "describe" ? result : replaceResult) ? (
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  {mode === "describe" && result && !result.startsWith("Error") && (
                    <button
                      onClick={() => setMode("replace")}
                      className="text-sm px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Use for Replace
                    </button>
                  )}
                  {mode === "replace" && <div />}
                  <button
                    onClick={() => navigator.clipboard.writeText(mode === "describe" ? result : replaceResult)}
                    className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed flex-1 overflow-auto">
                  {mode === "describe" ? result : replaceResult}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-center">
                  {mode === "describe"
                    ? "Your persona description will appear here"
                    : "Your replace prompt will appear here"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
