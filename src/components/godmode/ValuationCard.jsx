import React from 'react';
import { DollarSign, TrendingUp, Award, Building } from 'lucide-react';

export default function ValuationCard({ valuation }) {
  if (!valuation) return null;

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-400 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-6 h-6 text-yellow-500" />
        <h3 className="font-bold text-lg text-foreground">GoDaddy-Style Domain Valuation</h3>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estimated Website Value</p>
        <p className="text-5xl font-bold text-yellow-600">
          ${valuation.estimated_value >= 1000000
            ? `${(valuation.estimated_value / 1000000).toFixed(1)}M`
            : valuation.estimated_value.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mt-2">{valuation.godaddy_comparison}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-muted-foreground">Annual Revenue</span>
          </div>
          <p className="text-lg font-bold text-foreground">${(valuation.annual_revenue / 1000000).toFixed(2)}M</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-muted-foreground">Monthly Revenue</span>
          </div>
          <p className="text-lg font-bold text-foreground">${(valuation.monthly_revenue / 1000).toFixed(0)}K</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-xs text-foreground">Valuation Method: <strong>{valuation.multiplier}</strong></span>
        </div>
        {valuation.premiums?.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500 shrink-0" />
            <span className="text-xs text-foreground">{p.factor}: <strong>{p.multiplier}x</strong></span>
          </div>
        ))}
      </div>

      {valuation.comparable_sales && valuation.comparable_sales.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Comparable Market Sales:</span>
          </div>
          <div className="space-y-1">
            {valuation.comparable_sales.map((sale, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{sale.site}</span>
                <span className="font-bold text-foreground">${(sale.sale_price / 1000000).toFixed(1)}M ({sale.date})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}