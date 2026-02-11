import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Genre } from '../types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface NarrativePanelProps {
  gameConcept: string;
  genre: Genre;
  onNarrativeGenerated?: (narrative: GeneratedNarrative) => void;
}

export interface GeneratedNarrative {
  worldLore: WorldLore;
  protagonist: Character;
  antagonist: Character;
  supportingCast: Character[];
  storyStructure: StoryStructure;
  quests: Quest[];
  itemLore: ItemLore[];
  enemyLore: EnemyLore[];
  locations: Location[];
}

interface WorldLore {
  name: string;
  setting: string;
  history: string;
  factions: Faction[];
  rules: string[];
  mysteries: string[];
}

interface Faction {
  name: string;
  description: string;
  alignment: 'ally' | 'enemy' | 'neutral';
}

interface Character {
  name: string;
  role: string;
  backstory: string;
  motivation: string;
  personality: string[];
  appearance: string;
}

interface StoryStructure {
  act1: StoryAct;
  act2: StoryAct;
  act3: StoryAct;
  themes: string[];
}

interface StoryAct {
  title: string;
  summary: string;
  keyEvents: string[];
}

interface Quest {
  id: string;
  name: string;
  type: 'main' | 'side' | 'optional';
  description: string;
  objectives: string[];
  rewards: string[];
}

interface ItemLore {
  name: string;
  type: string;
  description: string;
  backstory: string;
  previousOwner?: string;
  powers: string[];
  curse?: string;
}

interface EnemyLore {
  name: string;
  type: string;
  origin: string;
  behavior: string;
  weakness: string;
  territory: string;
}

interface Location {
  name: string;
  type: string;
  description: string;
  significance: string;
  connectedTo: string[];
}

// ============================================================================
// NAME GENERATORS
// ============================================================================

const SYLLABLES = {
  sciFi: {
    prefixes: ['Neo', 'Cyber', 'Tech', 'Data', 'Quantum', 'Nano', 'Hyper', 'Meta', 'Cyber', 'Star', 'Void', 'Nova', 'Xeno', 'Astro', 'Cosmo'],
    roots: ['tron', 'nix', 'dex', 'vex', 'cron', 'zon', 'plex', 'flux', 'core', 'grid', 'link', 'wave', 'byte', 'chip', 'node'],
    suffixes: ['7', 'X', 'Prime', 'Alpha', 'Zero', 'One', '9', 'Omega', 'Delta', 'Unit', 'Bot', 'AI', 'Sys', 'Net', 'Lab']
  },
  fantasy: {
    prefixes: ['Eld', 'Thal', 'Mor', 'Sil', 'Val', 'Kael', 'Drak', 'Fae', 'Iron', 'Shadow', 'Storm', 'Blood', 'Star', 'Moon', 'Sun'],
    roots: ['oria', 'heim', 'gard', 'moor', 'wyn', 'dor', 'thal', 'mar', 'nia', 'os', 'ia', 'um', 'ar', 'en', 'is'],
    suffixes: ['the Wise', 'the Bold', 'the Cruel', 'the Ancient', 'the Fallen', 'the Eternal', 'the Dark', 'the Light', 'of Shadows', 'of Flames']
  },
  horror: {
    prefixes: ['Raven', 'Grim', 'Dark', 'Black', 'Crimson', 'Pale', 'Hollow', 'Silent', 'Dread', 'Night', 'Grave', 'Bone', 'Ash', 'Rot', 'Fester'],
    roots: ['wood', 'moor', 'fall', 'wick', 'hollow', 'mire', 'crypt', 'shade', 'veil', 'mourn', 'grief', 'doom', 'fear', 'terror', 'dread'],
    suffixes: ['Asylum', 'Manor', 'Cemetery', 'Catacombs', 'Labyrinth', 'Abyss', 'Void', 'Wastes', 'Ruins', 'Gallows', 'Gates', 'Threshold', 'Veil']
  },
  abstract: {
    prefixes: ['Chroma', 'Prism', 'Echo', 'Flux', 'Nexus', 'Vortex', 'Zenith', 'Apex', 'Origin', 'Core', 'Pulse', 'Resonance', 'Harmony'],
    roots: ['sphere', 'field', 'plane', 'zone', 'realm', 'domain', 'state', 'form', 'flow', 'wave', 'pulse', 'beat', 'rhythm'],
    suffixes: ['Alpha', 'Prime', 'Base', 'Zero', 'One', 'Infinite', 'Eternal', 'Temp', 'Flux', 'State', 'Phase', 'Level']
  }
};

