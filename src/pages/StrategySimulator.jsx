import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Target, Zap, Bot, Play, CheckCircle2, RefreshCw, Sparkles, ShieldCheck, Lightbulb, AlertTriangle, FileSearch, TrendingUp, DollarSign, Brain } from 'lucide-react';
import { STRATEGY_ARCHETYPES } from '@/lib/strategyArchetypes';

export default function StrategySimulator() {
  const [activeStrategy, setActiveStrategy] = useState(1);
  const [vision, setVision] = useState('');
  const [automationMode, setAutomationMode] = useState(true);
  const [autonomyMode, setAutonomyMode] = useState(true);
  const [simulateMode, setSimulateMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const archetype = STRATEGY_ARCHETYPES.find(s => s.id === activeStrategy);

  async function runSimulation() {
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('StrategySimulator', {
        strategyId: activeStrategy,
        vision,
        automationMode,
        autonomyMode,
        simulateMode,
      });
      setResult(res.data || res);
    } catch (e) {
      console.error(e);
    }
    setRunning(false);
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <Target className="w-6 h-6 text-gray-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Strategy Simulator</h1>
          <p className="text-sm text-muted-foreground">10 technologically feasible strategies • Monte Carlo simulation • 500 iterations</p>
        </div>
      </div>

      {/* Vision Statement */}
      <div className="mb-6 bg-card border border-border rounded-lg p-4">
        <label className="block text-sm font-semibold text-foreground mb-2">End Goal / Vision Statement</label>
        <textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          placeholder="Describe your ultimate end goal and vision. What does success look like? What do you want the system to achieve autonomously?"
          className="w-full min-h-[80px] input resize-y"
        />
      </div>

      {/* Mode Toggles */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <ModeToggle icon={Zap} label="Automation Mode" description="System executes tasks automatically" active={automationMode} onClick={() => setAutomationMode(!automationMode)} />
        <ModeToggle icon={Bot} label="Autonomy Mode" description="AI makes strategic decisions independently" active={autonomyMode} onClick={() => setAutonomyMode(!autonomyMode)} />
        <ModeToggle icon={Play} label="Simulate Mode" description="Run 500 probability iterations" active={simulateMode} onClick={() => setSimulateMode(!simulateMode)} />
      </div>

      {/* Strategy Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-semibold text-foreground">Select Strategy</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STRATEGY_ARCHETYPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStrategy(s.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeStrategy === s.id ? 'bg-yellow-400 text-gray-900 border-2 border-yellow-500' : 'bg-card border border-border text-foreground hover:border-yellow-400'
              }`}
            >
              <span className="font-mono text-[10px] opacity-60">#{s.id}</span> {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Strategy Detail */}
      <div className={`mb-6 bg-card rounded-lg p-5 transition-all ${highlightMode ? 'border-4 border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border border-border'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">{archetype.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{archetype.endResult}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Efficiency: {Math.round(archetype.efficiency * 100)}%</span>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">Volatility: {Math.round(archetype.volatility * 100)}%</span>
          </div>
        </div>
        <button onClick={runSimulation} disabled={running} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
          {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Running {simulateMode ? '500' : '200'} iterations...</> : <><Play className="w-4 h-4" /> Run Simulation</>}
        </button>
      </div>

      {/* Simulation Results */}
      {result && (
        <>
          <div className={`mb-6 rounded-lg transition-all ${highlightMode ? 'border-4 border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border border-border'}`}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-card rounded-t-lg">
              <StatBox label="Avg ROI" value={`${result.simulation.avgROI}%`} icon={TrendingUp} color="text-green-600" />
              <StatBox label="Success Rate" value={`${result.simulation.successRate}%`} icon={CheckCircle2} color="text-blue-600" />
              <StatBox label="Avg Revenue" value={`$${(result.simulation.avgRevenue / 1000).toFixed(1)}K`} icon={DollarSign} color="text-yellow-600" />
              <StatBox label="Best Case ROI" value={`${result.simulation.bestCase.roi}%`} icon={Sparkles} color="text-purple-600" />
              <StatBox label="Worst Case ROI" value={`${result.simulation.worstCase.roi}%`} icon={AlertTriangle} color="text-red-600" />
            </div>

            <div className="p-4 bg-card border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">ROI Probability Distribution</h3>
              <div className="space-y-2">
                <ProbBar label="P10 (Worst 10%)" value={result.simulation.p10ROI} color="bg-red-400" />
                <ProbBar label="P25 (Lower Quartile)" value={result.simulation.p25ROI} color="bg-orange-400" />
                <ProbBar label="Median (P50)" value={result.simulation.medianROI} color="bg-yellow-400" />
                <ProbBar label="P75 (Upper Quartile)" value={result.simulation.p75ROI} color="bg-green-400" />
                <ProbBar label="P90 (Best 10%)" value={result.simulation.p90ROI} color="bg-emerald-400" />
              </div>
            </div>

            {result.analysis && (
              <div className="p-4 bg-card border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-foreground">AI Strategic Analysis & Recommendations</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{result.analysis.summary}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <ActionButton icon={CheckCircle2} label="Approve" color="bg-green-500" onClick={() => setActivePanel('approve')} active={activePanel === 'approve'} />
                  <ActionButton icon={RefreshCw} label="Regenerate" color="bg-blue-500" onClick={runSimulation} />
                  <ActionButton icon={Sparkles} label="Highlight & Enhance" color="bg-purple-500" onClick={() => setHighlightMode(!highlightMode)} active={highlightMode} />
                  <ActionButton icon={ShieldCheck} label="Intelligent Validate" color="bg-indigo-500" onClick={() => setActivePanel('validate')} active={activePanel === 'validate'} />
                  <ActionButton icon={Lightbulb} label="Auto Recommend" color="bg-yellow-500" onClick={() => setActivePanel('recommend')} active={activePanel === 'recommend'} />
                  <ActionButton icon={FileSearch} label="QA" color="bg-cyan-500" onClick={() => setActivePanel('qa')} active={activePanel === 'qa'} />
                  <ActionButton icon={AlertTriangle} label="Gaps & Problems" color="bg-red-500" onClick={() => setActivePanel('gaps')} active={activePanel === 'gaps'} />
                </div>

                {activePanel === 'approve' && (
                  <Panel title="Approval" icon={CheckCircle2}>
                    <p className="text-sm text-green-700 mb-2">Strategy approved for execution. The system will now begin autonomous deployment.</p>
                    <p className="text-xs text-muted-foreground">Approved at {new Date().toLocaleString()}</p>
                  </Panel>
                )}
                {activePanel === 'validate' && (
                  <Panel title="Intelligent Validation" icon={ShieldCheck}>
                    {result.analysis.qaNotes?.map((note, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">{note}</span>
                      </div>
                    ))}
                  </Panel>
                )}
                {activePanel === 'recommend' && (
                  <Panel title="Auto Recommendations" icon={Lightbulb}>
                    {result.analysis.autoRecommendations?.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">{rec}</span>
                      </div>
                    ))}
                  </Panel>
                )}
                {activePanel === 'qa' && (
                  <Panel title="QA Notes" icon={FileSearch}>
                    {result.analysis.qaNotes?.map((note, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <FileSearch className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">{note}</span>
                      </div>
                    ))}
                  </Panel>
                )}
                {activePanel === 'gaps' && (
                  <Panel title="Gaps & Problems" icon={AlertTriangle}>
                    {result.analysis.gaps?.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">{gap}</span>
                      </div>
                    ))}
                  </Panel>
                )}

                {result.analysis.enhancedStrategy && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">Enhanced Strategy</span>
                    </div>
                    <p className="text-sm text-purple-800">{result.analysis.enhancedStrategy}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="text-xs font-semibold text-red-700 mb-2">Key Risks</h4>
                    {result.analysis.keyRisks?.map((risk, i) => (
                      <div key={i} className="text-xs text-red-600 mb-1 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {risk}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-green-700 mb-2">Key Opportunities</h4>
                    {result.analysis.keyOpportunities?.map((opp, i) => (
                      <div key={i} className="text-xs text-green-600 mb-1 flex items-start gap-1">
                        <TrendingUp className="w-3 h-3 mt-0.5 shrink-0" /> {opp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Summary */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg p-5">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-600" /> Estimated Results & ROI Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Estimated Revenue (36mo)</div>
                <div className="text-2xl font-bold text-green-600">${(result.simulation.avgRevenue / 1000).toFixed(0)}K</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Estimated ROI</div>
                <div className="text-2xl font-bold text-yellow-600">{result.simulation.avgROI}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Best Case Revenue</div>
                <div className="text-2xl font-bold text-purple-600">${(result.simulation.bestCase.totalRevenue / 1000).toFixed(0)}K</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Success Probability</div>
                <div className="text-2xl font-bold text-blue-600">{result.simulation.successRate}%</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ModeToggle({ icon: Icon, label, description, active, onClick }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-lg border-2 transition-all text-left ${active ? 'border-yellow-400 bg-yellow-50' : 'border-border bg-card hover:border-yellow-300'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${active ? 'text-yellow-600' : 'text-muted-foreground'}`} />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {active && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">ON</span>}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function StatBox({ label, value, icon: Icon, color }) {
  return (
    <div className="text-center">
      <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function ProbBar({ label, value, color }) {
  const width = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-40 shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${width}%` }} />
        <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-foreground">{value}%</span>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick, active }) {
  return (
    <button onClick={onClick} className={`${color} hover:opacity-90 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${active ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}