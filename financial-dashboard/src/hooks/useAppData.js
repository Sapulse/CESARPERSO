import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../utils/defaults';

const KEYS = {
  revenus: 'fp_revenus',
  depenses: 'fp_depenses',
  settings: 'fp_settings',
  categories: 'fp_categories',
  initialized: 'fp_initialized',
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

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
  const [revenus, setRevenus] = useState(() => {
    if (!localStorage.getItem(KEYS.initialized)) return [];
    return load(KEYS.revenus, []);
  });

  const [depenses, setDepenses] = useState(() => {
    if (!localStorage.getItem(KEYS.initialized)) return [];
    return load(KEYS.depenses, []);
  });

  const [settings, setSettings] = useState(() =>
    load(KEYS.settings, DEFAULT_SETTINGS)
  );

  const [categories, setCategories] = useState(() =>
    load(KEYS.categories, DEFAULT_CATEGORIES)
  );

  const [loading, setLoading] = useState(true);

  // Seed sample data on very first visit
  useEffect(() => {
    if (!localStorage.getItem(KEYS.initialized)) {
      const sampleRevenus = getSampleRevenus();
      const sampleDepenses = getSampleDepenses();
      save(KEYS.revenus, sampleRevenus);
      save(KEYS.depenses, sampleDepenses);
      save(KEYS.settings, DEFAULT_SETTINGS);
      save(KEYS.categories, DEFAULT_CATEGORIES);
      localStorage.setItem(KEYS.initialized, 'true');
      setRevenus(sampleRevenus);
      setDepenses(sampleDepenses);
    }
    setLoading(false);
  }, []);

  // Persist to localStorage on every change
  useEffect(() => { if (!loading) save(KEYS.revenus, revenus); }, [revenus, loading]);
  useEffect(() => { if (!loading) save(KEYS.depenses, depenses); }, [depenses, loading]);
  useEffect(() => { if (!loading) save(KEYS.settings, settings); }, [settings, loading]);
  useEffect(() => { if (!loading) save(KEYS.categories, categories); }, [categories, loading]);

  // --- Revenus CRUD ---
  const addRevenu = useCallback((data) => {
    const id = uid();
    setRevenus(prev => [...prev, { ...data, id }]);
  }, []);

  const updateRevenu = useCallback((id, data) => {
    setRevenus(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  }, []);

  const deleteRevenu = useCallback((id) => {
    setRevenus(prev => prev.filter(r => r.id !== id));
  }, []);

  // --- Depenses CRUD ---
  const addDepense = useCallback((data) => {
    const id = uid();
    setDepenses(prev => [...prev, { ...data, id }]);
  }, []);

  const updateDepense = useCallback((id, data) => {
    setDepenses(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  }, []);

  const deleteDepense = useCallback((id) => {
    setDepenses(prev => prev.filter(d => d.id !== id));
  }, []);

  // --- Settings ---
  const updateSettings = useCallback((data) => {
    setSettings(prev => ({ ...prev, ...data }));
  }, []);

  // --- Categories CRUD ---
  const addCategory = useCallback((data) => {
    const id = uid();
    setCategories(prev => [...prev, { ...data, id }]);
  }, []);

  const updateCategory = useCallback((id, data) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    loading,
    revenus, addRevenu, updateRevenu, deleteRevenu,
    depenses, addDepense, updateDepense, deleteDepense,
    settings, updateSettings,
    categories, addCategory, updateCategory, deleteCategory,
  };
}
