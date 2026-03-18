import { useState, useRef, useCallback, useMemo } from 'react';
import {
  Upload, CheckCircle2, AlertTriangle, FileText,
  Trash2, Pencil, Filter, ArrowLeft, Zap, HelpCircle,
} from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { guessCategory } from '../utils/categorizationRules';
import { fmt } from '../utils/calculations';
import ConfirmDialog from '../components/shared/ConfirmDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NATURES = [
  { value: 'perso', label: 'Perso' },
  { value: 'pro', label: 'Pro' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Visual badge shown in the Catégorie column.
 * - "Auto" (blue): category was detected automatically — may need review
 * - "À classer" (amber): no rule matched — needs attention
 * - nothing: user has manually confirmed/changed the category
 */
function CategorieBadge({ autoDetected, categorie }) {
  if (autoDetected && categorie && categorie !== 'a_classer') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
        <Zap size={8} />Auto
      </span>
    );
  }
  if (categorie === 'a_classer') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
        <HelpCircle size={8} />À classer
      </span>
    );
  }
  return null;
}

// ─── Step 1: Select compte + upload file ─────────────────────────────────────
function StepUpload({ comptes, onParsed, existingHashes, rules }) {
  const [selectedCompteId, setSelectedCompteId] = useState(comptes[0]?.id || '');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const processFile = useCallback((file) => {
    if (!selectedCompteId) {
      setError('Sélectionnez un compte avant de charger le fichier.');
      return;
    }
    if (!file || !file.name.match(/\.(csv|txt)$/i)) {
      setError('Format non supporté. Utilisez un fichier .csv ou .txt');
      return;
    }
    setLoading(true);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows, error: parseError } = parseCSV(e.target.result);
      setLoading(false);
      if (parseError) {
        setError(parseError);
        return;
      }
      const withMeta = rows.map(r => {
        const catId = guessCategory(r.libelle, rules);
        return {
          ...r,
          compteId: selectedCompteId,
          categorie: catId,
          autoDetected: catId !== 'a_classer',
          nature: 'perso',
          note: '',
          duplicate: existingHashes.has(r.hash),
        };
      });
      onParsed(withMeta, file.name);
    };
    reader.onerror = () => {
      setLoading(false);
      setError('Erreur de lecture du fichier.');
    };
    reader.readAsText(file, 'UTF-8');
  }, [selectedCompteId, existingHashes, rules, onParsed]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  return (
    <div className="max-w-xl mx-auto">
      {/* Compte selection */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">1. Sélectionner le compte</h3>
        {comptes.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm">
            Aucun compte configuré. Rendez-vous dans{' '}
            <strong>Paramètres → Comptes bancaires</strong> pour en créer un.
          </div>
        ) : (
          <div className="space-y-2">
            {comptes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCompteId(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  selectedCompteId === c.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.couleur || '#3b82f6' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{c.nom}</p>
                  {c.banque && <p className="text-xs text-gray-400">{c.banque}</p>}
                </div>
                {selectedCompteId === c.id && <CheckCircle2 size={16} className="text-blue-500 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* File drop zone */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">2. Charger le relevé CSV</h3>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={e => processFile(e.target.files[0])}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Analyse en cours…</p>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">Déposez votre fichier ici</p>
              <p className="text-xs text-gray-400 mt-1">ou cliquez pour parcourir — .csv, .txt</p>
              <p className="text-xs text-gray-400 mt-3">
                Formats supportés : BNP, Boursorama, Société Générale, Crédit Agricole, CIC, LCL…
              </p>
              {rules.length > 0 && (
                <p className="text-xs text-blue-500 mt-2">
                  <Zap size={10} className="inline mr-0.5" />
                  {rules.length} règle{rules.length > 1 ? 's' : ''} personnalisée{rules.length > 1 ? 's' : ''} active{rules.length > 1 ? 's' : ''}
                </p>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          <strong>Astuce :</strong> le fichier est lu localement dans votre navigateur — aucune donnée n'est envoyée sur internet.
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Preview & categorize ────────────────────────────────────────────
function StepPreview({ rows, setRows, fileName, categories, onImport, onBack, importing }) {
  const [selected, setSelected] = useState(() => {
    const s = new Set();
    rows.forEach((r, i) => { if (!r.duplicate) s.add(i); });
    return s;
  });
  const [filterDuplicates, setFilterDuplicates] = useState(false);

  const visibleIndices = useMemo(() => {
    return filterDuplicates
      ? rows.map((r, i) => (!r.duplicate ? i : null)).filter(i => i !== null)
      : rows.map((_, i) => i);
  }, [rows, filterDuplicates]);

  const visibleRows = visibleIndices.map(i => rows[i]);
  const duplicateCount = rows.filter(r => r.duplicate).length;

  // Auto-categorization stats (among non-duplicate rows)
  const nonDupRows = rows.filter(r => !r.duplicate);
  const autoCount = nonDupRows.filter(r => r.autoDetected && r.categorie !== 'a_classer').length;
  const aClasserCount = nonDupRows.filter(r => r.categorie === 'a_classer').length;

  const selectedCount = selected.size;
  const allVisibleSelected = visibleIndices.length > 0 && visibleIndices.every(i => selected.has(i));

  const toggleRow = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    const visSet = new Set(visibleIndices);
    const allVisible = visibleIndices.every(i => selected.has(i));
    setSelected(prev => {
      const next = new Set(prev);
      if (allVisible) {
        visSet.forEach(i => next.delete(i));
      } else {
        visSet.forEach(i => next.add(i));
      }
      return next;
    });
  };

  const handleImport = () => {
    onImport(rows.filter((_, i) => selected.has(i)));
  };

  return (
    <div>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          <FileText size={14} className="text-blue-500" />
          <span className="text-sm font-medium text-blue-700">{fileName}</span>
        </div>
        <span className="text-sm text-gray-600">
          <strong>{rows.length}</strong> lignes
        </span>
        {duplicateCount > 0 && (
          <span className="text-sm text-amber-600 flex items-center gap-1">
            <AlertTriangle size={13} />
            <strong>{duplicateCount}</strong> doublon{duplicateCount > 1 ? 's' : ''}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {duplicateCount > 0 && (
            <button
              onClick={() => setFilterDuplicates(v => !v)}
              className={`btn-secondary text-xs flex items-center gap-1 ${filterDuplicates ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
            >
              <Filter size={12} />
              {filterDuplicates ? 'Voir tout' : 'Masquer doublons'}
            </button>
          )}
          <button onClick={onBack} className="btn-secondary text-xs flex items-center gap-1">
            <ArrowLeft size={13} /> Retour
          </button>
        </div>
      </div>

      {/* Auto-categorization stats */}
      {nonDupRows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {autoCount > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
              <Zap size={13} className="text-blue-500" />
              <span><strong>{autoCount}</strong> catégorisée{autoCount > 1 ? 's' : ''} automatiquement</span>
            </div>
          )}
          {aClasserCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
              <HelpCircle size={13} className="text-amber-500" />
              <span><strong>{aClasserCount}</strong> à classer manuellement</span>
            </div>
          )}
          {autoCount === nonDupRows.length && (
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs text-green-700">
              <CheckCircle2 size={13} />
              <span>Toutes les transactions ont été catégorisées !</span>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-3 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-blue-600"
                  />
                </th>
                <th className="py-3 px-2 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Date</th>
                <th className="py-3 px-2 text-left text-xs font-semibold text-gray-500">Libellé</th>
                <th className="py-3 px-2 text-right text-xs font-semibold text-gray-500 whitespace-nowrap">Montant</th>
                <th className="py-3 px-2 text-left text-xs font-semibold text-gray-500 min-w-[160px]">Catégorie</th>
                <th className="py-3 px-2 text-left text-xs font-semibold text-gray-500">Nature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleRows.map((row, visIdx) => {
                const realIdx = visibleIndices[visIdx];
                const isSelected = selected.has(realIdx);
                return (
                  <tr
                    key={realIdx}
                    className={`transition-colors ${
                      row.duplicate
                        ? 'bg-amber-50 opacity-70'
                        : isSelected ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(realIdx)}
                        className="w-4 h-4 accent-blue-600"
                      />
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap text-gray-600 text-xs">
                      {formatDate(row.date)}
                      {row.duplicate && (
                        <span className="ml-1 text-[9px] bg-amber-200 text-amber-700 px-1 py-0.5 rounded font-semibold">DUP</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 max-w-[200px]">
                      <p className="text-gray-800 text-xs truncate" title={row.libelle}>{row.libelle}</p>
                    </td>
                    <td className={`py-2.5 px-2 text-right font-semibold text-xs whitespace-nowrap ${
                      row.montant >= 0 ? 'text-green-600' : 'text-gray-800'
                    }`}>
                      {row.montant >= 0 ? '+' : ''}{fmt(row.montant)}
                    </td>

                    {/* Category cell — core of this feature */}
                    <td className="py-2.5 px-2">
                      <div className="space-y-1">
                        <select
                          className={`input py-1 text-xs transition-colors ${
                            row.autoDetected && row.categorie !== 'a_classer'
                              ? 'border-blue-300 bg-blue-50/50'
                              : row.categorie === 'a_classer'
                                ? 'border-amber-300 bg-amber-50/50'
                                : 'border-green-300 bg-green-50/50'
                          }`}
                          value={row.categorie || ''}
                          onChange={e => {
                            const newCat = e.target.value;
                            setRows(prev => prev.map((r, idx) =>
                              idx === realIdx ? { ...r, categorie: newCat, autoDetected: false } : r
                            ));
                          }}
                          disabled={!isSelected}
                        >
                          <option value="">— Catégorie</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <CategorieBadge autoDetected={row.autoDetected} categorie={row.categorie} />
                      </div>
                    </td>

                    <td className="py-2.5 px-2">
                      <select
                        className="input py-1 text-xs"
                        value={row.nature}
                        onChange={e => setRows(prev => prev.map((r, idx) =>
                          idx === realIdx ? { ...r, nature: e.target.value } : r
                        ))}
                        disabled={!isSelected}
                      >
                        {NATURES.map(n => (
                          <option key={n.value} value={n.value}>{n.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Auto
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            À classer
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Vérifié
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{selectedCount}</span> sélectionnée{selectedCount > 1 ? 's' : ''}
          </p>
          <button
            className="btn-primary"
            disabled={selectedCount === 0 || importing}
            onClick={handleImport}
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Import en cours…
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Importer {selectedCount > 0 ? selectedCount : ''} transaction{selectedCount > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions list ────────────────────────────────────────────────────────
function TransactionsList({ transactions, comptes, categories, updateTransaction, deleteTransaction }) {
  const [filterCompte, setFilterCompte] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const months = useMemo(() => {
    const set = new Set(transactions.map(t => t.date?.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return [...transactions]
      .filter(t => !filterCompte || t.compteId === filterCompte)
      .filter(t => !filterMonth || t.date?.startsWith(filterMonth))
      .filter(t => !filterCategorie || t.categorie === filterCategorie)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, filterCompte, filterMonth, filterCategorie]);

  const totalDebit = filtered.filter(t => t.montant < 0).reduce((s, t) => s + t.montant, 0);
  const totalCredit = filtered.filter(t => t.montant >= 0).reduce((s, t) => s + t.montant, 0);

  const aClasserCount = transactions.filter(t => t.categorie === 'a_classer' || !t.categorie).length;

  return (
    <div>
      {/* Alert for uncategorized */}
      {aClasserCount > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-amber-700 text-sm">
          <HelpCircle size={15} className="shrink-0" />
          <span>
            <strong>{aClasserCount}</strong> transaction{aClasserCount > 1 ? 's' : ''} en attente de catégorisation.
          </span>
          <button
            className="ml-auto text-xs underline"
            onClick={() => setFilterCategorie('a_classer')}
          >
            Filtrer
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className="input text-sm py-1.5 flex-1 min-w-[130px]"
          value={filterCompte}
          onChange={e => setFilterCompte(e.target.value)}
        >
          <option value="">Tous les comptes</option>
          {comptes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select
          className="input text-sm py-1.5 flex-1 min-w-[130px]"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
        >
          <option value="">Tous les mois</option>
          {months.map(m => {
            const [y, mo] = m.split('-');
            const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            return <option key={m} value={m}>{label}</option>;
          })}
        </select>
        <select
          className="input text-sm py-1.5 flex-1 min-w-[130px]"
          value={filterCategorie}
          onChange={e => setFilterCategorie(e.target.value)}
        >
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filterCompte || filterMonth || filterCategorie) && (
          <button
            className="btn-secondary text-xs"
            onClick={() => { setFilterCompte(''); setFilterMonth(''); setFilterCategorie(''); }}
          >
            Effacer filtres
          </button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card py-2.5 text-center">
            <p className="text-xs text-gray-500">Entrées</p>
            <p className="text-sm font-bold text-green-600">+{fmt(totalCredit)}</p>
          </div>
          <div className="card py-2.5 text-center">
            <p className="text-xs text-gray-500">Sorties</p>
            <p className="text-sm font-bold text-gray-800">{fmt(totalDebit)}</p>
          </div>
          <div className="card py-2.5 text-center">
            <p className="text-xs text-gray-500">Net</p>
            <p className={`text-sm font-bold ${(totalCredit + totalDebit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(totalCredit + totalDebit)}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400 text-sm">Aucune transaction{filterCompte || filterMonth || filterCategorie ? ' pour ce filtre' : ''}.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(tx => {
              const compte = comptes.find(c => c.id === tx.compteId);
              const cat = categories.find(c => c.id === tx.categorie);
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 truncate">{tx.libelle}</p>
                      {cat && cat.id !== 'a_classer' && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: cat.color + '25', color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      )}
                      {(!tx.categorie || tx.categorie === 'a_classer') && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 shrink-0">
                          À classer
                        </span>
                      )}
                      {tx.nature === 'pro' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">Pro</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDate(tx.date)}
                      {compte && (
                        <span className="ml-2" style={{ color: compte.couleur || '#3b82f6' }}>● {compte.nom}</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.montant >= 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {tx.montant >= 0 ? '+' : ''}{fmt(tx.montant)}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="btn-ghost p-1.5 text-gray-400 hover:text-blue-600"
                      onClick={() => setEditTarget({ ...tx })}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                      onClick={() => setDeleteTarget(tx)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit panel */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Modifier la transaction</h3>
            <div>
              <label className="label">Libellé</label>
              <input className="input" value={editTarget.libelle} onChange={e => setEditTarget(p => ({ ...p, libelle: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Catégorie</label>
                <select className="input" value={editTarget.categorie || ''} onChange={e => setEditTarget(p => ({ ...p, categorie: e.target.value }))}>
                  <option value="">— Aucune</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nature</label>
                <select className="input" value={editTarget.nature || 'perso'} onChange={e => setEditTarget(p => ({ ...p, nature: e.target.value }))}>
                  {NATURES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Note</label>
              <input className="input" placeholder="Note optionnelle" value={editTarget.note || ''} onChange={e => setEditTarget(p => ({ ...p, note: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={() => setEditTarget(null)}>Annuler</button>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  updateTransaction(editTarget.id, {
                    libelle: editTarget.libelle,
                    categorie: editTarget.categorie,
                    nature: editTarget.nature,
                    note: editTarget.note,
                  });
                  setEditTarget(null);
                }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteTransaction(deleteTarget.id); setDeleteTarget(null); }}
        title="Supprimer la transaction"
        message={`Supprimer "${deleteTarget?.libelle}" (${fmt(deleteTarget?.montant)}) ?`}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Import({
  comptes, transactions, importTransactions, updateTransaction, deleteTransaction,
  categories, rules, onNavigate,
}) {
  const [tab, setTab] = useState('import');
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const existingHashes = useMemo(
    () => new Set(transactions.map(t => t.hash)),
    [transactions]
  );

  const handleParsed = useCallback((parsedRows, name) => {
    setRows(parsedRows);
    setFileName(name);
    setStep(2);
  }, []);

  const handleImport = useCallback(async (toImport) => {
    setImporting(true);
    const count = await importTransactions(toImport);
    setResult({ count, total: toImport.length });
    setImporting(false);
    setStep(3);
  }, [importTransactions]);

  const reset = () => {
    setStep(1);
    setRows([]);
    setFileName('');
    setResult(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Import bancaire</h2>
        <p className="text-sm text-gray-500 mt-0.5">Importez vos relevés CSV et gérez vos transactions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('import')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'import' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Nouvel import
        </button>
        <button
          onClick={() => setTab('transactions')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'transactions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Transactions ({transactions.length})
        </button>
      </div>

      {/* ── Tab: Import ── */}
      {tab === 'import' && (
        <>
          {step < 3 && (
            <div className="flex items-center gap-2 mb-6 text-sm">
              {[{ n: 1, label: 'Fichier' }, { n: 2, label: 'Prévisualisation' }].map(({ n, label }) => (
                <div key={n} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {n}
                  </div>
                  <span className={step >= n ? 'text-gray-800 font-medium' : 'text-gray-400'}>{label}</span>
                  {n < 2 && <div className="w-8 h-px bg-gray-200" />}
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <StepUpload
              comptes={comptes}
              onParsed={handleParsed}
              existingHashes={existingHashes}
              rules={rules}
            />
          )}

          {step === 2 && (
            <StepPreview
              rows={rows}
              setRows={setRows}
              fileName={fileName}
              categories={categories}
              onImport={handleImport}
              onBack={() => setStep(1)}
              importing={importing}
            />
          )}

          {step === 3 && result && (
            <div className="max-w-md mx-auto text-center">
              <div className="card py-10 px-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Import terminé !</h3>
                <p className="text-sm text-gray-500 mb-1">
                  <span className="text-2xl font-bold text-gray-900">{result.count}</span>{' '}
                  transaction{result.count > 1 ? 's' : ''} importée{result.count > 1 ? 's' : ''}
                </p>
                {result.total > result.count && (
                  <p className="text-xs text-amber-600 mb-4">
                    {result.total - result.count} doublon{result.total - result.count > 1 ? 's' : ''} ignoré{result.total - result.count > 1 ? 's' : ''}
                  </p>
                )}
                <div className="flex gap-2 mt-6">
                  <button className="btn-secondary flex-1" onClick={reset}>Nouvel import</button>
                  <button className="btn-primary flex-1" onClick={() => { setTab('transactions'); reset(); }}>
                    Voir les transactions
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Tab: Transactions ── */}
      {tab === 'transactions' && (
        <TransactionsList
          transactions={transactions}
          comptes={comptes}
          categories={categories}
          updateTransaction={updateTransaction}
          deleteTransaction={deleteTransaction}
        />
      )}
    </div>
  );
}
