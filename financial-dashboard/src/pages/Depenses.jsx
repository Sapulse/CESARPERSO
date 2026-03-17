import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, TrendingDown, Filter } from 'lucide-react';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { FREQUENCES, TYPES_DEPENSE, NATURES } from '../utils/defaults';
import { fmt } from '../utils/calculations';

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

export default function Depenses({ depenses, categories, addDepense, updateDepense, deleteDepense }) {
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterNature, setFilterNature] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const totalMensuel = useMemo(() => {
    return depenses.reduce((sum, d) => {
      if (d.frequence === 'mensuelle') return sum + d.montant;
      if (d.frequence === 'trimestrielle') return sum + d.montant / 3;
      if (d.frequence === 'annuelle') return sum + d.montant / 12;
      return sum;
    }, 0);
  }, [depenses]);

  const filtered = useMemo(() => {
    return depenses.filter(d => {
      if (search && !d.libelle.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && d.type !== filterType) return false;
      if (filterNature && d.nature !== filterNature) return false;
      if (filterCat && d.categorie !== filterCat) return false;
      return true;
    });
  }, [depenses, search, filterType, filterNature, filterCat]);

  const handleSave = (data) => {
    if (modal.mode === 'add') addDepense(data);
    else updateDepense(modal.item.id, data);
    setModal(null);
  };

  const getCat = (id) => categories.find(c => c.id === id);
  const freqLabel = (v) => FREQUENCES.find(f => f.value === v)?.label || v;

  const typeBadge = (type) => {
    const m = { fixe: 'bg-indigo-50 text-indigo-700', variable: 'bg-yellow-50 text-yellow-700', ponctuelle: 'bg-green-50 text-green-700' };
    return m[type] || 'bg-gray-100 text-gray-600';
  };
  const natureBadge = (nature) => nature === 'pro' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dépenses</h2>
          <p className="text-sm text-gray-500 mt-0.5">Équivalent mensuel : <span className="font-semibold text-red-600">{fmt(totalMensuel)}</span></p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Search + Filters */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
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
          <p className="text-xl font-bold text-gray-900">{depenses.length}</p>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <TrendingDown size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune dépense{search || filterType || filterNature || filterCat ? ' correspondante' : ''}</p>
          {!search && !filterType && !filterNature && !filterCat && (
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

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Ajouter une dépense' : 'Modifier la dépense'} size="lg">
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
    </div>
  );
}
