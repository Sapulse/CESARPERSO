import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, TrendingDown, Filter, Download, ChevronLeft, ChevronRight, Target, Upload, EyeOff } from 'lucide-react';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { FREQUENCES, TYPES_DEPENSE, NATURES } from '../utils/defaults';
import { fmt } from '../utils/calculations';
import { downloadCSV } from '../utils/exportCSV';
import { STATUTS } from './Import';

const EMPTY_FORM = {
  libelle: '', montant: '', date: new Date().toISOString().slice(0, 10),
  frequence: 'mensuelle', categorie: '', type: 'fixe', nature: 'perso', note: ''
};

function DepenseForm({ initial = EMPTY_FORM, categories, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial, categorie: initial?.categorie || (categories[0]?.id || '') });
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
        <input className="input" placeholder="Ex: Loyer, Courses..." value={form.libelle} onChange={e => set('libelle', e.target.value)} required />
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
          <label className="label">Catégorie</label>
          <select className="input" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            {TYPES_DEPENSE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Nature</label>
          <select className="input" value={form.nature} onChange={e => set('nature', e.target.value)}>
            {NATURES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
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

// Edit modal for imported transactions (all fields)
function EditTxModal({ tx, categories, comptes, onSave, onClose }) {
  const [form, setForm] = useState({
    libelle: tx.libelle || '',
    montant: Math.abs(tx.montant) ?? '',
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
        <h3 className="font-semibold text-gray-900">Modifier la dépense importée</h3>
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
            <label className="label">Nature</label>
            <select className="input" value={form.nature} onChange={e => set('nature', e.target.value)}>
              {NATURES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
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
        </div>
        <div>
          <label className="label">Note</label>
          <input className="input" placeholder="Note optionnelle" value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button className="btn-primary flex-1" onClick={() => {
            const newMontant = parseFloat(form.montant);
            onSave(tx.id, {
              libelle: form.libelle,
              // keep negative sign for debit transactions
              montant: tx.montant < 0 ? -Math.abs(newMontant) : newMontant,
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

export default function Depenses({ depenses, categories, settings, updateSettings, addDepense, updateDepense, deleteDepense, transactions = [], comptes = [], updateTransaction }) {
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterNature, setFilterNature] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [monthFilter, setMonthFilter] = useState('');
  const [showBudgets, setShowBudgets] = useState(false);
  const [showImported, setShowImported] = useState(true);
  const [txMonthFilter, setTxMonthFilter] = useState('');
  const [txCatFilter, setTxCatFilter] = useState('');
  const [editTx, setEditTx] = useState(null);

  const budgetsCibles = settings?.budgetsCibles || {};

  const getCat = (id) => categories.find(c => c.id === id);
  const freqLabel = (v) => FREQUENCES.find(f => f.value === v)?.label || v;

  const typeBadge = (type) => {
    const m = { fixe: 'bg-indigo-50 text-indigo-700', variable: 'bg-yellow-50 text-yellow-700', ponctuelle: 'bg-green-50 text-green-700' };
    return m[type] || 'bg-gray-100 text-gray-600';
  };
  const natureBadge = (nature) => nature === 'pro' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700';

  const filtered = useMemo(() => {
    return depenses.filter(d => {
      if (search && !d.libelle.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && d.type !== filterType) return false;
      if (filterNature && d.nature !== filterNature) return false;
      if (filterCat && d.categorie !== filterCat) return false;
      if (monthFilter && d.frequence === 'ponctuelle') {
        if (!d.date?.startsWith(monthFilter)) return false;
      }
      return true;
    });
  }, [depenses, search, filterType, filterNature, filterCat, monthFilter]);

  const totalMensuel = useMemo(() => {
    return depenses.reduce((sum, d) => {
      if (d.frequence === 'mensuelle') return sum + d.montant;
      if (d.frequence === 'trimestrielle') return sum + d.montant / 3;
      if (d.frequence === 'annuelle') return sum + d.montant / 12;
      return sum;
    }, 0);
  }, [depenses]);

  // Budget stats: monthly equivalent per category
  const budgetStats = useMemo(() => {
    return categories
      .filter(cat => budgetsCibles[cat.id] > 0)
      .map(cat => {
        const spent = depenses
          .filter(d => d.categorie === cat.id)
          .reduce((sum, d) => {
            if (d.frequence === 'mensuelle') return sum + d.montant;
            if (d.frequence === 'trimestrielle') return sum + d.montant / 3;
            if (d.frequence === 'annuelle') return sum + d.montant / 12;
            if (d.frequence === 'ponctuelle') {
              // count ponctuelles in current month
              const now = new Date().toISOString().slice(0, 7);
              return d.date?.startsWith(now) ? sum + d.montant : sum;
            }
            return sum;
          }, 0);
        const budget = budgetsCibles[cat.id];
        const pct = Math.min((spent / budget) * 100, 100);
        return { cat, spent, budget, pct };
      });
  }, [categories, depenses, budgetsCibles]);

  // Imported debit transactions (excludes ignored and internal transfers)
  const importedDebits = useMemo(() => {
    return [...transactions]
      .filter(t => t.montant < 0 && t.status !== 'ignoree' && t.status !== 'transfert_interne')
      .filter(t => !txMonthFilter || t.date?.startsWith(txMonthFilter))
      .filter(t => !txCatFilter || t.categorie === txCatFilter)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, txMonthFilter, txCatFilter]);

  const txMonths = useMemo(() => {
    const set = new Set(transactions.filter(t => t.montant < 0).map(t => t.date?.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [transactions]);

  const handleSave = (data) => {
    if (modal.mode === 'add') addDepense(data);
    else updateDepense(modal.item.id, data);
    setModal(null);
  };

  const handleExport = () => {
    const rows = filtered.map(d => ({
      Libellé: d.libelle,
      Montant: d.montant,
      Date: d.date,
      Fréquence: freqLabel(d.frequence),
      Catégorie: getCat(d.categorie)?.name || d.categorie,
      Type: d.type,
      Nature: d.nature,
      Note: d.note || '',
    }));
    const name = monthFilter ? `depenses_${monthFilter}.csv` : 'depenses.csv';
    downloadCSV(rows, name);
  };

  const changeMonth = (delta) => {
    const base = monthFilter || new Date().toISOString().slice(0, 7);
    const [y, m] = base.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonthFilter(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const setBudget = (catId, value) => {
    const updated = { ...budgetsCibles, [catId]: parseFloat(value) || 0 };
    updateSettings({ budgetsCibles: updated });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dépenses</h2>
          <p className="text-sm text-gray-500 mt-0.5">Équivalent mensuel : <span className="font-semibold text-red-600">{fmt(totalMensuel)}</span></p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn-secondary gap-1 ${showBudgets ? 'bg-orange-50 text-orange-600 border-orange-200' : ''}`}
            onClick={() => setShowBudgets(v => !v)}
            title="Budgets par catégorie"
          >
            <Target size={14} />
            <span className="hidden sm:inline">Budgets</span>
          </button>
          <button className="btn-secondary gap-1" onClick={handleExport} title="Exporter en CSV">
            <Download size={14} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Budget section */}
      {showBudgets && (
        <div className="card mb-4 border-orange-100 bg-orange-50/30">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Target size={16} className="text-orange-500" /> Budgets par catégorie
          </h3>
          <p className="text-xs text-gray-500 mb-4">Définir un budget mensuel par catégorie. Laissez 0 pour désactiver.</p>

          {budgetStats.length > 0 && (
            <div className="space-y-3 mb-4">
              {budgetStats.map(({ cat, spent, budget, pct }) => {
                const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-green-500';
                const textColor = pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-orange-600' : 'text-green-600';
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                        <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      </div>
                      <span className={`text-xs font-semibold ${textColor}`}>
                        {fmt(spent)} / {fmt(budget)}
                        {pct >= 100 && ' ⚠️'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                <span className="text-xs text-gray-700 flex-1 truncate">{cat.name}</span>
                <div className="flex items-center gap-0.5">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="w-16 text-xs text-right border border-gray-200 rounded-lg px-1.5 py-1 outline-none focus:border-blue-400"
                    placeholder="0"
                    value={budgetsCibles[cat.id] || ''}
                    onChange={e => setBudget(cat.id, e.target.value)}
                  />
                  <span className="text-xs text-gray-400">€</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <input className="input flex-1 min-w-40" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
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
          <button className={`btn-secondary gap-1 ${showFilters ? 'bg-blue-50 text-blue-600' : ''}`} onClick={() => setShowFilters(v => !v)}>
            <Filter size={14} /> Filtres
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <select className="input text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Tous types</option>
              {TYPES_DEPENSE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="input text-sm" value={filterNature} onChange={e => setFilterNature(e.target.value)}>
              <option value="">Toutes natures</option>
              {NATURES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
            <select className="input text-sm" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">Toutes catégories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {monthFilter && (
        <p className="text-xs text-blue-600 mb-3 font-medium">
          Affichage : {monthLabel(monthFilter)} — récurrents toujours visibles
        </p>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card bg-indigo-50 border-indigo-100">
          <p className="text-xs text-gray-500 mb-1">Fixes</p>
          <p className="text-xl font-bold text-indigo-700">{fmt(depenses.filter(d => d.type === 'fixe' && d.frequence === 'mensuelle').reduce((s, d) => s + d.montant, 0))}</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-100">
          <p className="text-xs text-gray-500 mb-1">Variables</p>
          <p className="text-xl font-bold text-yellow-700">{fmt(depenses.filter(d => d.type === 'variable' && d.frequence === 'mensuelle').reduce((s, d) => s + d.montant, 0))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Total lignes</p>
          <p className="text-xl font-bold text-gray-900">{filtered.length}</p>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <TrendingDown size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune dépense{search || filterType || filterNature || filterCat ? ' correspondante' : ''}</p>
          {!search && !filterType && !filterNature && !filterCat && !monthFilter && (
            <button className="btn-primary mt-4" onClick={() => setModal({ mode: 'add' })}>
              <Plus size={16} /> Ajouter une dépense
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const cat = getCat(d.categorie);
            return (
              <div key={d.id} className="card flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-2.5 h-10 rounded-full shrink-0" style={{ background: cat?.color || '#ccc' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{d.libelle}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {cat && <span className="text-xs text-gray-500">{cat.name}</span>}
                    <span className="text-gray-300">·</span>
                    <span className={`badge ${typeBadge(d.type)}`}>{d.type}</span>
                    <span className={`badge ${natureBadge(d.nature)}`}>{d.nature}</span>
                    <span className="text-xs text-gray-400">{freqLabel(d.frequence)}</span>
                  </div>
                  {d.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{d.note}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-red-600">{fmt(d.montant)}</p>
                  <p className="text-xs text-gray-400">{new Date(d.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="btn-ghost p-1.5" onClick={() => setModal({ mode: 'edit', item: d })}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn-ghost p-1.5 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(d)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Imported transactions section ── */}
      {transactions.length > 0 && (
        <div className="mt-8">
          <button
            className="flex items-center gap-2 w-full text-left mb-3"
            onClick={() => setShowImported(v => !v)}
          >
            <Upload size={15} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800 flex-1">
              Dépenses bancaires importées
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({transactions.filter(t => t.montant < 0 && t.status !== 'ignoree' && t.status !== 'transfert_interne').length} opérations)
              </span>
            </h3>
            <span className="text-xs text-gray-400">{showImported ? '▲ Masquer' : '▼ Afficher'}</span>
          </button>

          {showImported && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-3">
                <select className="input text-sm py-1.5 flex-1 min-w-[130px]" value={txMonthFilter} onChange={e => setTxMonthFilter(e.target.value)}>
                  <option value="">Tous les mois</option>
                  {txMonths.map(m => {
                    const [y, mo] = m.split('-');
                    const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{label}</option>;
                  })}
                </select>
                <select className="input text-sm py-1.5 flex-1 min-w-[130px]" value={txCatFilter} onChange={e => setTxCatFilter(e.target.value)}>
                  <option value="">Toutes catégories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {(txMonthFilter || txCatFilter) && (
                  <button className="btn-secondary text-xs" onClick={() => { setTxMonthFilter(''); setTxCatFilter(''); }}>Effacer</button>
                )}
              </div>

              {importedDebits.length === 0 ? (
                <div className="card text-center py-6 text-gray-400 text-sm">
                  Aucune dépense importée{txMonthFilter || txCatFilter ? ' pour ce filtre' : ''}.
                </div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {importedDebits.map(tx => {
                      const cat = getCat(tx.categorie);
                      const compte = comptes.find(c => c.id === tx.compteId);
                      return (
                        <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                          <div className="w-2.5 h-10 rounded-full shrink-0" style={{ background: cat?.color || '#cbd5e1' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-800 truncate">{tx.libelle}</p>
                              {cat && cat.id !== 'a_classer' && (
                                <span className="text-xs text-gray-500">{cat.name}</span>
                              )}
                              {tx.nature === 'pro' && (
                                <span className="badge bg-purple-50 text-purple-700">Pro</span>
                              )}
                              <StatutBadge status={tx.status} />
                              <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full shrink-0">CSV</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(tx.date)}
                              {compte && <span className="ml-2" style={{ color: compte.couleur || '#3b82f6' }}>● {compte.nom}</span>}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-red-600">{fmt(Math.abs(tx.montant))}</p>
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

              {/* Totals for imported */}
              {importedDebits.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-right">
                  Total affiché : <span className="font-semibold text-red-600">{fmt(importedDebits.reduce((s, t) => s + Math.abs(t.montant), 0))}</span>
                </p>
              )}
            </>
          )}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Ajouter une dépense' : 'Modifier la dépense'} size="lg" confirmClose>
        {modal && (
          <DepenseForm
            initial={modal.item}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteDepense(deleteTarget.id); setDeleteTarget(null); }}
        title="Supprimer cette dépense"
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
