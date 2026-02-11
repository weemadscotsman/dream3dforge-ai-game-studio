import React, { useState, useRef, useEffect } from 'react';
import { ModelType, ImageSize, GeneratedAsset, ProcessingState, RenderStyle, MediaType, VideoModel, AdvancedConfig, AssetRole, AssetGenerationMode, GeneratedGame } from '../types';
import SettingsPanel from './SettingsPanel';
import EngineExport from './EngineExport';
import { generateGameAsset, generateVeoVideo } from '../services/assetService';
import { generateOpenRouterVideo } from '../services/openRouterService';
import { blobToBase64 } from '../services/utils/fileUtils';
import { generateMaps } from '../services/textureService';
import { removeWhiteBackground } from '../services/utils/imageProcessing';
import { Icons } from './Icons';
// @ts-ignore
import JSZip from 'jszip';

interface AssetStudioProps {
    onAssetAssigned?: (asset: GeneratedAsset) => void;
    projectContext?: GeneratedGame | null;
}

const BATCH_ACTIONS = [
    'Idle Animation',
    'Walk Cycle',
    'Run Cycle',
    'Jump Animation',
    'Attack (Melee)',
    'Hit Reaction',
    'Death'
];

export const AssetStudio: React.FC<AssetStudioProps> = ({ onAssetAssigned, projectContext }) => {
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [prompt, setPrompt] = useState('');
  
  // Image State
  const [model, setModel] = useState<ModelType>(ModelType.NANO_BANANA);
  const [style, setStyle] = useState<RenderStyle>(RenderStyle.PRE_RENDERED_3D);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [autoPbr, setAutoPbr] = useState(true);
  
  // Asset Mode State
  const [assetMode, setAssetMode] = useState<AssetGenerationMode>(AssetGenerationMode.SPRITE);
  const [animAction, setAnimAction] = useState('Walk Cycle');

  // Advanced State
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
      temperature: 1.0,
      topP: 0.95,
      topK: 64,
      seed: 0,
      systemInstruction: ""
  });
  
  // Video State
  const [videoModel, setVideoModel] = useState<VideoModel>(VideoModel.VEO_FAST);
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState('luma/ray-2');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);
  const [sessionAssets, setSessionAssets] = useState<GeneratedAsset[]>([]);
  
  const [processing, setProcessing] = useState<ProcessingState>({ 
    isGenerating: false, stage: '', progress: 0 
  });
  const [error, setError] = useState<string | null>(null);
  
  // Assignment State
  const [selectedRole, setSelectedRole] = useState<AssetRole>(AssetRole.NONE);

  // Automation State
  const [automation, setAutomation] = useState({
      autoDownload: false,
      autoInject: false,
      lockSeed: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PROJECT CONTEXT AUTO-FILL ---
  useEffect(() => {
    if (projectContext && !prompt) {
        // Suggest a prompt based on the blueprint if the field is empty
    }
  }, [projectContext]);

  const useSuggestion = (text: string) => {
      setPrompt(text);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);
      const base64 = await blobToBase64(file);
      setUploadedPreview(`data:${file.type};base64,${base64}`);
    }
  };

  const handleStyleSelect = (s: string) => {
    if (prompt.includes(s)) return;
    setPrompt(prev => prev ? `${prev}, ${s}` : s);
  };

  const createAssetObject = (
    id: string, 
    type: MediaType, 
    url: string, 
    mode: AssetGenerationMode, 
    currentSeed: number,
    action?: string
  ): GeneratedAsset => {
      return {
          id,
          mediaType: type,
          imageUrl: type === 'IMAGE' ? url : undefined,
          videoUrl: type === 'VIDEO' ? url : undefined,
          spriteSheetUrl: mode === AssetGenerationMode.SHEET ? url : undefined,
          isSpriteSheet: mode === AssetGenerationMode.SHEET,
          timestamp: Date.now(),
          prompt: action ? `${prompt} (${action})` : prompt, 
          model, seed: currentSeed, style, 
          engineFormat: type === 'VIDEO' ? 'MP4' : 'Universal',
          role: AssetRole.NONE // Default to NONE, injection will override
      };
  };

  // --- AUTOMATION HANDLERS ---
  const performAutoActions = (asset: GeneratedAsset) => {
      // 1. Add to Session Library
      setSessionAssets(prev => [asset, ...prev]);

      // 2. Auto Download
      if (automation.autoDownload) {
          const a = document.createElement('a');
          const url = asset.videoUrl || asset.imageUrl;
          if (url) {
              a.href = url;
              a.download = `auto_gen_${asset.timestamp}_${asset.id.slice(0,4)}.${asset.mediaType === 'VIDEO' ? 'mp4' : 'png'}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
          }
      }

      // 3. Auto Inject
      if (automation.autoInject && onAssetAssigned) {
          // If no role is selected, we inject as Unassigned (AssetRole.NONE) or use selectedRole
          const injectedAsset = { ...asset, role: selectedRole };
          onAssetAssigned(injectedAsset);
      }

      // 4. Lock Seed (Update state for NEXT run)
      if (automation.lockSeed) {
          setAdvancedConfig(prev => ({ ...prev, seed: asset.seed }));
      }
  };

  // --- NATIVE TOOLS ---
  const handleManualBgRemoval = async () => {
    if (!generatedAsset || !generatedAsset.imageUrl || generatedAsset.mediaType !== 'IMAGE') return;
    
    setProcessing({ isGenerating: true, stage: 'Tool: Removing White Background...', progress: 30 });
    try {
        const cleanUrl = await removeWhiteBackground(generatedAsset.imageUrl, 40);
        
        const updatedAsset = { 
            ...generatedAsset, 
            imageUrl: cleanUrl,
            // If it's a sprite sheet, update that too
            spriteSheetUrl: generatedAsset.isSpriteSheet ? cleanUrl : undefined
        };
        
        setGeneratedAsset(updatedAsset);
        // Update session library
        setSessionAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
        
        setProcessing({ isGenerating: false, stage: 'Done', progress: 100 });
    } catch (e: any) {
        setError(`Background removal failed: ${e.message}`);
        setProcessing({ isGenerating: false, stage: 'Error', progress: 0 });
    }
  };

  // --- BATCH GENERATOR LOGIC ---
  const handleGenerateBatch = async () => {
      if (!prompt && !uploadedImage) {
          setError("Batch requires a prompt or uploaded identity source.");
          return;
      }
      setError(null);
      
      const runtimeSeed = advancedConfig.seed === 0 
        ? Math.floor(Math.random() * 2147483647) 
        : advancedConfig.seed;

      setProcessing({ isGenerating: true, stage: 'Batch Init: Locking Identity...', progress: 0 });

      try {
          for (let i = 0; i < BATCH_ACTIONS.length; i++) {
              const currentAction = BATCH_ACTIONS[i];
              setProcessing({ 
                isGenerating: true, 
                stage: `Batch: Generating ${currentAction} (${i + 1}/${BATCH_ACTIONS.length})...`, 
                progress: ((i) / BATCH_ACTIONS.length) * 100 
              });

              if (i > 0) await new Promise(resolve => setTimeout(resolve, 1500));

              const resultImage = await generateGameAsset({
                prompt,
                sourceImage: uploadedImage,
                model,
                style,
                imageSize,
                aspectRatio,
                advancedConfig,
                runtimeSeed,
                assetMode: AssetGenerationMode.SHEET,
                animationAction: currentAction
            });

            let newAsset = createAssetObject(
                crypto.randomUUID(), 
                'IMAGE', 
                resultImage, 
                AssetGenerationMode.SHEET, 
                runtimeSeed,
                currentAction
            );
            
            // AUTOMATIC PBR GENERATION FOR BATCH
            if (autoPbr) {
                setProcessing({ 
                    isGenerating: true, 
                    stage: `Batch: Baking Maps for ${currentAction}...`, 
                    progress: ((i + 0.5) / BATCH_ACTIONS.length) * 100 
                });
                try {
                    const maps = await generateMaps(resultImage);
                    newAsset = {
                        ...newAsset,
                        normalMapUrl: maps.normal,
                        roughnessMapUrl: maps.roughness,
                        ormMapUrl: maps.orm,
                        heightMapUrl: maps.height
                    };
                } catch (mapErr) {
                    console.warn("Batch Map Gen Failed for " + currentAction, mapErr);
                }
            }
            
            setGeneratedAsset(newAsset);
            performAutoActions(newAsset);
          }
          setProcessing({ isGenerating: false, stage: 'Batch Complete', progress: 100 });
      } catch (err: any) {
          console.error("Batch Failed:", err);
          setError(`Batch halted: ${err.message}`);
          setProcessing({ isGenerating: false, stage: 'Error', progress: 0 });
      }
  };

  const handleGenerate = async () => {
    if (!prompt && !uploadedImage) {
      setError("Please provide a text prompt or upload an image.");
      return;
    }

    setError(null);
    setGeneratedAsset(null);
    setProcessing({ isGenerating: true, stage: 'Initializing Backend Generator...', progress: 5 });

    const runtimeSeed = advancedConfig.seed === 0 
        ? Math.floor(Math.random() * 2147483647) 
        : advancedConfig.seed;

    try {
        if (mediaType === 'IMAGE') {
            setProcessing(prev => ({ ...prev, stage: 'Generating Asset...', progress: 20 }));
            const resultImage = await generateGameAsset({
                prompt,
                sourceImage: uploadedImage,
                model,
                style,
                imageSize,
                aspectRatio,
                advancedConfig,
                runtimeSeed,
                assetMode,
                animationAction: animAction
            });

            setProcessing(prev => ({ ...prev, stage: 'Processing Asset...', progress: 70 }));

            const newAsset = createAssetObject(
                crypto.randomUUID(), 
                'IMAGE', 
                resultImage, 
                assetMode, 
                runtimeSeed,
                assetMode === AssetGenerationMode.SHEET ? animAction : undefined
            );

            setGeneratedAsset(newAsset);
            performAutoActions(newAsset);
            
            if (autoPbr) {
                // FORCE AWAIT: Ensures maps are ready before we say "Done"
                await handleGeneratePBR(newAsset);
            } else {
                setProcessing({ isGenerating: false, stage: 'Done', progress: 100 });
            }

        } else {
            setProcessing(prev => ({ ...prev, stage: 'Rendering Video...', progress: 10 }));
            
            let videoUrl = '';
            if (videoModel === VideoModel.OPEN_ROUTER) {
                if (!openRouterKey) throw new Error("OpenRouter API Key required.");
                const base64 = uploadedImage ? await blobToBase64(uploadedImage) : undefined;
                videoUrl = await generateOpenRouterVideo({
                    prompt,
                    apiKey: openRouterKey,
                    model: openRouterModel,
                    sourceImage: base64 ? `data:${uploadedImage?.type};base64,${base64}` : undefined
                });
            } else {
                videoUrl = await generateVeoVideo({
                    prompt,
                    sourceImage: uploadedImage,
                    model: videoModel,
                    aspectRatio
                });
            }
            
            setProcessing({ isGenerating: false, stage: 'Done', progress: 100 });
            const newAsset = {
                id: crypto.randomUUID(),
                mediaType: 'VIDEO' as MediaType,
                videoUrl,
                timestamp: Date.now(),
                prompt, model: videoModel, seed: 0, engineFormat: 'MP4',
            };
            setGeneratedAsset(newAsset);
            performAutoActions(newAsset);
        }
    } catch (err: any) {
      setProcessing({ isGenerating: false, stage: 'Error', progress: 0 });
      setError(err.message);
    }
  };

  const handleGeneratePBR = async (targetAsset: GeneratedAsset) => {
    if (!targetAsset.imageUrl) return;
    setProcessing({ isGenerating: true, stage: 'Baking PBR Maps (Normal/Roughness/ORM)...', progress: 80 });
    try {
        const maps = await generateMaps(targetAsset.imageUrl);
        const updated = {
            ...targetAsset,
            normalMapUrl: maps.normal,
            roughnessMapUrl: maps.roughness,
            ormMapUrl: maps.orm,
            heightMapUrl: maps.height
        };
        setGeneratedAsset(updated);
        // Important: Update the session library too so if we switch back, the maps are there
        setSessionAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
        setProcessing({ isGenerating: false, stage: 'Done', progress: 100 });
    } catch (err) {
        console.error("PBR Generation Failed", err);
        setProcessing({ isGenerating: false, stage: 'Error generating maps', progress: 0 });
    }
  };

  const handleAssignRole = () => {
      if (generatedAsset && onAssetAssigned) {
          const updated = { ...generatedAsset, role: selectedRole };
          onAssetAssigned(updated);
          triggerButtonFeedback('assign-btn', 'INJECTED');
      }
  };

  const triggerButtonFeedback = (id: string, text: string) => {
      const btn = document.getElementById(id);
      if(btn) {
          const orig = btn.innerText;
          btn.innerText = text;
          btn.classList.add("bg-green-600", "text-white");
          setTimeout(() => { 
              btn.innerText = orig; 
              btn.classList.remove("bg-green-600", "text-white");
          }, 1000);
      }
  };

  return (
    <div className="flex h-full p-4 gap-4">
      {/* LEFT COLUMN */}
      <div className="w-[340px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 shrink-0">
        {/* Automation & Context Widgets */}
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-lg">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800">
                <Icons.Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Pipeline Automation</span>
             </div>
             <div className="space-y-2">
                 <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">Auto Download</span>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${automation.autoDownload ? 'bg-green-500' : 'bg-zinc-700'}`} onClick={() => setAutomation(p => ({...p, autoDownload: !p.autoDownload}))}>
                        <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${automation.autoDownload ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                 </label>
                 <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">Auto Inject to Architect</span>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${automation.autoInject ? 'bg-indigo-500' : 'bg-zinc-700'}`} onClick={() => setAutomation(p => ({...p, autoInject: !p.autoInject}))}>
                        <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${automation.autoInject ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                 </label>
             </div>
        </div>

        {projectContext && (
            <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                    <Icons.Layers className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Project Context</span>
                </div>
                <div className="text-[10px] text-zinc-500 mb-2 font-mono truncate">{projectContext.title}</div>
            </div>
        )}
        
        {/* Upload & Prompt */}
        <div 
          className={`relative group border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer ${
            uploadedPreview ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-700 bg-zinc-900/50 hover:border-indigo-500/50 hover:bg-zinc-800'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
          {uploadedPreview ? (
            <div className="relative z-0">
              <img src={uploadedPreview} alt="Upload" className="w-full h-32 object-contain rounded-lg shadow-lg" />
              <button 
                onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setUploadedPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-20 hover:bg-red-600 transition-colors"
              >
                <Icons.Warning className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-2 py-2">
              <Icons.Atom className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
              <p className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200">UPLOAD REFERENCE</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-24 text-xs placeholder-zinc-700"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={processing.isGenerating}
          className={`w-full py-3 rounded-lg font-bold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
            processing.isGenerating
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
          }`}
        >
          {processing.isGenerating ? <Icons.Zap className="w-4 h-4 animate-spin" /> : <Icons.Zap className="w-4 h-4" />}
          {processing.isGenerating ? processing.stage : "GENERATE ASSET"}
        </button>

        {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20 flex items-center gap-2"><Icons.Warning className="w-3 h-3"/> {error}</div>}
      </div>

      {/* CENTER COLUMN: Preview & Tools */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        <SettingsPanel 
          mediaType={mediaType} setMediaType={setMediaType}
          model={model} setModel={setModel}
          style={style} setStyle={setStyle}
          imageSize={imageSize} setImageSize={setImageSize}
          assetMode={assetMode} setAssetMode={setAssetMode}
          animAction={animAction} setAnimAction={setAnimAction}
          onGenerateAll={handleGenerateBatch} 
          videoModel={videoModel} setVideoModel={setVideoModel}
          openRouterKey={openRouterKey} setOpenRouterKey={setOpenRouterKey}
          openRouterModel={openRouterModel} setOpenRouterModel={setOpenRouterModel}
          advancedConfig={advancedConfig} setAdvancedConfig={setAdvancedConfig}
          aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
          disabled={processing.isGenerating}
          onStyleSelect={handleStyleSelect}
          autoPbr={autoPbr} setAutoPbr={setAutoPbr}
        />

        <div className="flex-grow bg-zinc-950 rounded-xl border border-zinc-800 relative flex items-center justify-center overflow-hidden mt-4 group">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          {generatedAsset ? (
            <div className="flex flex-col items-center gap-4 max-h-full overflow-y-auto p-4 w-full z-10 animate-in fade-in zoom-in duration-300">
                {generatedAsset.mediaType === 'VIDEO' ? (
                    <video src={generatedAsset.videoUrl} controls autoPlay loop className="max-h-[300px] rounded shadow-2xl border border-zinc-800" />
                ) : (
                    <div className="relative group/image">
                        <img src={generatedAsset.spriteSheetUrl || generatedAsset.imageUrl} className="max-h-[300px] object-contain shadow-2xl border border-zinc-800 bg-[url('https://transparent-textures.patterns.s3.amazonaws.com/subtle_dots.png')]" />
                        {/* Tool Overlay */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                             <button 
                                onClick={handleManualBgRemoval}
                                title="Remove White Background (Native Tool)"
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg shadow-lg border border-zinc-600"
                             >
                                 <Icons.Tools className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                )}
                
                {/* Maps Preview */}
                {generatedAsset.normalMapUrl && (
                    <div className="flex gap-2 p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
                        <img src={generatedAsset.normalMapUrl} title="Normal" className="w-12 h-12 border border-zinc-700 rounded bg-black/50" />
                        <img src={generatedAsset.roughnessMapUrl} title="Roughness" className="w-12 h-12 border border-zinc-700 rounded bg-black/50" />
                        <img src={generatedAsset.ormMapUrl} title="ORM" className="w-12 h-12 border border-zinc-700 rounded bg-black/50" />
                        <img src={generatedAsset.heightMapUrl} title="Height" className="w-12 h-12 border border-zinc-700 rounded bg-black/50" />
                    </div>
                )}
            </div>
          ) : (
              <div className="text-zinc-700 flex flex-col items-center select-none">
                  <Icons.Box className="w-16 h-16 mb-4 opacity-10" />
                  <span className="text-xs uppercase tracking-widest font-bold opacity-30">Awaiting Neural Input</span>
              </div>
          )}

          {processing.isGenerating && (
             <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                 <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${processing.progress}%` }} />
                 </div>
                 <span className="text-indigo-400 text-xs font-mono mt-3 animate-pulse uppercase tracking-wider">{processing.stage}</span>
             </div>
          )}
        </div>

        {/* --- ASSIGNMENT PANEL --- */}
        {(generatedAsset) && mediaType === 'IMAGE' && (
            <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3 flex-1">
                    <Icons.Code className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Inject to Architect As:
                    </span>
                    <select 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as AssetRole)}
                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white outline-none flex-1 transition-colors focus:border-green-500"
                    >
                        <option value={AssetRole.NONE}>-- Select Role --</option>
                        {Object.values(AssetRole).filter(r => r !== AssetRole.NONE).map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center gap-2">
                     {/* MANUAL MAP GENERATION BUTTON */}
                     {!generatedAsset.normalMapUrl && (
                         <button 
                            onClick={() => handleGeneratePBR(generatedAsset)}
                            className="ml-2 px-3 py-1.5 bg-indigo-900/50 hover:bg-indigo-900 text-indigo-300 text-xs font-bold rounded uppercase tracking-wide border border-indigo-700/50 transition-colors"
                        >
                            Generate Maps
                        </button>
                     )}
                     <button 
                        onClick={handleManualBgRemoval}
                        className="ml-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded uppercase tracking-wide border border-zinc-600"
                    >
                        Auto-Clean BG
                    </button>
                    <button 
                        id="assign-btn"
                        onClick={handleAssignRole}
                        disabled={selectedRole === AssetRole.NONE}
                        className="px-4 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded uppercase tracking-wide transition-all shadow-lg shadow-green-900/20"
                    >
                        Confirm Injection
                    </button>
                </div>
            </div>
        )}

        <EngineExport asset={generatedAsset} />
      </div>

      {/* RIGHT COLUMN: Session Library */}
      <div className="w-56 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/50">
             <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                 <Icons.Box className="w-3 h-3" />
                 Session Library
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
             {sessionAssets.map((asset) => (
                 <div key={asset.id} onClick={() => setGeneratedAsset(asset)} className={`group p-2 rounded border cursor-pointer transition-all ${generatedAsset?.id === asset.id ? 'bg-zinc-800 border-indigo-500' : 'bg-zinc-950 border-zinc-800'}`}>
                     <div className="aspect-video bg-black rounded overflow-hidden mb-2 relative">
                         <img src={asset.spriteSheetUrl || asset.imageUrl} className="w-full h-full object-cover" />
                     </div>
                     <div className="text-[9px] text-zinc-400 truncate font-mono">{asset.prompt}</div>
                 </div>
             ))}
          </div>
      </div>
    </div>
  );
};