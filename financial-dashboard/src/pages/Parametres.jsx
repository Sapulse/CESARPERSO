import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, RotateCcw } from 'lucide-react';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { fmt } from '../utils/calculations';
import { DEFAULT_CATEGORIES } from '../utils/defaults';

const HEX_COLORS = [
  '#6366f1','#3b82f6','#06b6d4','#10b981','#22c55e',
  '#f59e0b','#f97316','#ef4444','#ec4899','#8b5cf6',
  '#14b8a6','#0ea5e9','#a855f7','#dc2626','#64748b'
];

function CategoryForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || '#6366f1');

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nom de la catégorie *</label>
        <input className="input" placeholder="Ex: Alimentation" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">Couleur</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {HEX_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button className="btn-secondary flex-1" onClick={onCancel}>Annuler</button>
        <button className="btn-primary flex-1" onClick={() => { if (!name) return; onSave({ name, color }); }} disabled={!name}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}

export default function Parametres({ settings, updateSettings, categories, addCategory, updateCategory, deleteCategory }) {
  const [catModal, setCatModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const setS = (k, v) => setLocalSettings(p => ({ ...p, [k]: v }));

  const handleSaveSettings = () => {
    updateSettings({ ...localSettings, soldeInitial: parseFloat(localSettings.soldeInitial) || 0, seuilAlerte: parseFloat(localSettings.seuilAlerte) || 0 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateTaux = (id, field, value) => {
    const updated = localSettings.tauxCharges.map(t => t.id === id ? { ...t, [field]: field === 'taux' ? parseFloat(value) || 0 : value } : t);
    setS('tauxCharges', updated);
  };

  const addTaux = () => {
    const newTaux = { id: Date.now().toString(), label: 'Nouvelle charge', taux: 0, actif: true };
    setS('tauxCharges', [...localSettings.tauxCharges, newTaux]);
  };

  const removeTaux = (id) => {
    setS('tauxCharges', localSettings.tauxCharges.filter(t => t.id !== id));
  };

  const totalTaux = localSettings.tauxCharges.filter(t => t.actif).reduce((s, t) => s + (parseFloat(t.taux) || 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configuration de votre tableau de bord</p>
      </div>

      {/* Section trésorerie */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 mb-4">Trésorerie de départ</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Solde actuel (€)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={localSettings.soldeInitial}
              onChange={e => setS('soldeInitial', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Votre solde de trésorerie aujourd'hui</p>
          </div>
          <div>
            <label className="label">Seuil d'alerte (€)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={localSettings.seuilAlerte}
              onChange={e => setS('seuilAlerte', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Alerte si le solde passe en dessous</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Horizon de projection par défaut</label>
          <div className="flex gap-2">
            {[3, 6, 12].map(h => (
              <button
                key={h}
                onClick={() => setS('horizonProjection', h)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${localSettings.horizonProjection === h ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
              >
                {h} mois
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Taux de charges */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Taux de charges entrepreneur</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Total actif : <span className="font-semibold text-orange-600">{totalTaux}%</span>
              {' '}— appliqué sur vos revenus
            </p>
          </div>
          <button className="btn-secondary text-xs" onClick={addTaux}><Plus size={14} /> Ajouter</button>
        </div>
        <div className="space-y-3">
          {localSettings.tauxCharges.map(t => (
            <div key={t.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <input
                type="checkbox"
                checked={t.actif}
                onChange={e => updateTaux(t.id, 'actif', e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <input
                className="input flex-1 bg-white text-sm"
                value={t.label}
                onChange={e => updateTaux(t.id, 'label', e.target.value)}
                placeholder="Nom"
              />
              <div className="flex items-center gap-1.5">
                <input
                  className="input w-20 bg-white text-sm text-right"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={t.taux}
                  onChange={e => updateTaux(t.id, 'taux', e.target.value)}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <button className="btn-ghost p-1.5 text-red-500 hover:bg-red-50" onClick={() => removeTaux(t.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {localSettings.tauxCharges.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucune charge configurée</p>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-2 mb-6">
        <button className="btn-secondary" onClick={() => setLocalSettings({ ...settings })}>
          <RotateCcw size={14} /> Annuler
        </button>
        <button
          className={`btn ${saved ? 'bg-green-600 text-white hover:bg-green-700' : 'btn-primary'}`}
          onClick={handleSaveSettings}
        >
          <Save size={14} /> {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
        </button>
      </div>

      {/* Categories */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Catégories de dépenses</h3>
            <p className="text-xs text-gray-500 mt-0.5">{categories.length} catégorie{categories.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary text-xs"
              onClick={() => {
                if (window.confirm('Réinitialiser les catégories par défaut ?')) {
                  DEFAULT_CATEGORIES.forEach((c, i) => {
                    if (i < categories.length) updateCategory(categories[i].id, c);
                  });
                }
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button className="btn-primary text-xs" onClick={() => setCatModal({ mode: 'add' })}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
              <span className="text-sm text-gray-800 flex-1 truncate">{cat.name}</span>
              <button className="btn-ghost p-1 text-gray-400 hover:text-gray-700" onClick={() => setCatModal({ mode: 'edit', item: cat })}>
                <Pencil size={12} />
              </button>
              <button className="btn-ghost p-1 text-gray-400 hover:text-red-500" onClick={() => setDeleteTarget(cat)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        open={!!catModal}
        onClose={() => setCatModal(null)}
        title={catModal?.mode === 'add' ? 'Ajouter une catégorie' : 'Modifier la catégorie'}
        size="sm"
        confirmClose
      >
        {catModal && (
          <CategoryForm
            initial={catModal.item}
            onSave={(data) => {
              if (catModal.mode === 'add') addCategory(data);
              else updateCategory(catModal.item.id, data);
              setCatModal(null);
            }}
            onCancel={() => setCatModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteCategory(deleteTarget.id); setDeleteTarget(null); }}
        title="Supprimer la catégorie"
        message={`Supprimer la catégorie "${deleteTarget?.name}" ? Les dépenses associées ne seront pas supprimées.`}
      />
    </div>
  );
}
