import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Shield, Clock, AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import KPICard from '../components/shared/KPICard';
import { calcCurrentMonthStats, buildProjection, calcDepensesParCategorie, calcTransactionStats, fmt } from '../utils/calculations';
import { TYPES_COMPTE } from '../utils/defaults';

export default function Dashboard({ revenus, depenses, settings, categories, comptes, transactions, onNavigate }) {
  const stats = useMemo(() => calcCurrentMonthStats(revenus, depenses, settings), [revenus, depenses, settings]);
  const txStats = useMemo(() => calcTransactionStats(transactions || [], new Date()), [transactions]);
  const projection = useMemo(() => buildProjection(revenus, depenses, settings, 6), [revenus, depenses, settings]);
  const topCats = useMemo(() => calcDepensesParCategorie(depenses, categories, new Date()), [depenses, categories]);

  // Consolidated monthly totals (manual + imported)
  const revenusMoisConsolide = stats.revenusMois + txStats.credits;
  const depensesMoisConsolide = stats.depensesMois + txStats.debits;

  const autonomieOk = stats.autonomie > 3;
  const autonomieWarn = stats.autonomie > 1 && stats.autonomie <= 3;

  const typeRepartition = useMemo(() => {
    const now = new Date();
    let fixe = 0, variable = 0, ponctuelle = 0;
    depenses.forEach(d => {
      const val = d.frequence === 'mensuelle' ? d.montant
        : d.frequence === 'trimestrielle' ? d.montant / 3
        : d.frequence === 'annuelle' ? d.montant / 12
        : (new Date(d.date).getMonth() === now.getMonth() && new Date(d.date).getFullYear() === now.getFullYear() ? d.montant : 0);
      if (d.type === 'fixe') fixe += val;
      else if (d.type === 'variable') variable += val;
      else ponctuelle += val;
    });
    return [
      { name: 'Fixes', value: Math.round(fixe), fill: '#6366f1' },
      { name: 'Variables', value: Math.round(variable), fill: '#f59e0b' },
      { name: 'Ponctuelles', value: Math.round(ponctuelle), fill: '#10b981' },
    ].filter(d => d.value > 0);
  }, [depenses]);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...(transactions || [])]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [transactions]);

  const totalSoldeComptes = useMemo(() =>
    (comptes || []).reduce((s, c) => s + (parseFloat(c.solde) || 0), 0),
  [comptes]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Alerte trésorerie */}
      {settings.soldeInitial < settings.seuilAlerte && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          <AlertTriangle size={18} className="shrink-0" />
          <span>
            <strong>Alerte trésorerie :</strong> votre solde ({fmt(settings.soldeInitial)}) est en dessous du seuil d'alerte ({fmt(settings.seuilAlerte)}).
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <KPICard
          title="Solde actuel"
          value={fmt(settings.soldeInitial)}
          icon={Wallet}
          color="blue"
          size="lg"
        />
        <KPICard
          title="Revenus du mois"
          value={fmt(revenusMoisConsolide)}
          icon={TrendingUp}
          color="green"
          subtitle={txStats.credits > 0 ? `dont ${fmt(txStats.credits)} importés` : 'Ce mois-ci'}
        />
        <KPICard
          title="Dépenses du mois"
          value={fmt(depensesMoisConsolide)}
          icon={TrendingDown}
          color="red"
          subtitle={txStats.debits > 0 ? `dont ${fmt(txStats.debits)} importées` : 'Ce mois-ci'}
        />
        <KPICard
          title="Charges à provisionner"
          value={fmt(stats.chargesMois)}
          icon={Shield}
          color="orange"
          subtitle={`${settings.tauxCharges.filter(t => t.actif).reduce((s, t) => s + t.taux, 0)}% des revenus`}
        />
        <KPICard
          title="Disponible réel"
          value={fmt(stats.disponible)}
          color={stats.disponible >= 0 ? 'green' : 'red'}
          subtitle={stats.disponible >= 0 ? 'Après charges' : '⚠ Déficit'}
          trend={stats.disponible >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Dépenses moyennes"
          value={fmt(stats.moyenneDepenses)}
          color="purple"
          subtitle="Moyenne 3 mois"
        />
        <div className={`card flex flex-col gap-3 ${
          autonomieOk ? 'bg-green-50 border-green-200' :
          autonomieWarn ? 'bg-orange-50 border-orange-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-600">Autonomie financière</p>
            <Clock size={16} className={autonomieOk ? 'text-green-600' : autonomieWarn ? 'text-orange-600' : 'text-red-600'} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${
              autonomieOk ? 'text-green-700' : autonomieWarn ? 'text-orange-700' : 'text-red-700'
            }`}>
              {isFinite(stats.autonomie) ? `${stats.autonomie.toFixed(1)} mois` : '∞'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {autonomieOk
                ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={11} /> Situation saine</span>
                : autonomieWarn
                  ? <span className="text-orange-600">Vigilance recommandée</span>
                  : <span className="text-red-600">⚠ Situation critique</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Comptes bancaires */}
      {(comptes || []).length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Comptes bancaires</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Total consolidé : <span className="font-semibold text-blue-600">{fmt(totalSoldeComptes)}</span>
              </p>
            </div>
            <button onClick={() => onNavigate('import')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Upload size={12} /> Importer →
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {(comptes || []).map(compte => (
              <div key={compte.id} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: compte.couleur || '#3b82f6' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{compte.nom}</p>
                  <p className="text-[10px] text-gray-400 truncate">{compte.banque || TYPES_COMPTE.find(t => t.value === compte.type)?.label}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${(compte.solde || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {fmt(compte.solde || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Projection */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">Projection de trésorerie (6 mois)</h3>
            <button onClick={() => onNavigate('previsionnel')} className="text-xs text-blue-600 hover:underline">Voir détail →</button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={projection} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} labelStyle={{ fontWeight: 600 }} />
              <Area type="monotone" dataKey="solde" stroke="#3b82f6" fill="url(#gradBlue)" strokeWidth={2} name="Solde" />
            </AreaChart>
          </ResponsiveContainer>
          {projection.some(p => p.solde < settings.seuilAlerte) && (
            <p className="mt-2 text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle size={12} /> Le solde passe sous le seuil d'alerte sur cette période.
            </p>
          )}
        </div>

        {/* Répartition dépenses */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Répartition dépenses</h3>
          {typeRepartition.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={typeRepartition} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {typeRepartition.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Aucune dépense</p>
          )}
        </div>
      </div>

      {/* Bottom row: top dépenses + dernières transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top dépenses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">Top postes de dépenses</h3>
            <button onClick={() => onNavigate('depenses')} className="text-xs text-blue-600 hover:underline">Gérer →</button>
          </div>
          {topCats.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune dépense ce mois-ci.</p>
          ) : (
            <div className="space-y-2">
              {topCats.slice(0, 6).map((cat) => {
                const pct = stats.depensesMois > 0 ? (cat.total / stats.depensesMois) * 100 : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="w-24 shrink-0 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                      <span className="text-xs text-gray-700 truncate">{cat.name}</span>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: cat.color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-16 text-right">{fmt(cat.total)}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dernières transactions importées */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">Dernières transactions</h3>
            <button onClick={() => onNavigate('import')} className="text-xs text-blue-600 hover:underline">Voir tout →</button>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 mb-2">Aucune transaction importée.</p>
              <button
                onClick={() => onNavigate('import')}
                className="btn-secondary text-xs"
              >
                <Upload size={13} /> Importer un relevé
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(tx => {
                const compte = (comptes || []).find(c => c.id === tx.compteId);
                return (
                  <div key={tx.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{tx.libelle}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {compte ? ` · ${compte.nom}` : ''}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${tx.montant >= 0 ? 'text-green-600' : 'text-gray-700'}`}>
                      {tx.montant >= 0 ? '+' : ''}{fmt(tx.montant)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
