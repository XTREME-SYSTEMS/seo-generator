import React from 'react';
import { Crown, TrendingUp, Target, Award } from 'lucide-react';

export default function WinnerBanner({ winner, runnerUp, totalSimulations }) {
  if (!winner) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 via-white to-yellow-50 p-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl" />
      <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-gray-900 font-bold uppercase tracking-wide">Winner</span>
            <span className="text-xs text-muted-foreground">{totalSimulations?.toLocaleString()} simulations run</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">{winner.strategy_name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{winner.end_result}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 lg:gap-6">
          <Metric icon={Target} label="Median ROI" value={`${winner.median_roi?.toLocaleString()}%`} color="text-yellow-600" />
          <Metric icon={TrendingUp} label="Success Rate" value={`${winner.success_rate}%`} color="text-green-600" />
          <Metric icon={Award} label="P90 ROI" value={`${winner.p90_roi?.toLocaleString()}%`} color="text-blue-600" />
        </div>
      </div>
      {runnerUp && (
        <div className="relative mt-4 pt-4 border-t border-yellow-200 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Runner-up:</span>
          <span className="font-semibold text-foreground">{runnerUp.strategy_name}</span>
          <span className="text-muted-foreground">({runnerUp.median_roi?.toLocaleString()}% median ROI)</span>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}