const generateName = (theme: 'sciFi' | 'fantasy' | 'horror' | 'abstract' = 'sciFi'): string => {
  const syl = SYLLABLES[theme];
  const usePrefix = Math.random() > 0.3;
  const useSuffix = Math.random() > 0.5;
  
  let name = '';
  if (usePrefix) {
    name += syl.prefixes[Math.floor(Math.random() * syl.prefixes.length)];
  }
  name += syl.roots[Math.floor(Math.random() * syl.roots.length)];
  if (useSuffix) {
    name += ' ' + syl.suffixes[Math.floor(Math.random() * syl.suffixes.length)];
  }
  
  return name;
};

const getThemeForGenre = (genre: Genre): 'sciFi' | 'fantasy' | 'horror' | 'abstract' => {
  switch (genre) {
    case Genre.FPS:
    case Genre.Racing:
    case Genre.Simulation:
      return 'sciFi';
    case Genre.RPG:
    case Genre.Strategy:
      return 'fantasy';
    case Genre.Horror:
      return 'horror';
    case Genre.Puzzle:
    case Genre.Arcade:
    case Genre.Platformer:
      return 'abstract';
    default:
      return 'sciFi';
  }
};

// ============================================================================
// NARRATIVE GENERATORS
// ============================================================================

const generateWorldLore = (concept: string, genre: Genre): WorldLore => {
  const theme = getThemeForGenre(genre);
  
  const settings: Record<Genre, string> = {
    [Genre.FPS]: 'A war-torn future where megacorporations battle for control of dwindling resources.',
    [Genre.RPG]: 'A realm where ancient magic and emerging technology collide in unexpected ways.',
    [Genre.Racing]: 'A world where anti-gravity racing is the ultimate sport and path to fame.',
    [Genre.Simulation]: 'A carefully constructed digital reality that mirrors our own with disturbing accuracy.',
    [Genre.Puzzle]: 'A dimension where the laws of physics are malleable and reality is a puzzle to be solved.',
    [Genre.Platformer]: 'A vibrant world of floating islands and impossible architecture.',
    [Genre.Arcade]: 'A neon-drenched cyberpunk metropolis where games determine social status.',
    [Genre.Horror]: 'A place where the veil between worlds has grown thin, and nightmares walk freely.',
    [Genre.Strategy]: 'A continent torn apart by warring factions, each with their own vision for the future.'
  };

  return {
    name: generateName(theme),
    setting: settings[genre] || 'A world of mystery and adventure.',
    history: `Once a ${Math.random() > 0.5 ? 'prosperous' : 'peaceful'} realm, ${generateName(theme)} fell into ${Math.random() > 0.5 ? 'chaos' : 'darkness'} when ${concept.toLowerCase()} disrupted the balance.`,
    factions: [
      { name: generateName(theme), description: 'Seekers of order and stability', alignment: 'ally' },
      { name: generateName(theme), description: 'Chaos incarnate', alignment: 'enemy' },
      { name: generateName(theme), description: 'Neutral observers', alignment: 'neutral' }
    ],
    rules: [
      'Energy cannot be created, only transferred',
      'The strong prey on the weak',
      'Knowledge is the true currency',
      'Trust is earned, not given'
    ],
    mysteries: [
      'What caused the Great Collapse?',
      'Who built the ancient structures?',
      'Where did the first beings come from?'
    ]
  };
};

