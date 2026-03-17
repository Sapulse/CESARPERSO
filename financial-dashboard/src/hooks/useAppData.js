import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, remove, update, get } from 'firebase/database';
import { db } from '../firebase';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../utils/defaults';

// Convert Firebase object { id1: {...}, id2: {...} } → array [{ id, ...}, ...]
function toArray(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([id, value]) => ({ ...value, id }));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Sample data injected on first load
function getSampleRevenus() {
  const m = new Date().toISOString().slice(0, 7);
  return [
    { id: uid(), libelle: "Mission client A", montant: 3500, date: `${m}-01`, frequence: 'mensuelle', type: 'ca', note: '' },
    { id: uid(), libelle: "Mission client B", montant: 1200, date: `${m}-15`, frequence: 'ponctuelle', type: 'client', note: 'Facture projet web' },
  ];
}

function getSampleDepenses() {
  const m = new Date().toISOString().slice(0, 7);
  return [
    { id: uid(), libelle: "Loyer", montant: 900, date: `${m}-01`, frequence: 'mensuelle', categorie: 'logement', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Courses alimentation", montant: 350, date: `${m}-01`, frequence: 'mensuelle', categorie: 'alimentation', type: 'variable', nature: 'perso', note: '' },
    { id: uid(), libelle: "Téléphone", montant: 25, date: `${m}-01`, frequence: 'mensuelle', categorie: 'telephone', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Internet", montant: 40, date: `${m}-01`, frequence: 'mensuelle', categorie: 'internet', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Abonnements", montant: 30, date: `${m}-01`, frequence: 'mensuelle', categorie: 'abonnements', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Transport", montant: 120, date: `${m}-01`, frequence: 'mensuelle', categorie: 'transport', type: 'variable', nature: 'perso', note: '' },
    { id: uid(), libelle: "Mutuelle", montant: 80, date: `${m}-01`, frequence: 'mensuelle', categorie: 'assurance', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Logiciel compta", montant: 20, date: `${m}-01`, frequence: 'mensuelle', categorie: 'depenses_pro', type: 'fixe', nature: 'pro', note: '' },
  ];
}

export function useAppData() {
  const [revenus, setRevenus] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Init : seed sample data only on very first visit (using a persistent flag)
  useEffect(() => {
    const init = async () => {
      const snap = await get(ref(db, 'initialized'));

      if (!snap.exists()) {
        // First visit only : write sample data + defaults + flag
        const sampleRevenus = getSampleRevenus();
        const sampleDepenses = getSampleDepenses();
        const batch = {};
        sampleRevenus.forEach(r => { batch[`revenus/${r.id}`] = r; });
        sampleDepenses.forEach(d => { batch[`depenses/${d.id}`] = d; });
        batch['settings'] = DEFAULT_SETTINGS;
        DEFAULT_CATEGORIES.forEach(c => { batch[`categories/${c.id}`] = c; });
        batch['initialized'] = true;
        await update(ref(db), batch);
      }

      // Real-time listeners
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
        setLoading(false);
      });

      return () => {
        unsubRevenus();
        unsubDepenses();
        unsubSettings();
        unsubCategories();
      };
    };

    let cleanup = () => {};
    init().then(fn => { if (fn) cleanup = fn; });
    return () => cleanup();
  }, []);

  // --- Revenus CRUD ---
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

  // --- Depenses CRUD ---
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

  // --- Settings ---
  const updateSettings = useCallback((data) => {
    update(ref(db, 'settings'), data);
  }, []);

  // --- Categories CRUD ---
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

  return {
    loading,
    revenus, addRevenu, updateRevenu, deleteRevenu,
    depenses, addDepense, updateDepense, deleteDepense,
    settings, updateSettings,
    categories, addCategory, updateCategory, deleteCategory,
  };
}
