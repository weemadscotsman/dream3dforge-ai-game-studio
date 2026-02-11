import { useEffect, useRef, useCallback } from 'react';
import { saveProject, loadProject, createProject, generateProjectId, StoredProject } from '../services/storageService';
import { UserPreferences, GeneratedGame } from '../types';

interface AutoSaveState {
  preferences: UserPreferences;
  game: GeneratedGame | null;
  specFrozen: boolean;
  seedLocked: boolean;
}

/**
 * Auto-save hook - saves project state every 30 seconds
 * Also handles initial load from storage
 */
export function useAutoSave(
  state: AutoSaveState,
  projectId: string | null,
  setProjectId: (id: string) => void,
  onLoad?: (project: StoredProject) => void
) {
  const lastSaveRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate state hash for change detection
  const getStateHash = useCallback((s: AutoSaveState) => {
    return JSON.stringify({
      prefs: s.preferences,
      game: s.game?.title,
      frozen: s.specFrozen,
      locked: s.seedLocked
    });
  }, []);

  // Save function
  const save = useCallback(async () => {
    const currentHash = getStateHash(state);
    
    // Skip if nothing changed
    if (currentHash === lastSaveRef.current) {
      return;
    }

    let id = projectId;
    
    // Create new project if none exists
    if (!id) {
      id = generateProjectId();
      setProjectId(id);
    }

    const project: StoredProject = {
      id,
      name: state.game?.title || 'Untitled Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preferences: state.preferences,
      game: state.game,
      specFrozen: state.specFrozen,
      seedLocked: state.seedLocked
    };

    try {
      await saveProject(project);
      lastSaveRef.current = currentHash;
      console.log('[AutoSave] Project saved:', id);
    } catch (error) {
      console.error('[AutoSave] Failed to save:', error);
    }
  }, [state, projectId, setProjectId, getStateHash]);

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    saveTimeoutRef.current = setInterval(() => {
      save();
    }, 30000);

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
    };
  }, [save]);

  // Save on unmount
  useEffect(() => {
    return () => {
      save();
    };
  }, [save]);

  // Load project on mount
  useEffect(() => {
    const loadSavedProject = async () => {
      // Check URL for project ID
      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get('project');
      
      if (urlProjectId) {
        try {
          const project = await loadProject(urlProjectId);
          if (project && onLoad) {
            onLoad(project);
            setProjectId(urlProjectId);
            lastSaveRef.current = getStateHash({
              preferences: project.preferences,
              game: project.game,
              specFrozen: project.specFrozen,
              seedLocked: project.seedLocked
            });
          }
        } catch (error) {
          console.error('[AutoSave] Failed to load project:', error);
        }
      }
    };

    loadSavedProject();
  }, [onLoad, setProjectId, getStateHash]);

  // Manual save trigger
  return { save };
}

/**
 * Sound settings hook - persists sound preferences
 */
export function useSoundSettings() {
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem('d3f-sound-settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore
    }
    return { enabled: true, volume: 0.7 };
  };

  const saveSettings = (settings: { enabled: boolean; volume: number }) => {
    try {
      localStorage.setItem('d3f-sound-settings', JSON.stringify(settings));
    } catch (e) {
      // Ignore
    }
  };

  return { getInitialState, saveSettings };
}
