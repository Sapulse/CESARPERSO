export const DEFAULT_CATEGORIES = [
  { id: 'logement', name: 'Logement', color: '#6366f1' },
  { id: 'alimentation', name: 'Alimentation', color: '#f59e0b' },
  { id: 'restaurants', name: 'Restaurants', color: '#f97316' },
  { id: 'transport', name: 'Transport', color: '#3b82f6' },
  { id: 'telephone', name: 'Téléphone', color: '#8b5cf6' },
  { id: 'internet', name: 'Internet', color: '#06b6d4' },
  { id: 'energie', name: 'Énergie', color: '#eab308' },
  { id: 'assurance', name: 'Assurance', color: '#10b981' },
  { id: 'sante', name: 'Santé', color: '#ef4444' },
  { id: 'abonnements', name: 'Abonnements', color: '#ec4899' },
  { id: 'loisirs', name: 'Loisirs', color: '#14b8a6' },
  { id: 'imprevus', name: 'Imprévus', color: '#64748b' },
  { id: 'achats_exceptionnels', name: 'Achats exceptionnels', color: '#a855f7' },
  { id: 'depenses_pro', name: 'Dépenses pro', color: '#0ea5e9' },
  { id: 'charges_sociales', name: 'Charges sociales / fiscales', color: '#dc2626' },
];

export const DEFAULT_SETTINGS = {
  soldeInitial: 5000,
  tauxCharges: [
    { id: 'urssaf', label: 'URSSAF', taux: 22, actif: true },
    { id: 'ir', label: 'Impôt sur le revenu (provision)', taux: 15, actif: true },
  ],
  seuilAlerte: 1000,
  horizonProjection: 6,
  budgetsCibles: {},
};

export const FREQUENCES = [
  { value: 'ponctuelle', label: 'Ponctuelle' },
  { value: 'mensuelle', label: 'Mensuelle' },
  { value: 'trimestrielle', label: 'Trimestrielle' },
  { value: 'annuelle', label: 'Annuelle' },
];

export const TYPES_DEPENSE = [
  { value: 'fixe', label: 'Fixe' },
  { value: 'variable', label: 'Variable' },
  { value: 'ponctuelle', label: 'Ponctuelle' },
];

export const NATURES = [
  { value: 'perso', label: 'Perso' },
  { value: 'pro', label: 'Pro' },
];

export const TYPES_REVENU = [
  { value: 'ca', label: "Chiffre d'affaires" },
  { value: 'client', label: 'Paiement client' },
  { value: 'autre', label: 'Autre rentrée' },
];

export const DEFAULT_COMPTES = [
  {
    id: 'compte_principal',
    nom: 'Compte courant',
    banque: 'Banque principale',
    type: 'courant',
    couleur: '#3b82f6',
    solde: 0,
    actif: true,
  },
];

export const TYPES_COMPTE = [
  { value: 'courant', label: 'Compte courant' },
  { value: 'epargne', label: 'Épargne' },
  { value: 'pro', label: 'Professionnel' },
  { value: 'joint', label: 'Compte joint' },
];
