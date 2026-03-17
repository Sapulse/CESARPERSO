import { startOfMonth, endOfMonth, addMonths, isSameMonth, parseISO, isWithinInterval } from 'date-fns';

// Expand recurring items into a flat list of monthly amounts
export function getMonthlyAmount(item, targetDate) {
  const itemDate = parseISO(item.date);
  const target = new Date(targetDate);

  switch (item.frequence) {
    case 'mensuelle':
      return item.montant;
    case 'trimestrielle': {
      const monthDiff = (target.getFullYear() - itemDate.getFullYear()) * 12
        + (target.getMonth() - itemDate.getMonth());
      return monthDiff >= 0 && monthDiff % 3 === 0 ? item.montant : 0;
    }
    case 'annuelle': {
      const sameMonth = target.getMonth() === itemDate.getMonth();
      const sameYear = target.getFullYear() >= itemDate.getFullYear();
      const yearDiff = target.getFullYear() - itemDate.getFullYear();
      return sameYear && sameMonth && yearDiff >= 0 ? item.montant : 0;
    }
    case 'ponctuelle':
    default:
      return isSameMonth(itemDate, target) ? item.montant : 0;
  }
}

export function calcRevenusForMonth(revenus, date) {
  return revenus.reduce((sum, r) => sum + getMonthlyAmount(r, date), 0);
}

export function calcDepensesForMonth(depenses, date) {
  return depenses.reduce((sum, d) => sum + getMonthlyAmount(d, date), 0);
}

export function calcChargesForMonth(revenus, date, tauxCharges) {
  const totalRevenus = calcRevenusForMonth(revenus, date);
  const totalTaux = tauxCharges
    .filter(t => t.actif)
    .reduce((sum, t) => sum + t.taux, 0);
  return totalRevenus * (totalTaux / 100);
}

export function calcDisponibleReel(revenus, depenses, date, tauxCharges) {
  const rev = calcRevenusForMonth(revenus, date);
  const dep = calcDepensesForMonth(depenses, date);
  const charges = calcChargesForMonth(revenus, date, tauxCharges);
  return rev - dep - charges;
}

// Calculate average monthly expenses over last N months
export function calcMoyenneDepenses(depenses, mois = 3) {
  const now = new Date();
  let total = 0;
  for (let i = 0; i < mois; i++) {
    const targetDate = addMonths(now, -i);
    total += calcDepensesForMonth(depenses, targetDate);
  }
  return total / mois;
}

// Autonomy: how many months can we last with current balance
export function calcAutonomie(soldeActuel, depenses, revenus, tauxCharges) {
  const moyDep = calcMoyenneDepenses(depenses, 3);
  const now = new Date();
  const charges = calcChargesForMonth(revenus, now, tauxCharges);
  const depensesNettes = moyDep + charges;
  if (depensesNettes <= 0) return Infinity;
  return Math.max(0, soldeActuel / depensesNettes);
}

// Build projection array for N months ahead
export function buildProjection(revenus, depenses, settings, nMois = 6) {
  const { soldeInitial, tauxCharges } = settings;
  const now = new Date();

  // Start from current balance
  let solde = soldeInitial;

  const result = [];
  for (let i = 0; i <= nMois; i++) {
    const targetDate = addMonths(now, i);
    const label = targetDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

    if (i === 0) {
      result.push({ label, solde, revenus: 0, depenses: 0, charges: 0, net: 0 });
      continue;
    }

    const rev = calcRevenusForMonth(revenus, targetDate);
    const dep = calcDepensesForMonth(depenses, targetDate);
    const charges = calcChargesForMonth(revenus, targetDate, tauxCharges);
    const net = rev - dep - charges;
    solde = solde + net;

    result.push({
      label,
      solde: Math.round(solde),
      revenus: Math.round(rev),
      depenses: Math.round(dep),
      charges: Math.round(charges),
      net: Math.round(net),
    });
  }
  return result;
}

// Get expenses grouped by category for a given month
export function calcDepensesParCategorie(depenses, categories, date) {
  const result = {};
  categories.forEach(cat => { result[cat.id] = { ...cat, total: 0 }; });

  depenses.forEach(dep => {
    const amount = getMonthlyAmount(dep, date);
    if (amount > 0) {
      if (result[dep.categorie]) {
        result[dep.categorie].total += amount;
      }
    }
  });

  return Object.values(result)
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);
}

// Calculate current month stats
export function calcCurrentMonthStats(revenus, depenses, settings) {
  const now = new Date();
  const { tauxCharges, soldeInitial } = settings;

  const revenusMois = calcRevenusForMonth(revenus, now);
  const depensesMois = calcDepensesForMonth(depenses, now);
  const chargesMois = calcChargesForMonth(revenus, now, tauxCharges);
  const disponible = revenusMois - depensesMois - chargesMois;
  const moyenneDepenses = calcMoyenneDepenses(depenses, 3);
  const autonomie = calcAutonomie(soldeInitial, depenses, revenus, tauxCharges);

  return {
    revenusMois,
    depensesMois,
    chargesMois,
    disponible,
    moyenneDepenses,
    autonomie,
    soldeInitial,
  };
}

export function fmt(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}
