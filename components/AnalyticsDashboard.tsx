import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TokenTransaction } from '../types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnalyticsDashboardProps {
  tokenHistory: TokenTransaction[];
  generationHistory?: GenerationRecord[];
}

interface GenerationRecord {
  id: string;
  timestamp: number;
  genre: string;
  template: string;
  difficulty: string;
  success: boolean;
  generationTime: number;
  qualityScore: number;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

// ============================================================================
// COLORS & THEME
// ============================================================================

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  chart: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#14b8a6']
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  return (ms / 60000).toFixed(1) + 'm';
};

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockGenerations = (): GenerationRecord[] => {
  const genres = ['FPS', 'RPG', 'Platformer', 'Arcade', 'Puzzle', 'Strategy', 'Horror'];
  const templates = ['3D Shooter', 'Physics Lab', '2D Arcade', 'Rogue-like', 'Racing'];
  const difficulties = ['Easy', 'Normal', 'Hard', 'Expert'];
  
  const records: GenerationRecord[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 50; i++) {
    records.push({
      id: `gen_${i}`,
      timestamp: now - Math.random() * 30 * 24 * 60 * 60 * 1000,
      genre: genres[Math.floor(Math.random() * genres.length)],
      template: templates[Math.floor(Math.random() * templates.length)],
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      success: Math.random() > 0.1,
      generationTime: 5000 + Math.random() * 25000,
      qualityScore: 60 + Math.random() * 40
    });
  }
  
  return records.sort((a, b) => b.timestamp - a.timestamp);
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  tokenHistory,
  generationHistory = generateMockGenerations()
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'generations' | 'quality'>('overview');

  // Filter data by time range
  const filteredData = useMemo(() => {
    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      all: Infinity
    };
    
    const cutoff = now - ranges[timeRange];
    return {
      tokens: tokenHistory.filter(t => t.timestamp > cutoff),
      generations: generationHistory.filter(g => g.timestamp > cutoff)
    };
  }, [tokenHistory, generationHistory, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const { tokens, generations } = filteredData;
    
    const totalTokens = tokens.reduce((sum, t) => sum + t.totalTokens, 0);
    const totalGames = generations.length;
    const successfulGames = generations.filter(g => g.success).length;
    const successRate = totalGames > 0 ? (successfulGames / totalGames) * 100 : 0;
    const avgGenTime = totalGames > 0 
      ? generations.reduce((sum, g) => sum + g.generationTime, 0) / totalGames 
      : 0;
    const avgQuality = totalGames > 0
      ? generations.reduce((sum, g) => sum + g.qualityScore, 0) / totalGames
      : 0;
    
    return {
      totalTokens,
      totalGames,
      successRate,
      avgGenTime,
      avgQuality
    };
  }, [filteredData]);

  // Prepare chart data
  const tokenChartData = useMemo(() => {
    const grouped = new Map<string, number>();
    
    filteredData.tokens.forEach(t => {
      const date = formatDate(t.timestamp);
      grouped.set(date, (grouped.get(date) || 0) + t.totalTokens);
    });
    
    return Array.from(grouped.entries())
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData.tokens]);

  const genreDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    
    filteredData.generations.forEach(g => {
      counts.set(g.genre, (counts.get(g.genre) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData.generations]);

  const difficultyDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    
    filteredData.generations.forEach(g => {
      counts.set(g.difficulty, (counts.get(g.difficulty) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }));
  }, [filteredData.generations]);

  const successRateData = useMemo(() => [
    { name: 'Success', value: stats.successRate, color: COLORS.success },
    { name: 'Failed', value: 100 - stats.successRate, color: COLORS.danger }
  ], [stats.successRate]);

  const qualityTrendData = useMemo(() => {
    const grouped = new Map<string, number[]>();
    
    filteredData.generations.forEach(g => {
      const date = formatDate(g.timestamp);
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date)!.push(g.qualityScore);
    });
    
    return Array.from(grouped.entries())
      .map(([date, scores]) => ({
        date,
        quality: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData.generations]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-zinc-600 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-zinc-800 ${color}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full bg-zinc-950 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📊</span> Analytics Dashboard
          </h2>
          <p className="text-zinc-500 text-xs">Track your generation metrics and performance</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-zinc-900 rounded-lg p-1">
          {(['today', 'week', 'month', 'all'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800">
        {[
          { id: 'overview', label: 'Overview', icon: '📈' },
          { id: 'tokens', label: 'Token Usage', icon: '🪙' },
          { id: 'generations', label: 'Generations', icon: '🎮' },
          { id: 'quality', label: 'Quality', icon: '✨' }
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
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Games"
                value={stats.totalGames}
                subtitle="Generated games"
                icon="🎮"
                color="text-indigo-400"
              />
              <StatCard
                title="Tokens Used"
                value={formatNumber(stats.totalTokens)}
                subtitle="Total consumption"
                icon="🪙"
                color="text-amber-400"
              />
              <StatCard
                title="Success Rate"
                value={`${stats.successRate.toFixed(1)}%`}
                subtitle={`${Math.round(stats.successRate * stats.totalGames / 100)} successful`}
                icon="✅"
                color="text-green-400"
              />
              <StatCard
                title="Avg Gen Time"
                value={formatDuration(stats.avgGenTime)}
                subtitle="Per game"
                icon="⏱️"
                color="text-blue-400"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Token Usage Chart */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-zinc-300 mb-4">Token Usage Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={tokenChartData}>
                    <defs>
                      <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} tickFormatter={formatNumber} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tokens"
                      stroke={COLORS.primary}
                      fillOpacity={1}
                      fill="url(#tokenGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Genre Distribution */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-zinc-300 mb-4">Genre Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={genreDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                    <Legend fontSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TOKENS TAB */}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-zinc-300 mb-4">Token Usage Details</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tokenChartData}>
                  <defs>
                    <linearGradient id="tokenGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={12} />
                  <YAxis stroke="#52525b" fontSize={12} tickFormatter={formatNumber} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke={COLORS.primary}
                    fillOpacity={1}
                    fill="url(#tokenGradient2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Token Usage by Action */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-zinc-300 mb-4">Usage by Action</h3>
              <div className="space-y-2">
                {['Generate Blueprint', 'Build Prototype', 'Refine Code', 'Generate Audio'].map((action, i) => {
                  const count = filteredData.tokens.filter(t => t.action === action).length;
                  const tokens = filteredData.tokens
                    .filter(t => t.action === action)
                    .reduce((sum, t) => sum + t.totalTokens, 0);
                  const percentage = stats.totalTokens > 0 ? (tokens / stats.totalTokens) * 100 : 0;
                  
                  return (
                    <div key={action} className="flex items-center gap-4">
                      <div className="w-32 text-xs text-zinc-400">{action}</div>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS.chart[i % COLORS.chart.length]
                          }}
                        />
                      </div>
                      <div className="w-20 text-right text-xs text-zinc-500">
                        {formatNumber(tokens)} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* GENERATIONS TAB */}
        {activeTab === 'generations' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Success Rate */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-zinc-300 mb-4">Success Rate</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={successRateData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {successRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Difficulty Distribution */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-zinc-300 mb-4">Difficulty Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={difficultyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                    <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Generations Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <h3 className="text-sm font-bold text-zinc-300 p-4 border-b border-zinc-800">Recent Generations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-900">
                    <tr>
                      <th className="text-left p-3 text-zinc-500 font-medium">Date</th>
                      <th className="text-left p-3 text-zinc-500 font-medium">Genre</th>
                      <th className="text-left p-3 text-zinc-500 font-medium">Template</th>
                      <th className="text-left p-3 text-zinc-500 font-medium">Difficulty</th>
                      <th className="text-left p-3 text-zinc-500 font-medium">Time</th>
                      <th className="text-left p-3 text-zinc-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.generations.slice(0, 10).map(gen => (
                      <tr key={gen.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                        <td className="p-3 text-zinc-400">{formatDate(gen.timestamp)}</td>
                        <td className="p-3 text-zinc-300">{gen.genre}</td>
                        <td className="p-3 text-zinc-300">{gen.template}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            gen.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                            gen.difficulty === 'Normal' ? 'bg-blue-500/20 text-blue-400' :
                            gen.difficulty === 'Hard' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {gen.difficulty}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">{formatDuration(gen.generationTime)}</td>
                        <td className="p-3">
                          {gen.success ? (
                            <span className="text-green-400">✓ Success</span>
                          ) : (
                            <span className="text-red-400">✗ Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* QUALITY TAB */}
        {activeTab === 'quality' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-zinc-300 mb-4">Quality Score Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={qualityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#52525b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke={COLORS.secondary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.secondary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Quality Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{stats.avgQuality.toFixed(1)}</p>
                <p className="text-zinc-500 text-xs mt-1">Average Quality</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-indigo-400">
                  {Math.max(...filteredData.generations.map(g => g.qualityScore), 0).toFixed(1)}
                </p>
                <p className="text-zinc-500 text-xs mt-1">Best Score</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-amber-400">
                  {filteredData.generations.filter(g => g.qualityScore >= 80).length}
                </p>
                <p className="text-zinc-500 text-xs mt-1">High Quality (80+)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
        <button
          onClick={() => {
            const data = {
              tokens: filteredData.tokens,
              generations: filteredData.generations,
              stats,
              exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics_export_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={() => {
            const csv = [
              'Date,Genre,Template,Difficulty,Success,GenTime,Quality',
              ...filteredData.generations.map(g => 
                `${formatDate(g.timestamp)},${g.genre},${g.template},${g.difficulty},${g.success},${g.generationTime},${g.qualityScore}`
              )
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `generations_export_${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
