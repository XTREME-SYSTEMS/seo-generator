import React, { useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, X, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Global AI Assist overlay.
 * Scans the document for all text inputs & textareas and injects a small
 * "AI Assist" sparkle button at the top-right corner of each one.
 * Clicking opens a tiny popover where the user describes what they want;
 * the LLM generates content and fills the field (works with React controlled inputs).
 */

const SKIP_TYPES = new Set(['hidden', 'password', 'submit', 'button', 'reset', 'image', 'file', 'checkbox', 'radio', 'range', 'color', 'date', 'datetime-local', 'month', 'time', 'week', 'number']);
const ATTR = 'data-ai-assist-attached';

function getFieldContext(el) {
  const clues = [];
  if (el.placeholder) clues.push(`placeholder: ${el.placeholder}`);
  if (el.getAttribute('aria-label')) clues.push(`label: ${el.getAttribute('aria-label')}`);
  if (el.name) clues.push(`name: ${el.name}`);
  if (el.id) {
    const lbl = document.querySelector(`label[for="${el.id}"]`);
    if (lbl && lbl.textContent) clues.push(`label: ${lbl.textContent.trim()}`);
  }
  // nearest preceding label text
  let p = el;
  for (let i = 0; i < 5 && p; i++) {
    p = p.previousElementSibling;
    if (p && p.tagName === 'LABEL' && p.textContent) { clues.push(`label: ${p.textContent.trim()}`); break; }
  }
  // surrounding heading
  const card = el.closest('div, section, fieldset, form');
  if (card) {
    const h = card.querySelector('h1,h2,h3,h4,label');
    if (h && h.textContent && !clues.some(c => c.includes(h.textContent.trim()))) clues.push(`section: ${h.textContent.trim().slice(0, 80)}`);
  }
  if (el.value) clues.push(`current value: ${el.value.slice(0, 200)}`);
  return clues.join(' | ');
}

function setNativeValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export default function AiAssistOverlay() {
  const popoverRef = useRef(null); // { overlay, input, ctxInput, btn }
  const rafRef = useRef(0);

  const repositionAll = useCallback(() => {
    if (popoverRef.current) positionPopover(popoverRef.current);
    const buttons = document.querySelectorAll(`button[${ATTR}-btn]`);
    for (const btn of buttons) {
      const input = btn._aiInput;
      if (!input || !document.body.contains(input)) { btn.remove(); continue; }
      positionButton(btn, input);
    }
  }, []);

  const closePopover = useCallback(() => {
    if (popoverRef.current) {
      popoverRef.current.overlay.remove();
      popoverRef.current = null;
    }
  }, []);

  const positionButton = (btn, input) => {
    const container = input.offsetParent || document.body;
    if (btn.offsetParent !== container) {
      (container === document.body ? document.body : container).appendChild(btn);
      const cs = getComputedStyle(container);
      if (cs.position === 'static') container.style.position = 'relative';
    }
    const ir = input.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const size = 22;
    btn.style.left = `${ir.right - cr.left - size - 4}px`;
    btn.style.top = `${ir.top - cr.top + Math.max(2, (ir.height - size) / 2)}px`;
  };

  const positionPopover = (p) => {
    const ir = p.input.getBoundingClientRect();
    const o = p.overlay;
    o.style.left = `${ir.left}px`;
    o.style.top = `${ir.bottom + 6}px`;
    o.style.minWidth = `${Math.max(280, ir.width)}px`;
    o.style.maxWidth = `${Math.min(420, ir.width + 120)}px`;
  };

  const openPopover = useCallback((input) => {
    closePopover();
    const overlay = document.createElement('div');
    overlay.setAttribute('data-ai-assist-popover', '');
    overlay.style.cssText = 'position:fixed;z-index:99998;';
    document.body.appendChild(overlay);

    const root = document.createElement('div');
    root.style.cssText = 'background:#fff;border:1px solid #d4d4d8;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.18);overflow:hidden;font-family:Inter,system-ui,sans-serif;';
    overlay.appendChild(root);

    const ctx = getFieldContext(input);
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #f1f1f4;background:hsl(51 100% 50% / .06);';
    header.innerHTML = `<div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#1f1f23;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/></svg>AI Assist</div><button id="ai-close" style="margin-left:auto;border:none;background:none;cursor:pointer;color:#71717a;padding:2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`;
    root.appendChild(header);

    const body = document.createElement('div');
    body.style.cssText = 'padding:10px 12px;';
    body.innerHTML = `
      <textarea id="ai-desc" rows="2" placeholder="Describe what to write in this field..." style="width:100%;box-sizing:border-box;border:1px solid #d4d4d8;border-radius:6px;padding:8px;font-size:13px;resize:none;outline:none;font-family:inherit;"></textarea>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button id="ai-gen" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:#FFD700;border:none;border-radius:6px;padding:7px;font-size:12px;font-weight:600;cursor:pointer;color:#1a1a1a;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/></svg>Generate</button>
        <button id="ai-improve" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:6px;padding:7px;font-size:12px;font-weight:600;cursor:pointer;color:#3f3f46;">Improve</button>
      </div>
      <div id="ai-status" style="font-size:11px;color:#71717a;margin-top:6px;min-height:14px;"></div>
    `;
    root.appendChild(body);

    const descEl = body.querySelector('#ai-desc');
    const genBtn = body.querySelector('#ai-gen');
    const impBtn = body.querySelector('#ai-improve');
    const statusEl = body.querySelector('#ai-status');
    const closeBtn = header.querySelector('#ai-close');

    const state = { overlay, input, busy: false };

    const run = async (mode) => {
      if (state.busy) return;
      const desc = descEl.value.trim();
      const cur = input.value || '';
      if (mode === 'generate' && !desc) { descEl.focus(); return; }
      if (mode === 'improve' && !cur) { statusEl.textContent = 'Nothing to improve yet — write something first.'; return; }
      state.busy = true;
      genBtn.disabled = impBtn.disabled = true;
      statusEl.textContent = 'Generating...';
      genBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Generating...';
      try {
        const prompt = mode === 'improve'
          ? `Improve and polish the following text. Return ONLY the improved text, no explanation.\n\nField context: ${ctx}\n\nText to improve:\n${cur}`
          : `Write content for a form field. Return ONLY the content text, no quotes, no explanation, no markdown.\n\nField context: ${ctx}\n\nUser request: ${desc}`;
        const res = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gpt_5_mini' });
        const out = (typeof res === 'string' ? res : (res.output || res.text || JSON.stringify(res))).trim().replace(/^["']|["']$/g, '');
        setNativeValue(input, out);
        statusEl.textContent = '✓ Filled';
        setTimeout(closePopover, 600);
      } catch (e) {
        statusEl.textContent = 'Error: ' + (e.message || 'generation failed');
      } finally {
        state.busy = false;
        genBtn.disabled = impBtn.disabled = false;
        genBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/></svg>Generate';
      }
    };

    genBtn.addEventListener('click', () => run('generate'));
    impBtn.addEventListener('click', () => run('improve'));
    closeBtn.addEventListener('click', closePopover);
    descEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run('generate'); } if (e.key === 'Escape') closePopover(); });

    popoverRef.current = state;
    positionPopover(state);
    descEl.focus();
  }, [closePopover]);

  const attachTo = useCallback((input) => {
    if (!input || input.hasAttribute(ATTR) || input.hasAttribute('data-ai-assist-btn')) return;
    const type = (input.type || '').toLowerCase();
    if (SKIP_TYPES.has(type)) return;
    if (input.disabled || input.readOnly) return;
    if (input.getBoundingClientRect().width < 40) return;
    if (input.closest('[data-ai-assist-popover]')) return;

    input.setAttribute(ATTR, '');
    const btn = document.createElement('button');
    btn.setAttribute(`${ATTR}-btn`, '');
    btn.type = 'button';
    btn.title = 'AI Assist';
    btn._aiInput = input;
    btn.style.cssText = 'position:absolute;width:22px;height:22px;border:none;border-radius:6px;background:hsl(51 100% 50% / .12);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;z-index:99997;transition:background .15s;';
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/></svg>';
    btn.addEventListener('mouseenter', () => btn.style.background = 'hsl(51 100% 50% / .25)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'hsl(51 100% 50% / .12)');
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openPopover(input); });

    const container = input.offsetParent || document.body;
    const cs = getComputedStyle(container);
    if (cs.position === 'static') container.style.position = 'relative';
    container.appendChild(btn);
    positionButton(btn, input);
  }, [openPopover]);

  const scan = useCallback(() => {
    const els = document.querySelectorAll('input, textarea');
    els.forEach(attachTo);
  }, [attachTo]);

  useEffect(() => {
    // initial scan (after render)
    const t = setTimeout(scan, 400);
    const mo = new MutationObserver(() => {
      clearTimeout(t);
      setTimeout(scan, 100);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', repositionAll, true);
    window.addEventListener('resize', repositionAll);
    const onClick = (e) => { if (popoverRef.current && !popoverRef.current.overlay.contains(e.target) && !e.target.hasAttribute(`${ATTR}-btn`)) closePopover(); };
    document.addEventListener('mousedown', onClick);
    return () => {
      clearTimeout(t);
      mo.disconnect();
      window.removeEventListener('scroll', repositionAll, true);
      window.removeEventListener('resize', repositionAll);
      document.removeEventListener('mousedown', onClick);
      closePopover();
      document.querySelectorAll(`[${ATTR}]`).forEach(el => el.removeAttribute(ATTR));
      document.querySelectorAll(`button[${ATTR}-btn]`).forEach(b => b.remove());
    };
  }, [scan, repositionAll, closePopover]);

  // inject spin keyframe once
  useEffect(() => {
    const id = 'ai-assist-spin';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }, []);

  return null;
}