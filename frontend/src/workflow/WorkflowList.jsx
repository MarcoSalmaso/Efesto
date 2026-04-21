import React, { useState, useRef } from 'react';
import { Plus, Trash2, Play, GitBranch, Pencil, Check, X } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:8006';

export default function WorkflowList({ workflows, onOpen, onCreate, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef(null);

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!confirm(`Eliminare il workflow "${name}"?`)) return;
    try {
      await axios.delete(`${API}/workflows/${id}`);
      onDelete(id);
    } catch {}
  };

  const startRename = (e, wf) => {
    e.stopPropagation();
    setEditingId(wf.id);
    setEditingName(wf.name);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitRename = async (e) => {
    e?.stopPropagation();
    if (!editingName.trim()) { setEditingId(null); return; }
    try {
      const { data } = await axios.patch(`${API}/workflows/${editingId}`, { name: editingName.trim() });
      onRename(data);
    } catch {}
    setEditingId(null);
  };

  const cancelRename = (e) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2 flex items-center space-x-2">
            <GitBranch className="text-orange-500" />
            <span>Workflow</span>
          </h3>
          <p className="text-zinc-500 text-sm">Pipeline visive di nodi AI, codice e strumenti.</p>
        </div>
        <button onClick={onCreate}
          className="flex items-center gap-2 bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-900/30">
          <Plus size={16} /> Nuovo Workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="p-12 text-center text-zinc-600 italic bg-zinc-800/40 border border-zinc-700/60 rounded-3xl">
          Nessun workflow ancora. Creane uno!
        </div>
      ) : (
        <div className="grid gap-3">
          {workflows.map(wf => (
            <div key={wf.id} onClick={() => editingId !== wf.id && onOpen(wf)}
              className="flex items-center justify-between p-4 bg-zinc-800/40 border border-zinc-700/60 rounded-2xl hover:bg-zinc-700/30 hover:border-zinc-600/60 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-orange-600/10 border border-orange-600/20 p-2.5 rounded-xl shrink-0">
                  <GitBranch size={18} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  {editingId === wf.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        ref={inputRef}
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename(); }}
                        className="bg-zinc-700/80 border border-orange-500/40 rounded-lg px-2 py-0.5 text-sm text-zinc-200 outline-none w-48"
                        autoFocus
                      />
                      <button onClick={commitRename} className="p-1 text-green-400 hover:text-green-300 transition-colors"><Check size={13} /></button>
                      <button onClick={cancelRename} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"><X size={13} /></button>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-zinc-200 truncate">{wf.name}</p>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {(() => {
                      try {
                        const def = JSON.parse(wf.definition);
                        const n = def.nodes?.length ?? 0;
                        return `${n} nod${n === 1 ? 'o' : 'i'}`;
                      } catch { return '—'; }
                    })()}
                    {' · '}
                    {new Date(wf.updated_at + (wf.updated_at.endsWith('Z') ? '' : 'Z'))
                      .toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => startRename(e, wf)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onOpen(wf); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/10 border border-orange-500/20 text-orange-400 text-[11px] font-medium hover:bg-orange-600/20 transition-all">
                  <Play size={11} className="fill-current" /> Apri
                </button>
                <button onClick={(e) => handleDelete(e, wf.id, wf.name)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-900/30 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
