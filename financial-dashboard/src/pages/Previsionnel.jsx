import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { buildProjection, calcDepensesParCategorie, fmt } from '../utils/calculations';
import { addMonths } from 'date-fns';

const HORIZONS = [3, 6, 12];

export default function Previsionnel({ revenus, depenses, settings, categories }) {
  const [horizon, setHorizon] = useState(settings.horizonProjection || 6);

  const projection = useMemo(
    () => buildProjection(revenus, depenses, settings, horizon),
    [revenus, depenses, settings, horizon]
  );

  const catData = useMemo(() => {
    const months = [];
    for (let i = 1; i <= Math.min(horizon, 6); i++) {
      const date = addMonths(new Date(), i);
      const cats = calcDepensesParCategorie(depenses, categories, date);
      months.push({ label: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), ...Object.fromEntries(cats.map(c => [c.name, c.total])) });
    }
    return months;
  }, [depenses, categories, horizon]);

  const catNames = useMemo(() => {
    const set = new Set();
    catData.forEach(m => Object.keys(m).filter(k => k !== 'label').forEach(k => set.add(k)));
    return [...set].slice(0, 6);
  }, [catData]);

  const CAT_COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#ec4899'];

  const lastMonth = projection[projection.length - 1];
  const firstMonth = projection[1];
  const deltaTotal = lastMonth && firstMonth ? lastMonth.solde - projection[0].solde : 0;
  const criticalMonths = projection.filter(p => p.solde < settings.seuilAlerte && p.solde !== projection[0].solde);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <span style={{ color: p.color }}>{p.name}</span>
              <span className="font-medium">{fmt(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prévisionnel</h2>
          <p className="text-sm text-gray-500 mt-0.5">Projection de votre trésorerie future</p>
        </div>
        <div className="flex gap-2">
          {HORIZONS.map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${horizon === h ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {h} mois
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {criticalMonths.length > 0 && (
        <div className="mb-4 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3 text-orange-700 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <strong>Attention :</strong> La trésorerie passe sous le seuil d'alerte ({fmt(settings.seuilAlerte)}) en{' '}
            {criticalMonths.map(m => m.label).join(', ')}.
          </div>
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Solde départ</p>
          <p className="text-xl font-bold text-gray-900">{fmt(projection[0]?.solde || 0)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Solde final ({horizon} mois)</p>
          <p className={`text-xl font-bold ${(lastMonth?.solde || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {fmt(lastMonth?.solde || 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Évolution totale</p>
          <p className={`text-xl font-bold flex items-center gap-1 ${deltaTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {deltaTotal >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {fmt(Math.abs(deltaTotal))}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Mois critiques</p>
          <p className={`text-xl font-bold ${criticalMonths.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {criticalMonths.length === 0 ? (
              <span className="flex items-center gap-1"><CheckCircle2 size={16} /> Aucun</span>
            ) : criticalMonths.length}
          </p>
        </div>
      </div>

      {/* Evolution chart */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Évolution du solde</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={projection} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSolde" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v/1000)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={settings.seuilAlerte} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Seuil alerte', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
            <Area type="monotone" dataKey="solde" stroke="#3b82f6" fill="url(#gradSolde)" strokeWidth={2.5} name="Solde" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown bars */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Flux mensuels (revenus / dépenses / charges)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={projection.slice(1)} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v/1000)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="revenus" name="Revenus" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="charges" name="Charges" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Projection table */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Détail mois par mois</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-2 font-medium text-gray-500 text-xs">Mois</th>
              <th className="pb-2 font-medium text-gray-500 text-xs text-right">Revenus</th>
              <th className="pb-2 font-medium text-gray-500 text-xs text-right">Dépenses</th>
              <th className="pb-2 font-medium text-gray-500 text-xs text-right">Charges</th>
              <th className="pb-2 font-medium text-gray-500 text-xs text-right">Net</th>
              <th className="pb-2 font-medium text-gray-500 text-xs text-right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {projection.map((row, i) => (
              <tr key={i} className={`border-b border-gray-50 ${row.solde < settings.seuilAlerte && i > 0 ? 'bg-orange-50' : ''}`}>
                <td className="py-2 font-medium text-gray-700">{row.label}</td>
                <td className="py-2 text-right text-green-600">{i === 0 ? '—' : fmt(row.revenus)}</td>
                <td className="py-2 text-right text-red-600">{i === 0 ? '—' : fmt(row.depenses)}</td>
                <td className="py-2 text-right text-orange-600">{i === 0 ? '—' : fmt(row.charges)}</td>
                <td className={`py-2 text-right font-medium ${i > 0 && row.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {i === 0 ? '—' : (row.net >= 0 ? '+' : '') + fmt(row.net)}
                </td>
                <td className={`py-2 text-right font-bold ${row.solde >= settings.seuilAlerte ? 'text-gray-900' : 'text-orange-600'}`}>
                  {fmt(row.solde)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
