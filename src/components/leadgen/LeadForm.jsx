import React, { useState } from 'react';
import { CheckCircle2, Loader2, Phone } from 'lucide-react';

export default function LeadForm({ city, state, services = [], compact = false }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service_category: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/functions/CaptureLead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          city: city || '',
          state: state || '',
          source_domain: window.location.hostname,
          source_route: window.location.pathname,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className={`bg-white border-2 border-yellow-400 rounded-xl p-6 text-center ${compact ? 'shadow-lg' : 'shadow-xl'}`}>
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Request Received!</h3>
        <p className="text-sm text-gray-600">
          We're matching you with top-rated local pros in {city}, {state}. You'll receive your first quote within 24 hours.
        </p>
        <button
          onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', service_category: '', message: '' }); }}
          className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-white border-2 border-yellow-400 rounded-xl ${compact ? 'p-4 shadow-lg' : 'p-6 shadow-xl'}`}>
      <div className="text-center mb-4">
        <h3 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>Get Free Quotes Today</h3>
        <p className="text-sm text-gray-500 mt-1">No obligation • Up to 3 local pros • Fast response</p>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Your Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <input
          type="email"
          placeholder="Email Address *"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <select
          value={form.service_category}
          onChange={(e) => setForm({ ...form, service_category: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
        >
          <option value="">Select Service Needed</option>
          {services.map((s) => (
            <option key={s.slug} value={s.name}>{s.name}</option>
          ))}
        </select>
        <textarea
          placeholder="Briefly describe your project..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
          ) : (
            <><Phone className="w-5 h-5" /> Get My Free Quotes</>
          )}
        </button>
        {status === 'error' && (
          <p className="text-sm text-red-600 text-center">{errorMsg}</p>
        )}
        <p className="text-xs text-gray-400 text-center">
          By submitting, you agree to be contacted by local service providers. We respect your privacy.
        </p>
      </div>
    </form>
  );
}