const generateCharacter = (role: 'protagonist' | 'antagonist' | 'supporting', genre: Genre): Character => {
  const theme = getThemeForGenre(genre);
  const personalities = ['Brave', 'Cunning', 'Loyal', 'Mysterious', 'Ruthless', 'Compassionate', 'Ambitious', 'Stoic'];
  
  return {
    name: generateName(theme),
    role: role === 'protagonist' ? 'Hero' : role === 'antagonist' ? 'Villain' : 'Ally',
    backstory: `Born in the ${Math.random() > 0.5 ? 'shadows' : 'light'} of ${generateName(theme)}, they learned early that ${concept => concept.toLowerCase()} would define their destiny.`,
    motivation: role === 'protagonist' ? 'To restore balance and protect the innocent' :
                role === 'antagonist' ? 'To reshape the world according to their vision' :
                'To support the hero in their quest',
    personality: [personalities[Math.floor(Math.random() * personalities.length)], personalities[Math.floor(Math.random() * personalities.length)]],
    appearance: `${Math.random() > 0.5 ? 'Tall' : 'Compact'} figure with ${Math.random() > 0.5 ? 'striking' : 'unremarkable'} features and eyes that betray ${Math.random() > 0.5 ? 'wisdom' : 'secrets'}.`
  };
};

const generateStoryStructure = (concept: string): StoryStructure => ({
  act1: {
    title: 'The Call',
    summary: 'Our hero discovers the truth about their world and the threat that faces it.',
    keyEvents: [
      'The ordinary world is established',
      'A catalyst disrupts the status quo',
      'The hero refuses, then accepts the call'
    ]
  },
  act2: {
    title: 'The Trial',
    summary: 'Trials and tribulations test our hero\'s resolve and forge them into who they must become.',
    keyEvents: [
      'Allies are gained and enemies revealed',
      'The hero faces their greatest fear',
      'A devastating setback occurs'
    ]
  },
  act3: {
    title: 'The Resolution',
    summary: 'The final confrontation determines the fate of everything.',
    keyEvents: [
      'The hero prepares for the final battle',
      'Allies unite against the common threat',
      'Sacrifices are made, victory is won'
    ]
  },
  themes: ['Redemption', 'Sacrifice', 'The cost of power', 'Unity in diversity']
});

const generateQuests = (count: number = 5): Quest[] => {
  const questTypes: Quest['type'][] = ['main', 'main', 'side', 'side', 'optional'];
  const questNames = [
    'The Lost Artifact', 'Echoes of the Past', 'Shadows Rising', 'The Final Stand',
    'Whispers in the Dark', 'Broken Chains', 'Forgotten Memories', 'The Last Hope'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `quest_${i}`,
    name: questNames[Math.floor(Math.random() * questNames.length)],
    type: questTypes[i % questTypes.length],
    description: 'A quest that will test the limits of skill and determination.',
    objectives: [
      'Find the entrance to the forbidden zone',
      'Defeat the guardian',
      'Retrieve the sacred item',
      'Return to the quest giver'
    ],
    rewards: ['Experience points', 'Rare equipment', 'New abilities', 'Story progression']
  }));
};

const generateItemLore = (count: number = 3): ItemLore[] => {
  const itemTypes = ['Weapon', 'Armor', 'Accessory', 'Consumable', 'Key Item'];
  
  return Array.from({ length: count }, (_, i) => ({
    name: generateName('fantasy'),
    type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
    description: 'An item of great power and mysterious origin.',
    backstory: `Forged in the fires of ${generateName('fantasy')} by master craftsmen.`,
    previousOwner: Math.random() > 0.5 ? generateName('fantasy') : undefined,
    powers: ['Enhanced damage', 'Special ability', 'Passive buff'],
    curse: Math.random() > 0.7 ? 'Drains health over time' : undefined
  }));
};

const generateEnemyLore = (count: number = 4): EnemyLore[] => {
  const enemyTypes = ['Minion', 'Elite', 'Boss', 'Legendary'];
  
  return Array.from({ length: count }, (_, i) => ({
    name: generateName('horror'),
    type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
    origin: `Created in the depths of ${generateName('horror')}`,
    behavior: Math.random() > 0.5 ? 'Aggressive and relentless' : 'Cunning and tactical',
    weakness: Math.random() > 0.5 ? 'Elemental damage' : 'Critical hits',
    territory: generateName('abstract')
  }));
};

