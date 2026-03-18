import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, remove, update, get } from 'firebase/database';
import { db } from '../firebase';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_COMPTES } from '../utils/defaults';

function toArray(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([id, value]) => ({ ...value, id }));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getSampleRevenus() {
  const m = new Date().toISOString().slice(0, 7);
  return [
    { id: uid(), libelle: 'Mission client A', montant: 3500, date: `${m}-01`, frequence: 'mensuelle', type: 'ca', note: '' },
    { id: uid(), libelle: 'Mission client B', montant: 1200, date: `${m}-15`, frequence: 'ponctuelle', type: 'client', note: 'Facture projet web' },
  ];
}

function getSampleDepenses() {
  const m = new Date().toISOString().slice(0, 7);
  return [
    { id: uid(), libelle: 'Loyer', montant: 900, date: `${m}-01`, frequence: 'mensuelle', categorie: 'logement', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: 'Courses alimentation', montant: 350, date: `${m}-01`, frequence: 'mensuelle', categorie: 'alimentation', type: 'variable', nature: 'perso', note: '' },
    { id: uid(), libelle: 'Téléphone', montant: 25, date: `${m}-01`, frequence: 'mensuelle', categorie: 'telephone', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: 'Internet', montant: 40, date: `${m}-01`, frequence: 'mensuelle', categorie: 'internet', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: 'Abonnements', montant: 30, date: `${m}-01`, frequence: 'mensuelle', categorie: 'abonnements', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: 'Transport', montant: 120, date: `${m}-01`, frequence: 'mensuelle', categorie: 'transport', type: 'variable', nature: 'perso', note: '' },
    { id: uid(), libelle: 'Mutuelle', montant: 80, date: `${m}-01`, frequence: 'mensuelle', categorie: 'assurance', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: 'Logiciel compta', montant: 20, date: `${m}-01`, frequence: 'mensuelle', categorie: 'depenses_pro', type: 'fixe', nature: 'pro', note: '' },
  ];
}

export function useAppData() {
  const [revenus, setRevenus] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [comptes, setComptes] = useState(DEFAULT_COMPTES);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cleanup = () => {};

    const init = async () => {
      try {
        const snap = await get(ref(db, 'initialized'));

        if (!snap.exists()) {
          const sampleRevenus = getSampleRevenus();
          const sampleDepenses = getSampleDepenses();
          const batch = {};
          sampleRevenus.forEach(r => { batch[`revenus/${r.id}`] = r; });
          sampleDepenses.forEach(d => { batch[`depenses/${d.id}`] = d; });
          batch['settings'] = DEFAULT_SETTINGS;
          DEFAULT_CATEGORIES.forEach(c => { batch[`categories/${c.id}`] = c; });
          DEFAULT_COMPTES.forEach(c => { batch[`comptes/${c.id}`] = c; });
          batch['initialized'] = true;
          await update(ref(db), batch);
        } else {
          // Seed comptes for existing installs if missing
          const comptesSnap = await get(ref(db, 'comptes'));
          if (!comptesSnap.exists()) {
            const batch = {};
            DEFAULT_COMPTES.forEach(c => { batch[`comptes/${c.id}`] = c; });
            await update(ref(db), batch);
          }
        }

        const unsubRevenus = onValue(ref(db, 'revenus'), (s) => {
          setRevenus(toArray(s.val()));
        });

        const unsubDepenses = onValue(ref(db, 'depenses'), (s) => {
          setDepenses(toArray(s.val()));
        });

        const unsubSettings = onValue(ref(db, 'settings'), (s) => {
          if (s.exists()) setSettings(s.val());
        });

        const unsubCategories = onValue(ref(db, 'categories'), (s) => {
          setCategories(toArray(s.val()));
        });

        const unsubComptes = onValue(ref(db, 'comptes'), (s) => {
          const arr = toArray(s.val());
          setComptes(arr.length > 0 ? arr : DEFAULT_COMPTES);
        });

        const unsubTransactions = onValue(ref(db, 'transactions'), (s) => {
          setTransactions(toArray(s.val()));
          setLoading(false);
        });

        return () => {
          unsubRevenus();
          unsubDepenses();
          unsubSettings();
          unsubCategories();
          unsubComptes();
          unsubTransactions();
        };
      } catch (err) {
        console.error('Firebase init error:', err);
        setLoading(false);
      }
    };

    init().then(fn => { if (fn) cleanup = fn; });
    return () => cleanup();
  }, []);

  // ── Revenus ──────────────────────────────────────────────────
  const addRevenu = useCallback((data) => {
    const id = uid();
    set(ref(db, `revenus/${id}`), { ...data, id });
  }, []);

  const updateRevenu = useCallback((id, data) => {
    update(ref(db, `revenus/${id}`), data);
  }, []);

  const deleteRevenu = useCallback((id) => {
    remove(ref(db, `revenus/${id}`));
  }, []);

  // ── Depenses ─────────────────────────────────────────────────
  const addDepense = useCallback((data) => {
    const id = uid();
    set(ref(db, `depenses/${id}`), { ...data, id });
  }, []);

  const updateDepense = useCallback((id, data) => {
    update(ref(db, `depenses/${id}`), data);
  }, []);

  const deleteDepense = useCallback((id) => {
    remove(ref(db, `depenses/${id}`));
  }, []);

  // ── Settings ──────────────────────────────────────────────────
  const updateSettings = useCallback((data) => {
    update(ref(db, 'settings'), data);
  }, []);

  // ── Categories ────────────────────────────────────────────────
  const addCategory = useCallback((data) => {
    const id = uid();
    set(ref(db, `categories/${id}`), { ...data, id });
  }, []);

  const updateCategory = useCallback((id, data) => {
    update(ref(db, `categories/${id}`), data);
  }, []);

  const deleteCategory = useCallback((id) => {
    remove(ref(db, `categories/${id}`));
  }, []);

  // ── Comptes ───────────────────────────────────────────────────
  const addCompte = useCallback((data) => {
    const id = uid();
    set(ref(db, `comptes/${id}`), { ...data, id });
  }, []);

  const updateCompte = useCallback((id, data) => {
    update(ref(db, `comptes/${id}`), data);
  }, []);

  const deleteCompte = useCallback((id) => {
    remove(ref(db, `comptes/${id}`));
  }, []);

  // ── Transactions ──────────────────────────────────────────────
  const updateTransaction = useCallback((id, data) => {
    update(ref(db, `transactions/${id}`), data);
  }, []);

  const deleteTransaction = useCallback((id) => {
    remove(ref(db, `transactions/${id}`));
  }, []);

  /**
   * Batch-import transactions, skipping duplicates by hash.
   * Returns the number of rows actually saved.
   */
  const importTransactions = useCallback(async (rows) => {
    const existingSnap = await get(ref(db, 'transactions'));
    const existing = toArray(existingSnap.val());
    const existingHashes = new Set(existing.map(t => t.hash));

    const batch = {};
    let count = 0;
    rows.forEach(row => {
      if (existingHashes.has(row.hash)) return;
      const id = uid();
      batch[`transactions/${id}`] = { ...row, id };
      count++;
    });

    if (count > 0) {
      await update(ref(db), batch);
    }
    return count;
  }, []);

  return {
    loading,
    revenus, addRevenu, updateRevenu, deleteRevenu,
    depenses, addDepense, updateDepense, deleteDepense,
    settings, updateSettings,
    categories, addCategory, updateCategory, deleteCategory,
    comptes, addCompte, updateCompte, deleteCompte,
    transactions, updateTransaction, deleteTransaction, importTransactions,
  };
}
