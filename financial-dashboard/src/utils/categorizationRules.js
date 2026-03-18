/**
 * Auto-categorization rules for bank transaction labels.
 *
 * Architecture:
 *  - DEFAULT_RULES: built-in rules, never modified by the user.
 *    Each entry covers one category with a list of keywords.
 *  - customRules (from Firebase): user-defined rules, [{id, keyword, categoryId}].
 *    Checked first — they have higher priority than DEFAULT_RULES.
 *  - guessCategory(libelle, customRules): returns a categoryId or 'a_classer'.
 *
 * To add a built-in rule: append a keyword to the relevant entry in DEFAULT_RULES.
 * To let users add rules without code: use the Paramètres → Règles UI.
 */

export const DEFAULT_RULES = [
  // ── Alimentation ─────────────────────────────────────────────
  {
    categoryId: 'alimentation',
    keywords: [
      'leclerc', 'e.leclerc', 'carrefour', 'lidl', 'intermarche',
      'aldi', 'monoprix', 'franprix', 'casino supermarche', 'super u',
      'hyper u', 'netto', 'picard', 'biocoop', 'la vie claire',
      'grand frais', 'spar', 'simply market', 'auchan', 'geant casino',
      'colruyt', 'cora', 'systeme u', 'thiriet', 'day by day',
      'naturalia', 'greenweez',
    ],
  },

  // ── Restaurants & livraison ───────────────────────────────────
  {
    categoryId: 'restaurants',
    keywords: [
      'uber eats', 'ubereats', 'deliveroo', 'just eat', 'justeat',
      'mcdonald', 'mcdo', 'burger king', 'quick burger', 'five guys',
      'dominos', 'pizza hut', 'papa johns', 'restaurant', 'brasserie',
      'bistrot', 'pizzeria', 'sushi', 'wok', 'ramen', 'subway',
      'kebab', 'snack', 'boulangerie paul', 'brioche doree',
    ],
  },

  // ── Téléphone mobile ──────────────────────────────────────────
  {
    categoryId: 'telephone',
    keywords: [
      'free mobile', 'orange mobile', 'sfr mobile', 'bouygues telecom',
      'sosh', 'red by sfr', 'coriolis', 'la poste mobile',
      'b&you', 'prixtel', 'omo mobile',
    ],
  },

  // ── Internet / Box ────────────────────────────────────────────
  {
    categoryId: 'internet',
    keywords: [
      'freebox', 'free haut debit', 'livebox', 'orange internet',
      'bbox', 'sfr box', 'numericable', 'bouygues internet',
      'fibre optique',
    ],
  },

  // ── Transport ─────────────────────────────────────────────────
  {
    categoryId: 'transport',
    keywords: [
      'sncf', 'ratp', 'navigo', 'uber trip', 'uber b.v', 'bolt.eu',
      'vtc', 'totalenergies', 'total station', 'shell', 'bp station',
      'esso', 'q8', 'vinci autoroutes', 'sanef', 'aprr', 'cofiroute',
      'parking', 'indigo park', 'saemes', 'blablacar',
      'ouigo', 'tgv', 'izy', 'flixbus', 'transdev', 'keolis',
      'velib', 'lime mobility', 'tier mobilite',
    ],
  },

  // ── Charges sociales / fiscales ───────────────────────────────
  {
    categoryId: 'charges_sociales',
    keywords: [
      'urssaf', 'cipav', 'cotisation retraite', 'ag2r', 'malakoff',
      'audiens', 'pro btp', 'cnbf', 'rsi cotisation',
    ],
  },

  // ── Assurance ─────────────────────────────────────────────────
  {
    categoryId: 'assurance',
    keywords: [
      'axa assurance', 'macif', 'maif', 'matmut', 'allianz',
      'groupama', 'generali', 'swisslife', 'harmonie mutuelle',
      'mutuelle obligatoire', 'prevoyance', 'mgen', 'mnf prevoyance',
    ],
  },

  // ── Abonnements numériques ────────────────────────────────────
  {
    categoryId: 'abonnements',
    keywords: [
      'netflix', 'spotify', 'amazon prime', 'amazon video',
      'deezer', 'disney+', 'disney plus', 'canal+', 'canal plus',
      'apple music', 'apple tv', 'youtube premium', 'adobe',
      'microsoft 365', 'office 365', 'dropbox', 'icloud storage',
      'google one', 'audible', 'kindle unlimited', 'beinsports',
    ],
  },

  // ── Énergie ───────────────────────────────────────────────────
  {
    categoryId: 'energie',
    keywords: [
      'edf', 'engie', 'direct energie', 'eni gas', 'ekwateur',
      'ohm energie', 'vattenfall', 'yello energie',
      'veolia eau', 'suez eau', 'eau potable',
    ],
  },

  // ── Santé ─────────────────────────────────────────────────────
  {
    categoryId: 'sante',
    keywords: [
      'pharmacie', 'medecin', 'docteur', 'dentiste',
      'ophtalmologue', 'kinesitherapie', 'hopital', 'clinique',
      'laboratoire', 'radiologie', 'cpam remb', 'secu remb',
    ],
  },

  // ── Logement ──────────────────────────────────────────────────
  {
    categoryId: 'logement',
    keywords: [
      'loyer', 'syndic copro', 'charges copro', 'agence immo',
      'ikea', 'leroy merlin', 'castorama', 'brico depot',
      'mr bricolage', 'bricomarche', 'homeserve',
    ],
  },

  // ── Loisirs ───────────────────────────────────────────────────
  {
    categoryId: 'loisirs',
    keywords: [
      'cinema', 'theatre', 'concert', 'musee', 'fnac', 'cultura',
      'decathlon', 'intersport', 'go sport', 'salle de sport',
      'fitness', 'basic fit', 'gymlib', 'escape game',
    ],
  },

  // ── Dépenses pro ──────────────────────────────────────────────
  {
    categoryId: 'depenses_pro',
    keywords: [
      'amazon business', 'office depot', 'lyreco',
      'malt ', 'stripe', 'paypal', 'coworking',
      'formation professionnelle', 'indy compta',
    ],
  },
];

// ─── Normalize helper ─────────────────────────────────────────────────────────
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Guess a category for a bank transaction libelle.
 *
 * @param {string} libelle  - Raw transaction label from the bank
 * @param {Array}  customRules - User-defined rules from Firebase [{keyword, categoryId}]
 * @returns {string} categoryId — 'a_classer' if nothing matches
 */
export function guessCategory(libelle, customRules = []) {
  const normalized = normalize(libelle);

  // 1. Custom rules first (user-defined, higher priority)
  for (const rule of customRules) {
    if (rule.keyword && normalized.includes(normalize(rule.keyword))) {
      return rule.categoryId;
    }
  }

  // 2. Built-in rules
  for (const rule of DEFAULT_RULES) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(normalize(keyword))) {
        return rule.categoryId;
      }
    }
  }

  return 'a_classer';
}

/**
 * Returns a flat array of all built-in rules as {keyword, categoryId}.
 * Useful for display in the UI.
 */
export function getDefaultRulesFlat() {
  return DEFAULT_RULES.flatMap(rule =>
    rule.keywords.map(keyword => ({ keyword, categoryId: rule.categoryId }))
  );
}
