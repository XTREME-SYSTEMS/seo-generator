import React, { useState } from 'react';
import { Mail, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setStatus('loading');
    try {
      await fetch('/functions/CaptureLead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          service_category: 'General Inquiry',
          source_domain: window.location.hostname,
          source_route: window.location.pathname,
        }),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground mb-6">
          Contact Us
        </h1>
        <p className="text-base text-muted-foreground mb-8">
          Have questions about Xtreme SEO Optimizer? We're here to help. Reach out using the form below or contact us directly.
        </p>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFD700]/10">
                <Mail className="h-5 w-5 text-[#B8860B]" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <a href="mailto:support@xtremeseooptimizer.com" className="text-sm text-muted-foreground hover:text-[#B8860B]">support@xtremeseooptimizer.com</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFD700]/10">
                <Phone className="h-5 w-5 text-[#B8860B]" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Phone</p>
                <p className="text-sm text-muted-foreground">1-800-555-0000</p>
              </div>
            </div>
          </div>
          <div>
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-[#FFD700] bg-[#FFD700]/5 p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                <p className="font-medium text-foreground">Thank you for reaching out!</p>
                <p className="text-sm text-muted-foreground mt-1">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} />
                </div>
                <Button type="submit" disabled={status === 'loading'} className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold">
                  {status === 'loading' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : 'Send Message'}
                </Button>
                {status === 'error' && <p className="text-sm text-red-600 text-center">Something went wrong. Please try again.</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}