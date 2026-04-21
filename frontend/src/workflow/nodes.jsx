import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { LogIn, Brain, Code, LogOut } from 'lucide-react';

const baseCard = 'rounded-2xl border shadow-lg min-w-[220px] max-w-[280px] text-zinc-100 text-xs';

const statusRing = (status) => {
  if (status === 'running') return 'ring-2 ring-orange-500/70 shadow-orange-900/30';
  if (status === 'done')    return 'ring-2 ring-green-500/50';
  if (status === 'error')   return 'ring-2 ring-red-500/50';
  return '';
};

// ── Input ────────────────────────────────────────────────────────────────────
export function InputNode({ data, selected }) {
  return (
    <div className={`${baseCard} bg-zinc-800/80 border-zinc-700/60 ${statusRing(data.status)} ${selected ? 'ring-2 ring-orange-500/40' : ''}`}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-700/50 bg-zinc-700/30 rounded-t-2xl">
        <LogIn size={13} className="text-orange-400" />
        <span className="font-bold text-[11px] uppercase tracking-widest text-zinc-400">Input</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-zinc-300 text-[11px] leading-snug">{data.label || 'Testo di partenza del workflow'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !w-2.5 !h-2.5 !border-2 !border-zinc-900" />
    </div>
  );
}

// ── AI Prompt ────────────────────────────────────────────────────────────────
export function AiPromptNode({ data, selected }) {
  return (
    <div className={`${baseCard} bg-zinc-800/80 border-zinc-700/60 ${statusRing(data.status)} ${selected ? 'ring-2 ring-orange-500/40' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-orange-500 !w-2.5 !h-2.5 !border-2 !border-zinc-900" />
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-700/50 bg-zinc-700/30 rounded-t-2xl">
        <Brain size={13} className="text-orange-400" />
        <span className="font-bold text-[11px] uppercase tracking-widest text-zinc-400">AI Prompt</span>
      </div>
      <div className="px-4 py-3 space-y-1">
        <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Prompt</p>
        <p className="text-zinc-300 text-[11px] leading-snug line-clamp-3 whitespace-pre-wrap">
          {data.prompt || <span className="italic text-zinc-600">Nessun prompt</span>}
        </p>
        {data.status === 'running' && data.streamBuffer && (
          <p className="text-orange-300 text-[10px] font-mono leading-snug line-clamp-2 mt-1 border-t border-zinc-700/40 pt-1">
            {data.streamBuffer}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !w-2.5 !h-2.5 !border-2 !border-zinc-900" />
    </div>
  );
}

// ── Python ───────────────────────────────────────────────────────────────────
export function PythonNode({ data, selected }) {
  return (
    <div className={`${baseCard} bg-zinc-800/80 border-zinc-700/60 ${statusRing(data.status)} ${selected ? 'ring-2 ring-orange-500/40' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-orange-500 !w-2.5 !h-2.5 !border-2 !border-zinc-900" />
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-700/50 bg-zinc-700/30 rounded-t-2xl">
        <Code size={13} className="text-orange-400" />
        <span className="font-bold text-[11px] uppercase tracking-widest text-zinc-400">Python</span>
      </div>
      <div className="px-4 py-3">
        <pre className="text-zinc-300 text-[10px] font-mono leading-snug line-clamp-4 whitespace-pre-wrap">
          {data.code || <span className="italic text-zinc-600 not-italic font-sans">Nessun codice</span>}
        </pre>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !w-2.5 !h-2.5 !border-2 !border-zinc-900" />
    </div>
  );
}

// ── Output ───────────────────────────────────────────────────────────────────
export function OutputNode({ data, selected }) {
  return (
    <div className={`${baseCard} bg-zinc-800/80 border-zinc-700/60 ${statusRing(data.status)} ${selected ? 'ring-2 ring-orange-500/40' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-orange-500 !w-2.5 !h-2.5 !border-2 !border-zinc-900" />
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-700/50 bg-zinc-700/30 rounded-t-2xl">
        <LogOut size={13} className="text-orange-400" />
        <span className="font-bold text-[11px] uppercase tracking-widest text-zinc-400">Output</span>
      </div>
      <div className="px-4 py-3">
        {data.result
          ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80] shrink-0" />
              <p className="text-green-300 text-[11px] font-medium">Output pronto</p>
            </div>
          )
          : <p className="text-zinc-600 text-[11px] italic">Risultato finale del workflow</p>
        }
      </div>
    </div>
  );
}
