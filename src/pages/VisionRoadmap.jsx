import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Calendar, Clock, Map, CheckSquare, Mail, FileText, Database, GitBranch, Rocket, Train, MessageSquare, Globe, Cpu, Network, Bot, Layers, ChevronDown, ChevronRight, Zap } from 'lucide-react';

const INTEGRATION_ICONS = {
  'Google Calendar': Calendar,
  'Gmail': Mail,
  'Google Drive': FileText,
  'Google Tasks': CheckSquare,
  'Google Contacts': Mail,
  'Google Sheets': Layers,
  'Supabase': Database,
  'GitHub': GitBranch,
  'Vercel': Rocket,
  'Railway': Train,
  'Xtreme Communications': MessageSquare,
  'GoDaddy': Globe,
  'Groq': Cpu,
  'MCP (GPT/Claude/Gemini)': Network,
};

export default function VisionRoadmap() {
  const [platform, setPlatform] = useState('google'); // 'google' or 'microsoft'
  const [vision, setVision] = useState('');
  const [strategyName, setStrategyName] = useState('Full-Stack Autonomy Platform');
  const [timeHorizon, setTimeHorizon] = useState(3);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  async function generateRoadmap() {
    setLoading(true);
    setRoadmap(null);
    try {
      const res = await base44.functions.invoke('VisionRoadmapGenerator', {
        vision,
        strategyName,
        platform,
        timeHorizonYears: timeHorizon,
      });
      setRoadmap((res.data || res).roadmap);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <Map className="w-6 h-6 text-gray-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vision Roadmap</h1>
          <p className="text-sm text-muted-foreground">Hour-by-hour • Day-by-day • Month-by-month • Year-by-year execution plan</p>
        </div>
      </div>

      {/* Platform Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setPlatform('google')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${platform === 'google' ? 'bg-yellow-400 text-gray-900' : 'bg-card text-foreground'}`}
          >
            <Globe className="w-4 h-4" /> Google
          </button>
          <button
            onClick={() => setPlatform('microsoft')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${platform === 'microsoft' ? 'bg-yellow-400 text-gray-900' : 'bg-card text-foreground'}`}
          >
            <Layers className="w-4 h-4" /> Microsoft
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-foreground mb-1">Your Vision / End Goal</label>
          <textarea value={vision} onChange={(e) => setVision(e.target.value)} placeholder="Describe your ultimate vision and end goal..." className="input min-h-[60px] resize-y" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Strategy Name</label>
          <input value={strategyName} onChange={(e) => setStrategyName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Time Horizon (Years)</label>
          <input type="number" value={timeHorizon} onChange={(e) => setTimeHorizon(parseInt(e.target.value) || 3)} min="1" max="10" className="input" />
        </div>
        <div className="flex items-end">
          <button onClick={generateRoadmap} disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Generating Roadmap...' : 'Generate Roadmap'}
          </button>
        </div>
      </div>

      {/* Roadmap Display */}
      {roadmap && (
        <div className="space-y-6">
          {/* Title */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-4">
            <h2 className="text-xl font-bold text-foreground">{roadmap.roadmapTitle}</h2>
          </div>

          {/* Milestones (Year by Year) */}
          {roadmap.milestones && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-600" /> Milestones — Year by Year
              </h3>
              <div className="space-y-3">
                {roadmap.milestones.map((m, i) => (
                  <div key={i} className="border-l-4 border-yellow-400 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold">Year {m.year}</span>
                      <span className="text-sm font-semibold text-foreground">{m.phase}</span>
                      <span className="text-xs text-muted-foreground">({m.months})</span>
                      {m.revenueTarget && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 ml-auto">{m.revenueTarget}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{m.goal}</p>
                    {m.keyDeliverables && (
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold text-muted-foreground">DELIVERABLES:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.keyDeliverables.map((d, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground">{d}</span>)}
                        </div>
                      </div>
                    )}
                    {m.integrations && (
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold text-muted-foreground">INTEGRATIONS:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.integrations.map((int, j) => {
                            const Icon = INTEGRATION_ICONS[int] || Globe;
                            return <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 flex items-center gap-1"><Icon className="w-2.5 h-2.5" />{int}</span>;
                          })}
                        </div>
                      </div>
                    )}
                    {m.agents && (
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold text-muted-foreground">AGENTS:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.agents.map((a, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 flex items-center gap-1"><Bot className="w-2.5 h-2.5" />{a}</span>)}
                        </div>
                      </div>
                    )}
                    {m.automations && (
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground">AUTOMATIONS:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.automations.map((a, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 flex items-center gap-1"><Zap className="w-2.5 h-2.5" />{a}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Plan (Google Sheets-style top-down) */}
          {roadmap.monthlyPlan && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-600" /> Monthly Execution Plan — Top-Down Workflow
              </h3>
              <div className="space-y-1">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-1 px-2 py-1 bg-muted/50 rounded text-[10px] font-bold text-muted-foreground uppercase">
                  <div className="col-span-1">Month</div>
                  <div className="col-span-2">Theme</div>
                  <div className="col-span-2">Revenue Target</div>
                  <div className="col-span-5">Key Outcomes</div>
                  <div className="col-span-2 text-center">Expand</div>
                </div>
                {roadmap.monthlyPlan.map((month, i) => (
                  <div key={i}>
                    <div
                      className="grid grid-cols-12 gap-1 px-2 py-1.5 rounded text-xs hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/50"
                      onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
                    >
                      <div className="col-span-1 font-mono font-bold text-yellow-600">M{month.month}</div>
                      <div className="col-span-2 text-foreground font-medium truncate">{month.theme}</div>
                      <div className="col-span-2 text-green-600 font-semibold">{month.revenueTarget}</div>
                      <div className="col-span-5 text-muted-foreground truncate">{Array.isArray(month.keyOutcomes) ? month.keyOutcomes.join(', ') : ''}</div>
                      <div className="col-span-2 flex justify-center">
                        {expandedMonth === i ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {/* Expanded weeks */}
                    {expandedMonth === i && month.weeks && (
                      <div className="ml-4 border-l-2 border-yellow-300 pl-3 my-1 space-y-1">
                        {month.weeks.map((week, j) => (
                          <div key={j}>
                            <div
                              className="grid grid-cols-12 gap-1 px-2 py-1 rounded text-xs hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={(e) => { e.stopPropagation(); setExpandedWeek(expandedWeek === `${i}-${j}` ? null : `${i}-${j}`); }}
                            >
                              <div className="col-span-1 font-mono text-blue-600">W{week.week}</div>
                              <div className="col-span-11 text-muted-foreground">Click to expand daily schedule</div>
                            </div>
                            {expandedWeek === `${i}-${j}` && week.days && (
                              <div className="ml-4 border-l-2 border-blue-300 pl-3 space-y-1">
                                {week.days.map((day, k) => (
                                  <div key={k}>
                                    <div
                                      className="grid grid-cols-12 gap-1 px-2 py-1 rounded text-xs hover:bg-muted/30 cursor-pointer transition-colors"
                                      onClick={(e) => { e.stopPropagation(); setExpandedDay(expandedDay === `${i}-${j}-${k}` ? null : `${i}-${j}-${k}`); }}
                                    >
                                      <div className="col-span-1 font-mono text-green-600">D{day.day}</div>
                                      <div className="col-span-11 text-muted-foreground">{day.hours?.length || 0} scheduled tasks</div>
                                    </div>
                                    {expandedDay === `${i}-${j}-${k}` && day.hours && (
                                      <div className="ml-4 border-l-2 border-green-300 pl-3 space-y-1">
                                        {day.hours.map((h, hIdx) => {
                                          const Icon = INTEGRATION_ICONS[h.integration] || Clock;
                                          return (
                                            <div key={hIdx} className="flex items-start gap-2 px-2 py-1.5 rounded bg-muted/20 text-xs">
                                              <span className="font-mono font-bold text-yellow-600 shrink-0 w-8">{h.hour}:00</span>
                                              <span className="text-foreground flex-1">{h.task}</span>
                                              <span className="text-purple-600 flex items-center gap-1 shrink-0"><Bot className="w-3 h-3" />{h.agent}</span>
                                              <span className="text-blue-600 flex items-center gap-1 shrink-0"><Icon className="w-3 h-3" />{h.integration}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations Grid */}
          {roadmap.integrations && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Network className="w-4 h-4 text-yellow-600" /> Integration Stack — {roadmap.integrations.length} Connected Systems
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {roadmap.integrations.map((int, i) => {
                  const Icon = INTEGRATION_ICONS[int.name] || Globe;
                  return (
                    <div key={i} className="p-3 border border-border rounded-lg hover:border-yellow-400 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-yellow-600" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{int.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{int.category}</div>
                      <div className="text-[10px] text-blue-600 mt-1">{int.syncFrequency}</div>
                      <div className="text-xs text-muted-foreground mt-1">{int.purpose}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agents */}
          {roadmap.agents && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-yellow-600" /> Agent Team — {roadmap.agents.length} AI Agents
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {roadmap.agents.map((agent, i) => (
                  <div key={i} className="p-3 border border-border rounded-lg bg-purple-50/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-foreground">{agent.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{agent.role}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{agent.schedule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projected Outcome */}
          {roadmap.projectedOutcome && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-600" /> Projected Outcome
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Final Revenue</div>
                  <div className="text-lg font-bold text-green-600">{roadmap.projectedOutcome.finalRevenue}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Automation Level</div>
                  <div className="text-lg font-bold text-yellow-600">{roadmap.projectedOutcome.automationLevel}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Time to Goal</div>
                  <div className="text-lg font-bold text-blue-600">{roadmap.projectedOutcome.timeToGoal}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Key Achievement</div>
                  <div className="text-sm font-bold text-purple-600">{roadmap.projectedOutcome.keyAchievement}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}