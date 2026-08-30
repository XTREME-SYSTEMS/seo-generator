import React from 'react';
import { Input } from '@/components/ui/input';

const PAGE_TYPES = ['home','pillar','cluster','service','location','product','category','blog_resource','faq','about_trust','conversion','legal','other'];
const FUNNELS = ['tofu','mofu','bofu','retention'];

function Sel({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input h-9 w-auto min-w-[130px]">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
    </select>
  );
}

export default function WorkbookFilters({ filters, setFilters, domains }) {
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search URL or query…"
        value={filters.q}
        onChange={(e) => set('q')(e.target.value)}
        className="h-9 w-full sm:w-64"
      />
      <Sel value={filters.domain} onChange={set('domain')} options={domains} placeholder="All domains" />
      <Sel value={filters.page_type} onChange={set('page_type')} options={PAGE_TYPES} placeholder="All page types" />
      <Sel value={filters.funnel_stage} onChange={set('funnel_stage')} options={FUNNELS} placeholder="All funnel stages" />
    </div>
  );
}