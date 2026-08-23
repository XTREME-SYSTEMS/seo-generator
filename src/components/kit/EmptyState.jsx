import React from 'react';

export default function EmptyState({ title = 'No records', description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-6 w-6 text-muted-foreground" />}
      <p className="font-heading text-sm text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}