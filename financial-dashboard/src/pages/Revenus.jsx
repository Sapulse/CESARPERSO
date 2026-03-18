import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, RepeatIcon, Download, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { FREQUENCES, TYPES_REVENU } from '../utils/defaults';
import { fmt } from '../utils/calculations';
import { downloadCSV } from '../utils/exportCSV';
import { STATUTS } from './Import';

const EMPTY_FORM = { libelle: '', montant: '', date: new Date().toISOString().slice(0, 10), frequence: 'mensuelle', type: 'ca', note: '' };

function RevenuForm({ initial = EMPTY_FORM, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.libelle || !form.montant) return;
    onSave({ ...form, montant: parseFloat(form.montant) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Libellé *</label>
        <input className="input" placeholder="Ex: Mission client A" value={form.libelle} onChange={e => set('libelle', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Montant (€) *</label>
          <input className="input" type="number" min="0" step="0.01" placeholder="0" value={form.montant} onChange={e => set('montant', e.target.value)} required />
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fréquence</label>
          <select className="input" value={form.frequence} onChange={e => set('frequence', e.target.value)}>
            {FREQUENCES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            {TYPES_REVENU.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Note (optionnel)</label>
        <textarea className="input resize-none h-16" placeholder="Remarques..." value={form.note} onChange={e => set('note', e.target.value)} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary flex-1">Enregistrer</button>
      </div>
    </form>
  );
}

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function StatutBadge({ status }) {
  const s = STATUTS.find(x => x.value === status);
  if (!s || status === 'validee') return null;
  return <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>;
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Edit modal for imported credit transactions
function EditTxModal({ tx, categories, comptes, onSave, onClose }) {
  const [form, setForm] = useState({
    libelle: tx.libelle || '',
    montant: tx.montant ?? '',
    date: tx.date || '',
    categorie: tx.categorie || '',
    nature: tx.nature || 'perso',
    status: tx.status || 'validee',
    compteId: tx.compteId || '',
    note: tx.note || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-gray-900">Modifier le revenu importé</h3>
        <div>
          <label className="label">Libellé</label>
          <input className="input" value={form.libelle} onChange={e => set('libelle', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Montant (€)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.montant} onChange={e => set('montant', e.target.value)} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Catégorie</label>
            <select className="input" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
              <option value="">— Aucune</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        {comptes?.length > 0 && (
          <div>
            <label className="label">Compte</label>
            <select className="input" value={form.compteId} onChange={e => set('compteId', e.target.value)}>
              <option value="">— Compte</option>
              {comptes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Note</label>
          <input className="input" placeholder="Note optionnelle" value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button className="btn-primary flex-1" onClick={() => {
            onSave(tx.id, {
              libelle: form.libelle,
              montant: parseFloat(form.montant) || tx.montant,
              date: form.date,
              categorie: form.categorie,
              nature: form.nature,
              status: form.status,
              compteId: form.compteId,
              note: form.note,
              autoDetected: false,
            });
            onClose();
          }}>Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}

export default function Revenus({ revenus, addRevenu, updateRevenu, deleteRevenu, transactions = [], comptes = [], categories = [], updateTransaction }) {
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filter, setFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [showImported, setShowImported] = useState(true);
  const [txMonthFilter, setTxMonthFilter] = useState('');
  const [editTx, setEditTx] = useState(null);

  const freqLabel = (v) => FREQUENCES.find(f => f.value === v)?.label || v;
  const typeLabel = (v) => TYPES_REVENU.find(t => t.value === v)?.label || v;

  const freqBadge = (freq) => {
    const colors = { mensuelle: 'bg-blue-50 text-blue-700', trimestrielle: 'bg-purple-50 text-purple-700', annuelle: 'bg-green-50 text-green-700', ponctuelle: 'bg-gray-100 text-gray-600' };
    return colors[freq] || 'bg-gray-100 text-gray-600';
  };

  // For month filter: always show recurring, filter ponctuelles by date
  const filtered = useMemo(() => {
    return revenus.filter(r => {
      if (filter) {
        const q = filter.toLowerCase();
        if (!r.libelle.toLowerCase().includes(q) && !r.type.includes(q)) return false;
      }
      if (monthFilter && r.frequence === 'ponctuelle') {
        if (!r.date?.startsWith(monthFilter)) return false;
      }
      return true;
    });
  }, [revenus, filter, monthFilter]);

  const totalMensuel = useMemo(() => {
    return filtered.reduce((sum, r) => {
      if (r.frequence === 'mensuelle') return sum + r.montant;
      if (r.frequence === 'trimestrielle') return sum + r.montant / 3;
      if (r.frequence === 'annuelle') return sum + r.montant / 12;
      return sum + r.montant;
    }, 0);
  }, [filtered]);

  // Imported credit transactions (excludes ignored and internal transfers)
  const importedCredits = useMemo(() => {
    return [...transactions]
      .filter(t => t.montant > 0 && t.status !== 'ignoree' && t.status !== 'transfert_interne')
      .filter(t => !txMonthFilter || t.date?.startsWith(txMonthFilter))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, txMonthFilter]);

  const txMonths = useMemo(() => {
    const set = new Set(transactions.filter(t => t.montant > 0).map(t => t.date?.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [transactions]);

  const handleSave = (data) => {
    if (modal.mode === 'add') addRevenu(data);
    else updateRevenu(modal.item.id, data);
    setModal(null);
  };

  const handleExport = () => {
    const rows = filtered.map(r => ({
      Libellé: r.libelle,
      Montant: r.montant,
      Date: r.date,
      Fréquence: freqLabel(r.frequence),
      Type: typeLabel(r.type),
      Note: r.note || '',
    }));
    const name = monthFilter ? `revenus_${monthFilter}.csv` : 'revenus.csv';
    downloadCSV(rows, name);
  };

  const changeMonth = (delta) => {
    const base = monthFilter || new Date().toISOString().slice(0, 7);
    const [y, m] = base.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonthFilter(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Revenus</h2>
          <p className="text-sm text-gray-500 mt-0.5">Équivalent mensuel : <span className="font-semibold text-green-600">{fmt(totalMensuel)}</span></p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary gap-1" onClick={handleExport} title="Exporter en CSV">
            <Download size={14} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input className="input flex-1" placeholder="Rechercher..." value={filter} onChange={e => setFilter(e.target.value)} />
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2">
          <button className="p-1.5 hover:text-blue-600 transition-colors" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
          <input
            type="month"
            className="text-sm text-gray-700 bg-transparent border-none outline-none py-2 w-36 text-center"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
          />
          <button className="p-1.5 hover:text-blue-600 transition-colors" onClick={() => changeMonth(1)}><ChevronRight size={16} /></button>
          {monthFilter && (
            <button className="text-xs text-gray-400 hover:text-red-500 px-1" onClick={() => setMonthFilter('')}>✕</button>
          )}
        </div>
      </div>

      {monthFilter && (
        <p className="text-xs text-blue-600 mb-3 font-medium">
          Affichage : {monthLabel(monthFilter)} — récurrents toujours visibles
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="card bg-green-50 border-green-100">
          <p className="text-xs text-gray-500 mb-1">Mensuel récurrent</p>
          <p className="text-xl font-bold text-green-700">{fmt(filtered.filter(r => r.frequence === 'mensuelle').reduce((s, r) => s + r.montant, 0))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Nombre de sources</p>
          <p className="text-xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Équiv. annuel</p>
          <p className="text-xl font-bold text-gray-900">{fmt(totalMensuel * 12)}</p>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun revenu</p>
          <p className="text-sm">{monthFilter ? `Aucune entrée ponctuelle en ${monthLabel(monthFilter)}` : 'Ajoutez votre premier revenu'}</p>
          {!filter && !monthFilter && (
            <button className="btn-primary mt-4" onClick={() => setModal({ mode: 'add' })}>
              <Plus size={16} /> Ajouter un revenu
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="card flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="p-2 bg-green-50 rounded-lg shrink-0">
                {r.frequence === 'mensuelle' ? <RepeatIcon size={16} className="text-green-600" /> : <TrendingUp size={16} className="text-green-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{r.libelle}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`badge ${freqBadge(r.frequence)}`}>{freqLabel(r.frequence)}</span>
                  <span className="text-xs text-gray-400">{typeLabel(r.type)}</span>
                  <span className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString('fr-FR')}</span>
                </div>
                {r.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.note}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-green-600">{fmt(r.montant)}</p>
                <p className="text-xs text-gray-400">{freqLabel(r.frequence)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="btn-ghost p-1.5" onClick={() => setModal({ mode: 'edit', item: r })}>
                  <Pencil size={14} />
                </button>
                <button className="btn-ghost p-1.5 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(r)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Imported credit transactions ── */}
      {transactions.length > 0 && (
        <div className="mt-8">
          <button
            className="flex items-center gap-2 w-full text-left mb-3"
            onClick={() => setShowImported(v => !v)}
          >
            <Upload size={15} className="text-green-500" />
            <h3 className="font-semibold text-gray-800 flex-1">
              Revenus bancaires importés
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({transactions.filter(t => t.montant > 0 && t.status !== 'ignoree' && t.status !== 'transfert_interne').length} opérations)
              </span>
            </h3>
            <span className="text-xs text-gray-400">{showImported ? '▲ Masquer' : '▼ Afficher'}</span>
          </button>

          {showImported && (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                <select className="input text-sm py-1.5 flex-1 min-w-[130px]" value={txMonthFilter} onChange={e => setTxMonthFilter(e.target.value)}>
                  <option value="">Tous les mois</option>
                  {txMonths.map(m => {
                    const [y, mo] = m.split('-');
                    const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{label}</option>;
                  })}
                </select>
                {txMonthFilter && <button className="btn-secondary text-xs" onClick={() => setTxMonthFilter('')}>Effacer</button>}
              </div>

              {importedCredits.length === 0 ? (
                <div className="card text-center py-6 text-gray-400 text-sm">
                  Aucun revenu importé{txMonthFilter ? ' pour ce mois' : ''}.
                </div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {importedCredits.map(tx => {
                      const cat = categories.find(c => c.id === tx.categorie);
                      const compte = comptes.find(c => c.id === tx.compteId);
                      return (
                        <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                          <div className="p-2 bg-green-50 rounded-lg shrink-0">
                            <TrendingUp size={16} className="text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-800 truncate">{tx.libelle}</p>
                              {cat && cat.id !== 'a_classer' && (
                                <span className="text-xs text-gray-500">{cat.name}</span>
                              )}
                              <StatutBadge status={tx.status} />
                              <span className="text-[10px] bg-green-50 text-green-500 px-1.5 py-0.5 rounded-full shrink-0">CSV</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {formatDate(tx.date)}
                              {compte && <span className="ml-2" style={{ color: compte.couleur || '#3b82f6' }}>● {compte.nom}</span>}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-green-600">+{fmt(tx.montant)}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {updateTransaction && (
                              <button className="btn-ghost p-1.5" onClick={() => setEditTx(tx)}>
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {importedCredits.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-right">
                  Total affiché : <span className="font-semibold text-green-600">+{fmt(importedCredits.reduce((s, t) => s + t.montant, 0))}</span>
                </p>
              )}
            </>
          )}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Ajouter un revenu' : 'Modifier le revenu'}
        confirmClose
      >
        {modal && (
          <RevenuForm
            initial={modal.item}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteRevenu(deleteTarget.id); setDeleteTarget(null); }}
        title="Supprimer ce revenu"
        message={`Voulez-vous supprimer "${deleteTarget?.libelle}" (${deleteTarget ? fmt(deleteTarget.montant) : ''}) ?`}
      />

      {editTx && updateTransaction && (
        <EditTxModal
          tx={editTx}
          categories={categories}
          comptes={comptes}
          onSave={updateTransaction}
          onClose={() => setEditTx(null)}
        />
      )}
    </div>
  );
}
