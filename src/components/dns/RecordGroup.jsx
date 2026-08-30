import React from 'react';
import Panel from '@/components/kit/Panel';
import RecordRow from './RecordRow';

export default function RecordGroup({ group }) {
  return (
    <Panel title={group.group} subtitle={`${group.records.length} record${group.records.length === 1 ? '' : 's'}`}>
      <div className="divide-y-0">
        {group.records.map((r, i) => (
          <RecordRow key={`${r.type}-${r.name}-${i}`} record={r} />
        ))}
      </div>
    </Panel>
  );
}