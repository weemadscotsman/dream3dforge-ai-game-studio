import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AIDirectorPanelProps {
  isActive?: boolean;
  onConfigChange?: (config: DirectorConfig) => void;
}

export interface DirectorConfig {
  enabled: boolean;
  intensityCurve: 'rollercoaster' | 'steady' | 'chaotic' | 'tutorial' | 'nightmare';
  baseDifficulty: number;
  adaptationSpeed: number;
  deathSpiralPrevention: boolean;
  dramaticMoments: boolean;
}

interface PlayerMetrics {
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  accuracy: number;
  stressLevel: number;
  flowState: 'bored' | 'engaged' | 'flow' | 'overwhelmed';
  nearDeathExperiences: number;
}

interface PacingPhase {
  name: 'calm' | 'buildup' | 'peak' | 'recovery';
  intensity: number;
  duration: number;
  description: string;
}

interface DirectorEvent {
  id: string;
  timestamp: number;
  type: 'spawn' | 'buff' | 'nerf' | 'dramatic' | 'recovery';
  description: string;
  intensity: number;
}

// ============================================================================
// AI DIRECTOR SIMULATION
// ============================================================================

class AIDirector {
  private config: DirectorConfig;
  private metrics: PlayerMetrics;
  private currentPhase: PacingPhase;
  private phaseStartTime: number;
  private events: DirectorEvent[] = [];
  private intensityHistory: { time: number; intensity: number; phase: string }[] = [];
  private listeners: ((state: DirectorState) => void)[] = [];

  constructor(config: DirectorConfig) {
    this.config = config;
    this.metrics = this.getInitialMetrics();
    this.currentPhase = this.getInitialPhase();
    this.phaseStartTime = Date.now();
  }

  private getInitialMetrics(): PlayerMetrics {
    return {
      health: 100,
      maxHealth: 100,
      kills: 0,
      deaths: 0,
      accuracy: 75,
      stressLevel: 30,
      flowState: 'engaged',
      nearDeathExperiences: 0
    };
  }

  private getInitialPhase(): PacingPhase {
    return {
      name: 'calm',
      intensity: 0.3,
      duration: 30000,
      description: 'Letting the player breathe and recover'
    };
  }

