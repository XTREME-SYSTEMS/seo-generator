import React from 'react';

export default function Loading({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-xs text-muted-foreground">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-primary" />
      {label}
    </div>
  );
}