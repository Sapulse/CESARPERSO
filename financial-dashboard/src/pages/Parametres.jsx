import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, RotateCcw, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { fmt } from '../utils/calculations';
import { DEFAULT_CATEGORIES, TYPES_COMPTE } from '../utils/defaults';
import { DEFAULT_RULES } from '../utils/categorizationRules';

const HEX_COLORS = [
  '#6366f1','#3b82f6','#06b6d4','#10b981','#22c55e',
  '#f59e0b','#f97316','#ef4444','#ec4899','#8b5cf6',
  '#14b8a6','#0ea5e9','#a855f7','#dc2626','#64748b',
];

// ─── Category form ────────────────────────────────────────────────────────────
function CategoryForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || '#6366f1');

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nom de la catégorie *</label>
        <input className="input" placeholder="Ex: Alimentation" value={name} onChange={e => setName(e.target.value)} />
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
        <button className="btn-primary flex-1" disabled={!name} onClick={() => { if (name) onSave({ name, color }); }}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ─── Compte form ──────────────────────────────────────────────────────────────
function CompteForm({ initial, onSave, onCancel }) {
  const [nom, setNom] = useState(initial?.nom || '');
  const [banque, setBanque] = useState(initial?.banque || '');
  const [type, setType] = useState(initial?.type || 'courant');
  const [solde, setSolde] = useState(initial?.solde ?? 0);
  const [couleur, setCouleur] = useState(initial?.couleur || '#3b82f6');

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nom du compte *</label>
        <input className="input" placeholder="Ex: Compte courant BNP" value={nom} onChange={e => setNom(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Banque</label>
          <input className="input" placeholder="Ex: BNP Paribas" value={banque} onChange={e => setBanque(e.target.value)} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            {TYPES_COMPTE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Solde actuel (€)</label>
          <input className="input" type="number" step="0.01" value={solde} onChange={e => setSolde(e.target.value)} />
        </div>
        <div>
          <label className="label">Couleur</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {HEX_COLORS.slice(0, 8).map(c => (
              <button
                key={c}
                onClick={() => setCouleur(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${couleur === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button className="btn-secondary flex-1" onClick={onCancel}>Annuler</button>
        <button
          className="btn-primary flex-1"
          disabled={!nom}
          onClick={() => {
            if (!nom) return;
            onSave({ nom, banque, type, solde: parseFloat(solde) || 0, couleur, actif: true });
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Parametres({
  settings, updateSettings,
  categories, addCategory, updateCategory, deleteCategory,
  comptes, addCompte, updateCompte, deleteCompte,
  rules, addRule, deleteRule,
}) {
  const [catModal, setCatModal] = useState(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newRuleCat, setNewRuleCat] = useState('');
  const [showDefaultRules, setShowDefaultRules] = useState(false);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState(null);
  const [compteModal, setCompteModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteCompteTarget, setDeleteCompteTarget] = useState(null);
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const setS = (k, v) => setLocalSettings(p => ({ ...p, [k]: v }));

  const handleSaveSettings = () => {
    updateSettings({
      ...localSettings,
      soldeInitial: parseFloat(localSettings.soldeInitial) || 0,
      seuilAlerte: parseFloat(localSettings.seuilAlerte) || 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateTaux = (id, field, value) => {
    const updated = localSettings.tauxCharges.map(t =>
      t.id === id ? { ...t, [field]: field === 'taux' ? parseFloat(value) || 0 : value } : t
    );
    setS('tauxCharges', updated);
  };

  const addTaux = () => {
    const newTaux = { id: Date.now().toString(), label: 'Nouvelle charge', taux: 0, actif: true };
    setS('tauxCharges', [...localSettings.tauxCharges, newTaux]);
  };

  const removeTaux = (id) => setS('tauxCharges', localSettings.tauxCharges.filter(t => t.id !== id));

  const totalTaux = localSettings.tauxCharges
    .filter(t => t.actif)
    .reduce((s, t) => s + (parseFloat(t.taux) || 0), 0);

  const totalSoldeComptes = (comptes || []).reduce((s, c) => s + (parseFloat(c.solde) || 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configuration de votre tableau de bord</p>
      </div>

      {/* ── Comptes bancaires ───────────────────────────────────── */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Comptes bancaires</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {(comptes || []).length} compte{(comptes || []).length > 1 ? 's' : ''} —{' '}
              Total : <span className="font-semibold text-blue-600">{fmt(totalSoldeComptes)}</span>
            </p>
          </div>
          <button className="btn-primary text-xs" onClick={() => setCompteModal({ mode: 'add' })}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {(comptes || []).map(compte => (
            <div key={compte.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: compte.couleur || '#3b82f6' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{compte.nom}</p>
                <p className="text-xs text-gray-400 truncate">
                  {compte.banque || '—'} · {TYPES_COMPTE.find(t => t.value === compte.type)?.label || compte.type}
                </p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${(compte.solde || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(compte.solde || 0)}
              </span>
              <button className="btn-ghost p-1 text-gray-400 hover:text-gray-700" onClick={() => setCompteModal({ mode: 'edit', item: compte })}>
                <Pencil size={13} />
              </button>
              <button className="btn-ghost p-1 text-gray-400 hover:text-red-500" onClick={() => setDeleteCompteTarget(compte)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {(comptes || []).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Aucun compte. Ajoutez votre première banque.</p>
          )}
        </div>
      </div>

      {/* ── Trésorerie ───────────────────────────────────────────── */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 mb-4">Trésorerie de départ</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Solde global (€)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={localSettings.soldeInitial}
              onChange={e => setS('soldeInitial', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Utilisé pour les projections</p>
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
            <p className="text-xs text-gray-400 mt-1">Alerte si solde en dessous</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Horizon de projection par défaut</label>
          <div className="flex gap-2">
            {[3, 6, 12].map(h => (
              <button
                key={h}
                onClick={() => setS('horizonProjection', h)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  localSettings.horizonProjection === h
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {h} mois
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Taux de charges ──────────────────────────────────────── */}
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
                  type="number" min="0" max="100" step="0.1"
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
          {localSettings.tauxCharges.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Aucune charge configurée</p>
          )}
        </div>
      </div>

      {/* ── Save button ──────────────────────────────────────────── */}
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

      {/* ── Categories ───────────────────────────────────────────── */}
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

      {/* ── Règles de catégorisation ─────────────────────────────── */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap size={15} className="text-blue-500" />
              Règles de catégorisation
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Vos règles personnalisées sont prioritaires sur les règles intégrées.
            </p>
          </div>
        </div>

        {/* Add custom rule */}
        <div className="flex gap-2 mt-4 mb-3">
          <input
            className="input flex-1 text-sm"
            placeholder="Mot-clé (ex: leclerc)"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newKeyword.trim() && newRuleCat) {
                addRule({ keyword: newKeyword.trim().toLowerCase(), categoryId: newRuleCat });
                setNewKeyword('');
                setNewRuleCat('');
              }
            }}
          />
          <select
            className="input text-sm flex-1"
            value={newRuleCat}
            onChange={e => setNewRuleCat(e.target.value)}
          >
            <option value="">— Catégorie</option>
            {categories.filter(c => c.id !== 'a_classer').map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            className="btn-primary text-xs shrink-0"
            disabled={!newKeyword.trim() || !newRuleCat}
            onClick={() => {
              addRule({ keyword: newKeyword.trim().toLowerCase(), categoryId: newRuleCat });
              setNewKeyword('');
              setNewRuleCat('');
            }}
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {/* Custom rules list */}
        {(rules || []).length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl">
            Aucune règle personnalisée. Ajoutez des mots-clés spécifiques à votre usage.
          </p>
        ) : (
          <div className="space-y-1.5 mb-3">
            {(rules || []).map(rule => {
              const cat = categories.find(c => c.id === rule.categoryId);
              return (
                <div key={rule.id} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                  <Zap size={12} className="text-blue-400 shrink-0" />
                  <span className="text-sm font-mono text-blue-800 flex-1 truncate">{rule.keyword}</span>
                  <span className="text-xs text-gray-500">→</span>
                  {cat && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: cat.color + '20', color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  )}
                  <button
                    className="btn-ghost p-1 text-gray-400 hover:text-red-500 shrink-0"
                    onClick={() => setDeleteRuleTarget(rule)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Default rules (collapsible) */}
        <button
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-2"
          onClick={() => setShowDefaultRules(v => !v)}
        >
          {showDefaultRules ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          Règles intégrées ({DEFAULT_RULES.reduce((s, r) => s + r.keywords.length, 0)} mots-clés, non modifiables)
        </button>
        {showDefaultRules && (
          <div className="mt-2 space-y-1 max-h-64 overflow-y-auto pr-1">
            {DEFAULT_RULES.map(rule => {
              const cat = categories.find(c => c.id === rule.categoryId);
              return (
                <div key={rule.categoryId} className="bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    {cat && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: cat.color + '20', color: cat.color }}
                      >
                        {cat.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono leading-relaxed">
                    {rule.keywords.join(', ')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
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

      <Modal
        open={!!compteModal}
        onClose={() => setCompteModal(null)}
        title={compteModal?.mode === 'add' ? 'Ajouter un compte' : 'Modifier le compte'}
        size="sm"
        confirmClose
      >
        {compteModal && (
          <CompteForm
            initial={compteModal.item}
            onSave={(data) => {
              if (compteModal.mode === 'add') addCompte(data);
              else updateCompte(compteModal.item.id, data);
              setCompteModal(null);
            }}
            onCancel={() => setCompteModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteCategory(deleteTarget.id); setDeleteTarget(null); }}
        title="Supprimer la catégorie"
        message={`Supprimer "${deleteTarget?.name}" ? Les dépenses associées ne seront pas supprimées.`}
      />

      <ConfirmDialog
        open={!!deleteCompteTarget}
        onClose={() => setDeleteCompteTarget(null)}
        onConfirm={() => { deleteCompte(deleteCompteTarget.id); setDeleteCompteTarget(null); }}
        title="Supprimer le compte"
        message={`Supprimer le compte "${deleteCompteTarget?.nom}" ? Les transactions rattachées resteront en base.`}
      />

      <ConfirmDialog
        open={!!deleteRuleTarget}
        onClose={() => setDeleteRuleTarget(null)}
        onConfirm={() => { deleteRule(deleteRuleTarget.id); setDeleteRuleTarget(null); }}
        title="Supprimer la règle"
        message={`Supprimer la règle "${deleteRuleTarget?.keyword}" ?`}
      />
    </div>
  );
}
