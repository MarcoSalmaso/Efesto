import React, { useRef, useCallback } from 'react';
import { X, Brain, Code, LogIn, LogOut, Braces } from 'lucide-react';

const field = "w-full bg-zinc-800/60 border border-zinc-600/60 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-orange-500/50 transition-all";

const NODE_LABELS = {
  input:     { icon: <LogIn  size={11} />, label: 'Input' },
  ai_prompt: { icon: <Brain  size={11} />, label: 'AI Prompt' },
  python:    { icon: <Code   size={11} />, label: 'Python' },
  output:    { icon: <LogOut size={11} />, label: 'Output' },
};

export default function ConfigPanel({ node, models, allNodes, edges, onChange, onClose }) {
  const focusedRef = useRef(null); // ref dell'ultimo textarea/input focalizzato

  const d = node?.data ?? {};
  const set = (key, val) => onChange(node.id, { ...d, [key]: val });

  // Calcola i nodi predecessori diretti (source → target = node.id)
  const predecessors = !node ? [] : (edges || [])
    .filter(e => e.target === node.id)
    .map(e => (allNodes || []).find(n => n.id === e.source))
    .filter(Boolean);

  const insertRef = useCallback((nodeId) => {
    const el = focusedRef.current;
    if (!el) return;
    const snippet = `{{${nodeId}.output}}`;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = el.value;
    const next = current.slice(0, start) + snippet + current.slice(end);
    // Ricava il key dal nome dell'attributo data-fieldkey sul textarea
    const key = el.dataset.fieldkey;
    if (key) set(key, next);
    // Ripristina il cursore dopo l'inserimento
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  }, [node, d]);

  const trackFocus = (e) => { focusedRef.current = e.target; };

  if (!node) return null;

  const PredecessorPills = ({ fieldKey }) => {
    if (predecessors.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {predecessors.map(pred => {
          const meta = NODE_LABELS[pred.type] || {};
          return (
            <button
              key={pred.id}
              type="button"
              onClick={() => {
                // Se non c'è un textarea focalizzato, appende al campo
                if (!focusedRef.current || focusedRef.current.dataset.fieldkey !== fieldKey) {
                  set(fieldKey, (d[fieldKey] || '') + `{{${pred.id}.output}}`);
                } else {
                  insertRef(pred.id);
                }
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-700/60 border border-zinc-600/50 text-[10px] text-zinc-300 hover:bg-orange-600/15 hover:border-orange-500/30 hover:text-orange-300 transition-all"
            >
              <Braces size={9} className="text-orange-400" />
              {meta.icon}
              <span className="font-medium">{pred.data?.label || meta.label}</span>
              <span className="text-zinc-600 font-mono">→ .output</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-72 bg-[#222229] border-l border-zinc-700/50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/40">
        <div className="flex items-center gap-2">
          {node.type === 'input'     && <LogIn  size={14} className="text-orange-400" />}
          {node.type === 'ai_prompt' && <Brain  size={14} className="text-orange-400" />}
          {node.type === 'python'    && <Code   size={14} className="text-orange-400" />}
          {node.type === 'output'    && <LogOut size={14} className="text-orange-400" />}
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            {NODE_LABELS[node.type]?.label ?? node.type}
          </span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Label comune */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Etichetta</label>
          <input className={field} value={d.label || ''} data-fieldkey="label"
            onFocus={trackFocus}
            onChange={e => set('label', e.target.value)} placeholder="Nome del nodo..." />
        </div>

        {/* Input node */}
        {node.type === 'input' && (
          <p className="text-[11px] text-zinc-500 italic leading-relaxed">
            Il valore di questo nodo viene fornito al momento dell'esecuzione del workflow.
          </p>
        )}

        {/* AI Prompt node */}
        {node.type === 'ai_prompt' && (<>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Modello</label>
            <select className={field} value={d.model || ''} onChange={e => set('model', e.target.value)}>
              <option value="">(usa modello globale)</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Prompt</label>
            <textarea className={`${field} resize-none`} rows={2}
              value={d.system || ''} data-fieldkey="system"
              onFocus={trackFocus}
              onChange={e => set('system', e.target.value)} placeholder="(opzionale)" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prompt</label>
            {predecessors.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-600">Inserisci l'output di un nodo collegato:</p>
                <PredecessorPills fieldKey="prompt" />
              </div>
            )}
            <textarea className={`${field} resize-none font-mono`} rows={6}
              value={d.prompt || ''} data-fieldkey="prompt"
              onFocus={trackFocus}
              onChange={e => set('prompt', e.target.value)}
              placeholder={"Usa {{node_id.output}} per\nreferenziare step precedenti"} />
          </div>
        </>)}

        {/* Python node */}
        {node.type === 'python' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Codice Python</label>
            {predecessors.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-600">Inserisci come variabile o template:</p>
                <PredecessorPills fieldKey="code" />
              </div>
            )}
            <textarea className={`${field} resize-none font-mono leading-relaxed`} rows={12}
              value={d.code || ''} data-fieldkey="code"
              onFocus={trackFocus}
              onChange={e => set('code', e.target.value)}
              placeholder={"# Gli output dei nodi precedenti\n# sono disponibili come variabili:\n# __node_id = \"valore\"\n\nprint(\"risultato\")"} />
          </div>
        )}

        {/* Output node */}
        {node.type === 'output' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Template</label>
            {predecessors.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-600">Inserisci l'output di un nodo collegato:</p>
                <PredecessorPills fieldKey="template" />
              </div>
            )}
            <textarea className={`${field} resize-none font-mono`} rows={4}
              value={d.template || ''} data-fieldkey="template"
              onFocus={trackFocus}
              onChange={e => set('template', e.target.value)}
              placeholder={"{{node_id.output}}"} />
            <p className="text-[10px] text-zinc-600">Lascia vuoto per usare l'output dell'ultimo nodo connesso.</p>
          </div>
        )}
      </div>
    </div>
  );
}
