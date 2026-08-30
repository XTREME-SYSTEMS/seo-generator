import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Panel from '@/components/kit/Panel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';

export default function RegisterUrlsPanel({ onRegistered }) {
  const [sites, setSites] = useState([]);
  const [property, setProperty] = useState('');
  const [urls, setUrls] = useState('');
  const [queries, setQueries] = useState('');
  const [loadingSites, setLoadingSites] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('SyncSearchConsole', { action: 'list_sites' });
        setSites(res.data?.sites || []);
      } catch (e) {
        setMsg(e.response?.data?.error || e.message);
      }
      setLoadingSites(false);
    })();
  }, []);

  const register = async () => {
    const urlList = urls.split('\n').map((u) => u.trim()).filter(Boolean);
    if (!property || urlList.length === 0) { setMsg('Pick a property and paste at least one URL.'); return; }
    setSaving(true); setMsg('');
    try {
      const res = await base44.functions.invoke('SyncSearchConsole', {
        action: 'register_urls',
        gsc_property: property,
        urls: urlList,
        target_queries: queries.split(',').map((q) => q.trim()).filter(Boolean)
      });
      setMsg(`Registered ${res.data.registered}, skipped ${res.data.skipped_existing} already known.`);
      setUrls('');
      onRegistered?.();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message);
    }
    setSaving(false);
  };

  return (
    <Panel title="Register URLs" subtitle="Bind URLs to a verified Search Console property">
      <div className="space-y-3">
        {loadingSites ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your Search Console properties
          </div>
        ) : (
          <Select value={property} onValueChange={setProperty}>
            <SelectTrigger><SelectValue placeholder="Search Console property" /></SelectTrigger>
            <SelectContent>
              {sites.map((s) => <SelectItem key={s.url} value={s.url}>{s.url}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Textarea
          rows={5}
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={'One URL per line\nhttps://example.com/service-page'}
          className="font-mono text-xs"
        />
        <Input value={queries} onChange={(e) => setQueries(e.target.value)} placeholder="Target queries, comma separated (optional)" />
        <Button onClick={register} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Register URLs
        </Button>
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      </div>
    </Panel>
  );
}