const generateLocations = (count: number = 5): Location[] => {
  const locationTypes = ['City', 'Dungeon', 'Wilderness', 'Fortress', 'Temple'];
  
  return Array.from({ length: count }, (_, i) => ({
    name: generateName(Math.random() > 0.5 ? 'fantasy' : 'sciFi'),
    type: locationTypes[Math.floor(Math.random() * locationTypes.length)],
    description: 'A place of wonder and danger in equal measure.',
    significance: Math.random() > 0.5 ? 'Key story location' : 'Optional exploration area',
    connectedTo: []
  }));
};

// ============================================================================
// COMPONENT
// ============================================================================

export const NarrativePanel: React.FC<NarrativePanelProps> = ({
  gameConcept,
  genre,
  onNarrativeGenerated
}) => {
  const [narrative, setNarrative] = useState<GeneratedNarrative | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'world' | 'characters' | 'story' | 'lore'>('world');

  const generateNarrative = useCallback(() => {
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const generated: GeneratedNarrative = {
        worldLore: generateWorldLore(gameConcept, genre),
        protagonist: generateCharacter('protagonist', genre),
        antagonist: generateCharacter('antagonist', genre),
        supportingCast: [
          generateCharacter('supporting', genre),
          generateCharacter('supporting', genre)
        ],
        storyStructure: generateStoryStructure(gameConcept),
        quests: generateQuests(),
        itemLore: generateItemLore(),
        enemyLore: generateEnemyLore(),
        locations: generateLocations()
      };
      
      setNarrative(generated);
      onNarrativeGenerated?.(generated);
      setIsGenerating(false);
    }, 1500);
  }, [gameConcept, genre, onNarrativeGenerated]);

  if (!narrative) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className="text-6xl mb-4 block">📖</span>
          <h3 className="text-xl font-bold text-white mb-2">Narrative Generator</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-md">
            Generate rich lore, characters, and story structure for your game concept: 
            <span className="text-indigo-400"> "{gameConcept}"</span>
          </p>
          <button
            onClick={generateNarrative}
            disabled={isGenerating}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <span>✨</span> Generate Narrative
              </>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-zinc-950 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📖</span> {narrative.worldLore.name}
          </h2>
          <p className="text-zinc-500 text-xs">{genre} • Generated Narrative</p>
        </div>
        <button
          onClick={generateNarrative}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
        >
          🔄 Regenerate
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800">
        {[
          { id: 'world', label: 'World', icon: '🌍' },
          { id: 'characters', label: 'Characters', icon: '👥' },
          { id: 'story', label: 'Story', icon: '📜' },
          { id: 'lore', label: 'Lore', icon: '🔮' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* WORLD TAB */}
          {activeTab === 'world' && (
            <motion.div
              key="world"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-2">Setting</h3>
                <p className="text-zinc-300 text-sm">{narrative.worldLore.setting}</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-2">History</h3>
                <p className="text-zinc-300 text-sm">{narrative.worldLore.history}</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-3">Factions</h3>
                <div className="space-y-2">
                  {narrative.worldLore.factions.map((faction, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-zinc-950 rounded-lg">
                      <span className={`text-lg ${
                        faction.alignment === 'ally' ? 'text-green-400' :
                        faction.alignment === 'enemy' ? 'text-red-400' : 'text-zinc-400'
                      }`}>
                        {faction.alignment === 'ally' ? '🤝' : faction.alignment === 'enemy' ? '⚔️' : '⚖️'}
                      </span>
                      <div>
                        <p className="text-zinc-200 font-medium text-sm">{faction.name}</p>
                        <p className="text-zinc-500 text-xs">{faction.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-indigo-400 mb-2">World Rules</h3>
                  <ul className="space-y-1">
                    {narrative.worldLore.rules.map((rule, i) => (
                      <li key={i} className="text-zinc-400 text-xs flex items-start gap-2">
                        <span className="text-indigo-500">•</span> {rule}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-indigo-400 mb-2">Mysteries</h3>
                  <ul className="space-y-1">
                    {narrative.worldLore.mysteries.map((mystery, i) => (
                      <li key={i} className="text-zinc-400 text-xs flex items-start gap-2">
                        <span className="text-amber-500">?</span> {mystery}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* CHARACTERS TAB */}
          {activeTab === 'characters' && (
            <motion.div
              key="characters"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Protagonist */}
              <div className="bg-gradient-to-r from-indigo-900/20 to-zinc-900/50 border border-indigo-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🦸</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{narrative.protagonist.name}</h3>
                    <span className="text-indigo-400 text-xs">Protagonist</span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm mb-3">{narrative.protagonist.backstory}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {narrative.protagonist.personality.map((trait, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                      {trait}
                    </span>
                  ))}
                </div>
                <p className="text-zinc-500 text-xs">{narrative.protagonist.appearance}</p>
              </div>

              {/* Antagonist */}
              <div className="bg-gradient-to-r from-red-900/20 to-zinc-900/50 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🦹</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{narrative.antagonist.name}</h3>
                    <span className="text-red-400 text-xs">Antagonist</span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm mb-3">{narrative.antagonist.backstory}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {narrative.antagonist.personality.map((trait, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded-full">
                      {trait}
                    </span>
                  ))}
                </div>
                <p className="text-zinc-500 text-xs">{narrative.antagonist.appearance}</p>
              </div>

              {/* Supporting Cast */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-zinc-400">Supporting Cast</h3>
                {narrative.supportingCast.map((character, i) => (
                  <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🧙</span>
                      <span className="font-medium text-zinc-200">{character.name}</span>
                      <span className="text-zinc-500 text-xs">• {character.role}</span>
                    </div>
                    <p className="text-zinc-400 text-xs">{character.backstory}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STORY TAB */}
          {activeTab === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Story Acts */}
              {[
                { act: narrative.storyStructure.act1, num: 1, color: 'green' },
                { act: narrative.storyStructure.act2, num: 2, color: 'amber' },
                { act: narrative.storyStructure.act3, num: 3, color: 'red' }
              ].map(({ act, num, color }) => (
                <div key={num} className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 bg-${color}-500/20 text-${color}-400 text-xs font-bold rounded`}>
                      Act {num}
                    </span>
                    <h3 className="font-bold text-white">{act.title}</h3>
                  </div>
                  <p className="text-zinc-400 text-sm mb-3">{act.summary}</p>
                  <div className="space-y-1">
                    {act.keyEvents.map((event, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        {event}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Themes */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-3">Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {narrative.storyStructure.themes.map((theme, i) => (
                    <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quests */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-3">Key Quests</h3>
                <div className="space-y-2">
                  {narrative.quests.slice(0, 3).map(quest => (
                    <div key={quest.id} className="p-2 bg-zinc-950 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 rounded ${
                          quest.type === 'main' ? 'bg-indigo-500/20 text-indigo-400' :
                          quest.type === 'side' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-zinc-700 text-zinc-400'
                        }`}>
                          {quest.type}
                        </span>
                        <span className="text-zinc-200 text-sm font-medium">{quest.name}</span>
                      </div>
                      <p className="text-zinc-500 text-xs">{quest.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* LORE TAB */}
          {activeTab === 'lore' && (
            <motion.div
              key="lore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Items */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-3">Legendary Items</h3>
                <div className="space-y-3">
                  {narrative.itemLore.map((item, i) => (
                    <div key={i} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-zinc-200">{item.name}</span>
                        <span className="text-xs text-zinc-500">{item.type}</span>
                      </div>
                      <p className="text-zinc-400 text-xs mb-2">{item.backstory}</p>
                      {item.curse && (
                        <p className="text-red-400 text-xs">⚠️ Curse: {item.curse}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Enemies */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-3">Enemy Bestiary</h3>
                <div className="grid grid-cols-2 gap-2">
                  {narrative.enemyLore.map((enemy, i) => (
                    <div key={i} className="p-2 bg-zinc-950 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">👹</span>
                        <span className="text-zinc-200 text-sm">{enemy.name}</span>
                      </div>
                      <p className="text-zinc-500 text-xs">{enemy.behavior}</p>
                      <p className="text-red-400 text-xs mt-1">Weakness: {enemy.weakness}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-3">Key Locations</h3>
                <div className="space-y-2">
                  {narrative.locations.map((location, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-zinc-950 rounded-lg">
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="text-zinc-200 text-sm font-medium">{location.name}</p>
                        <p className="text-zinc-500 text-xs">{location.type} • {location.significance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NarrativePanel;