  subscribe(listener: (state: DirectorState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  updateMetrics(metrics: Partial<PlayerMetrics>) {
    this.metrics = { ...this.metrics, ...metrics };
    this.adaptDifficulty();
  }

  private adaptDifficulty() {
    if (!this.config.enabled) return;

    const now = Date.now();
    const phaseElapsed = now - this.phaseStartTime;

    // Check phase transition
    if (phaseElapsed > this.currentPhase.duration) {
      this.transitionPhase();
    }

    // Calculate desired intensity based on player state
    let targetIntensity = this.calculateTargetIntensity();
    
    // Apply intensity curve modifier
    targetIntensity = this.applyIntensityCurve(targetIntensity, phaseElapsed);

    // Death spiral prevention
    if (this.config.deathSpiralPrevention && this.metrics.stressLevel > 80) {
      targetIntensity *= 0.7;
      this.addEvent('recovery', 'Death spiral prevention activated', 0.3);
    }

    // Record history
    this.intensityHistory.push({
      time: now,
      intensity: targetIntensity,
      phase: this.currentPhase.name
    });

    // Keep history manageable
    if (this.intensityHistory.length > 100) {
      this.intensityHistory.shift();
    }

    this.notify();
  }

  private calculateTargetIntensity(): number {
    const { health, maxHealth, stressLevel, flowState, nearDeathExperiences } = this.metrics;
    const healthPercent = health / maxHealth;

    // Base intensity from config
    let intensity = this.config.baseDifficulty / 100;

    // Health factor - lower health = lower intensity (give player a break)
    if (healthPercent < 0.3) {
      intensity *= 0.6;
    } else if (healthPercent < 0.5) {
      intensity *= 0.8;
    }

    // Flow state adjustments
    switch (flowState) {
      case 'bored':
        intensity *= 1.3;
        break;
      case 'overwhelmed':
        intensity *= 0.7;
        break;
      case 'flow':
        // Keep it steady, they're in the zone
        break;
    }

    // Stress level adjustment
    if (stressLevel > 70) {
      intensity *= 0.8;
    } else if (stressLevel < 20) {
      intensity *= 1.2;
    }

    // Near death experiences = they've had enough
    if (nearDeathExperiences > 2) {
      intensity *= 0.75;
    }

    return Math.max(0.1, Math.min(1, intensity));
  }

  private applyIntensityCurve(baseIntensity: number, phaseElapsed: number): number {
    const progress = phaseElapsed / this.currentPhase.duration;

    switch (this.config.intensityCurve) {
      case 'rollercoaster':
        // Sine wave pattern
        return baseIntensity * (0.7 + 0.3 * Math.sin(progress * Math.PI * 2));
      
      case 'steady':
        // Consistent intensity
        return baseIntensity;
      
      case 'chaotic':
        // Random fluctuations
        return baseIntensity * (0.5 + Math.random() * 0.5);
      
      case 'tutorial':
        // Gradual increase
        return baseIntensity * (0.3 + 0.7 * progress);
      
      case 'nightmare':
        // Always high, occasionally spikes
        return baseIntensity * (0.8 + 0.2 * (progress > 0.8 ? 2 : 1));
      
      default:
        return baseIntensity;
    }
  }

  private transitionPhase() {
    const phases: PacingPhase['name'][] = ['calm', 'buildup', 'peak', 'recovery'];
    const currentIndex = phases.indexOf(this.currentPhase.name);
    const nextIndex = (currentIndex + 1) % phases.length;
    
    const phaseConfigs: Record<PacingPhase['name'], Partial<PacingPhase>> = {
      calm: { intensity: 0.3, duration: 20000, description: 'Recovery phase - let player breathe' },
      buildup: { intensity: 0.6, duration: 25000, description: 'Ramping up the tension' },
      peak: { intensity: 0.9, duration: 15000, description: 'Maximum intensity!' },
      recovery: { intensity: 0.4, duration: 20000, description: 'Cooling down after peak' }
    };

    this.currentPhase = {
      name: phases[nextIndex],
      ...phaseConfigs[phases[nextIndex]]
    } as PacingPhase;

    this.phaseStartTime = Date.now();

    // Trigger dramatic moment if enabled and entering peak
    if (this.config.dramaticMoments && this.currentPhase.name === 'peak') {
      this.addEvent('dramatic', 'Dramatic moment triggered!', 1.0);
    }
  }

  private addEvent(type: DirectorEvent['type'], description: string, intensity: number) {
    this.events.push({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      description,
      intensity
    });

    // Keep last 50 events
    if (this.events.length > 50) {
      this.events.shift();
    }
  }

  getState(): DirectorState {
    return {
      config: this.config,
      metrics: this.metrics,
      currentPhase: this.currentPhase,
      events: this.events.slice(-10),
      intensityHistory: this.intensityHistory,
      recommendedAction: this.getRecommendedAction()
    };
  }

  private getRecommendedAction(): string {
    const { health, maxHealth, stressLevel, flowState } = this.metrics;
    const healthPercent = health / maxHealth;

    if (healthPercent < 0.2) {
      return 'CRITICAL: Spawn health pickup immediately';
    }
    if (stressLevel > 80) {
      return 'Reduce enemy spawn rate by 50%';
    }
    if (flowState === 'bored') {
      return 'Increase challenge - spawn elite enemy';
    }
    if (flowState === 'overwhelmed') {
      return 'Ease up - reduce enemy count';
    }
    if (this.currentPhase.name === 'peak') {
      return 'Maintain pressure - spawn boss minions';
    }

    return 'Maintain current parameters';
  }

  updateConfig(config: Partial<DirectorConfig>) {
    this.config = { ...this.config, ...config };
    this.notify();
  }
}

interface DirectorState {
  config: DirectorConfig;
  metrics: PlayerMetrics;
  currentPhase: PacingPhase;
  events: DirectorEvent[];
  intensityHistory: { time: number; intensity: number; phase: string }[];
  recommendedAction: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AIDirectorPanel: React.FC<AIDirectorPanelProps> = ({
  isActive = false,
  onConfigChange
}) => {
  const [config, setConfig] = useState<DirectorConfig>({
    enabled: true,
    intensityCurve: 'rollercoaster',
    baseDifficulty: 50,
    adaptationSpeed: 50,
    deathSpiralPrevention: true,
    dramaticMoments: true
  });

  const [directorState, setDirectorState] = useState<DirectorState | null>(null);
  const directorRef = useRef<AIDirector | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  // Initialize AI Director
  useEffect(() => {
    directorRef.current = new AIDirector(config);
    const unsubscribe = directorRef.current.subscribe(setDirectorState);
    
    return () => {
      unsubscribe();
      directorRef.current = null;
    };
  }, []);

  // Update director when config changes
  useEffect(() => {
    directorRef.current?.updateConfig(config);
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  // Simulation loop
  useEffect(() => {
    if (!simulationActive || !directorRef.current) return;

    const interval = setInterval(() => {
      // Simulate random player metrics changes
      const randomMetrics: Partial<PlayerMetrics> = {
        health: 30 + Math.random() * 70,
        stressLevel: 20 + Math.random() * 60,
        accuracy: 50 + Math.random() * 40,
        flowState: ['bored', 'engaged', 'flow', 'overwhelmed'][Math.floor(Math.random() * 4)] as PlayerMetrics['flowState']
      };
      
      directorRef.current?.updateMetrics(randomMetrics);
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationActive]);

  const chartData = directorState?.intensityHistory.map((h, i) => ({
    time: i,
    intensity: h.intensity * 100,
    phase: h.phase
  })) || [];

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'calm': return '#22c55e';
      case 'buildup': return '#f59e0b';
      case 'peak': return '#ef4444';
      case 'recovery': return '#3b82f6';
      default: return '#6366f1';
    }
  };

  const getEventIcon = (type: DirectorEvent['type']) => {
    switch (type) {
      case 'spawn': return '👾';
      case 'buff': return '⚡';
      case 'nerf': return '🔻';
      case 'dramatic': return '🎭';
      case 'recovery': return '💚';
      default: return '📌';
    }
  };

  return (
    <div className="w-full h-full bg-zinc-950 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎮</span> AI Director
            </h2>
            <p className="text-zinc-500 text-xs">
              {config.enabled ? 'Actively adapting difficulty' : 'Disabled'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimulationActive(!simulationActive)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              simulationActive
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-green-500/20 text-green-400 border border-green-500/50'
            }`}
          >
            {simulationActive ? '⏹ Stop Sim' : '▶ Start Sim'}
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-zinc-300">Enabled</span>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          {/* Current Status */}
          {directorState && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs uppercase">Phase</p>
                <p className={`text-lg font-bold capitalize`} style={{ color: getPhaseColor(directorState.currentPhase.name) }}>
                  {directorState.currentPhase.name}
                </p>
                <p className="text-zinc-600 text-xs">{directorState.currentPhase.description}</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs uppercase">Intensity</p>
                <p className="text-lg font-bold text-indigo-400">
                  {Math.round(directorState.currentPhase.intensity * 100)}%
                </p>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${directorState.currentPhase.intensity * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs uppercase">Flow State</p>
                <p className={`text-lg font-bold capitalize ${
                  directorState.metrics.flowState === 'flow' ? 'text-green-400' :
                  directorState.metrics.flowState === 'overwhelmed' ? 'text-red-400' :
                  directorState.metrics.flowState === 'bored' ? 'text-amber-400' :
                  'text-blue-400'
                }`}>
                  {directorState.metrics.flowState}
                </p>
                <p className="text-zinc-600 text-xs">Player engagement</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs uppercase">Stress</p>
                <p className="text-lg font-bold text-purple-400">
                  {Math.round(directorState.metrics.stressLevel)}%
                </p>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      directorState.metrics.stressLevel > 70 ? 'bg-red-500' :
                      directorState.metrics.stressLevel > 40 ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${directorState.metrics.stressLevel}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Intensity Graph */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-zinc-300 mb-4">Intensity Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" stroke="#52525b" fontSize={10} hide />
                <YAxis domain={[0, 100]} stroke="#52525b" fontSize={10} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Intensity']}
                />
                <ReferenceLine y={50} stroke="#52525b" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="intensity"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#intensityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Configuration */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-zinc-300 mb-4">Director Configuration</h3>
            
            <div className="space-y-4">
              {/* Intensity Curve */}
              <div>
                <label className="text-zinc-400 text-xs uppercase mb-2 block">Intensity Curve</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'rollercoaster', label: '🎢 Rollercoaster', desc: 'Peaks and valleys' },
                    { id: 'steady', label: '📊 Steady', desc: 'Consistent pressure' },
                    { id: 'chaotic', label: '🎲 Chaotic', desc: 'Random spikes' },
                    { id: 'tutorial', label: '📚 Tutorial', desc: 'Gradual ramp' },
                    { id: 'nightmare', label: '💀 Nightmare', desc: 'Always intense' }
                  ].map(curve => (
                    <button
                      key={curve.id}
                      onClick={() => setConfig({ ...config, intensityCurve: curve.id as any })}
                      className={`p-2 rounded-lg text-xs text-center transition-all ${
                        config.intensityCurve === curve.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      <div className="text-lg mb-1">{curve.label.split(' ')[0]}</div>
                      <div className="font-medium">{curve.label.split(' ')[1]}</div>
                      <div className="text-[10px] opacity-70">{curve.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-zinc-400 text-xs">Base Difficulty</label>
                    <span className="text-zinc-300 text-xs">{config.baseDifficulty}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.baseDifficulty}
                    onChange={(e) => setConfig({ ...config, baseDifficulty: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-zinc-400 text-xs">Adaptation Speed</label>
                    <span className="text-zinc-300 text-xs">{config.adaptationSpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.adaptationSpeed}
                    onChange={(e) => setConfig({ ...config, adaptationSpeed: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.deathSpiralPrevention}
                    onChange={(e) => setConfig({ ...config, deathSpiralPrevention: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-300">Death Spiral Prevention</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.dramaticMoments}
                    onChange={(e) => setConfig({ ...config, dramaticMoments: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-300">Dramatic Moments</span>
                </label>
              </div>
            </div>
          </div>

          {/* Recommended Action */}
          {directorState && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-indigo-400 mb-2">🎯 Recommended Action</h3>
              <p className="text-zinc-300 text-sm">{directorState.recommendedAction}</p>
            </div>
          )}

          {/* Event Log */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <h3 className="text-sm font-bold text-zinc-300 p-4 border-b border-zinc-800">Event Log</h3>
            <div className="max-h-40 overflow-y-auto p-2 space-y-1">
              {directorState?.events.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-4">No events yet...</p>
              ) : (
                directorState?.events.slice().reverse().map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 p-2 bg-zinc-950 rounded-lg text-xs"
                  >
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                    <div className="flex-1">
                      <p className="text-zinc-300">{event.description}</p>
                      <p className="text-zinc-600">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs ${
                      event.intensity > 0.7 ? 'bg-red-500/20 text-red-400' :
                      event.intensity > 0.4 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {Math.round(event.intensity * 100)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDirectorPanel;
