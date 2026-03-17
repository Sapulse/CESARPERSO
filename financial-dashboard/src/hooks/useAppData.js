import { useState, useCallback } from 'react';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../utils/defaults';

const STORAGE_KEYS = {
  revenus: 'fp_revenus',
  depenses: 'fp_depenses',
  settings: 'fp_settings',
  categories: 'fp_categories',
};

function load(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Sample data for first visit
function getSampleRevenus() {
  const now = new Date();
  const m = now.toISOString().slice(0, 7);
  return [
    { id: uid(), libelle: "Mission client A", montant: 3500, date: `${m}-01`, frequence: 'mensuelle', type: 'ca', note: '' },
    { id: uid(), libelle: "Mission client B", montant: 1200, date: `${m}-15`, frequence: 'ponctuelle', type: 'client', note: 'Facture projet web' },
  ];
}

function getSampleDepenses() {
  const now = new Date();
  const m = now.toISOString().slice(0, 7);
  return [
    { id: uid(), libelle: "Loyer", montant: 900, date: `${m}-01`, frequence: 'mensuelle', categorie: 'logement', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Courses alimentation", montant: 350, date: `${m}-01`, frequence: 'mensuelle', categorie: 'alimentation', type: 'variable', nature: 'perso', note: '' },
    { id: uid(), libelle: "Téléphone", montant: 25, date: `${m}-01`, frequence: 'mensuelle', categorie: 'telephone', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Internet", montant: 40, date: `${m}-01`, frequence: 'mensuelle', categorie: 'internet', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Abonnements (Netflix, Spotify...)", montant: 30, date: `${m}-01`, frequence: 'mensuelle', categorie: 'abonnements', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Transport / carburant", montant: 120, date: `${m}-01`, frequence: 'mensuelle', categorie: 'transport', type: 'variable', nature: 'perso', note: '' },
    { id: uid(), libelle: "Mutuelle", montant: 80, date: `${m}-01`, frequence: 'mensuelle', categorie: 'assurance', type: 'fixe', nature: 'perso', note: '' },
    { id: uid(), libelle: "Logiciel compta", montant: 20, date: `${m}-01`, frequence: 'mensuelle', categorie: 'depenses_pro', type: 'fixe', nature: 'pro', note: '' },
    { id: uid(), libelle: "Restaurant client", montant: 85, date: `${m}-10`, frequence: 'ponctuelle', categorie: 'restaurants', type: 'ponctuelle', nature: 'pro', note: '' },
  ];
}

export function useAppData() {
  const [revenus, setRevenus] = useState(() => {
    const stored = load(STORAGE_KEYS.revenus, null);
    if (!stored) { const s = getSampleRevenus(); save(STORAGE_KEYS.revenus, s); return s; }
    return stored;
  });

  const [depenses, setDepenses] = useState(() => {
    const stored = load(STORAGE_KEYS.depenses, null);
    if (!stored) { const s = getSampleDepenses(); save(STORAGE_KEYS.depenses, s); return s; }
    return stored;
  });

  const [settings, setSettings] = useState(() => load(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  const [categories, setCategories] = useState(() => load(STORAGE_KEYS.categories, DEFAULT_CATEGORIES));

  // --- Revenus CRUD ---
  const addRevenu = useCallback((data) => {
    const item = { ...data, id: uid() };
    setRevenus(prev => { const next = [...prev, item]; save(STORAGE_KEYS.revenus, next); return next; });
  }, []);

  const updateRevenu = useCallback((id, data) => {
    setRevenus(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...data } : r);
      save(STORAGE_KEYS.revenus, next);
      return next;
    });
  }, []);

  const deleteRevenu = useCallback((id) => {
    setRevenus(prev => { const next = prev.filter(r => r.id !== id); save(STORAGE_KEYS.revenus, next); return next; });
  }, []);

  // --- Depenses CRUD ---
  const addDepense = useCallback((data) => {
    const item = { ...data, id: uid() };
    setDepenses(prev => { const next = [...prev, item]; save(STORAGE_KEYS.depenses, next); return next; });
  }, []);

  const updateDepense = useCallback((id, data) => {
    setDepenses(prev => {
      const next = prev.map(d => d.id === id ? { ...d, ...data } : d);
      save(STORAGE_KEYS.depenses, next);
      return next;
    });
  }, []);

  const deleteDepense = useCallback((id) => {
    setDepenses(prev => { const next = prev.filter(d => d.id !== id); save(STORAGE_KEYS.depenses, next); return next; });
  }, []);

  // --- Settings ---
  const updateSettings = useCallback((data) => {
    setSettings(prev => { const next = { ...prev, ...data }; save(STORAGE_KEYS.settings, next); return next; });
  }, []);

  // --- Categories CRUD ---
  const addCategory = useCallback((data) => {
    const item = { ...data, id: uid() };
    setCategories(prev => { const next = [...prev, item]; save(STORAGE_KEYS.categories, next); return next; });
  }, []);

  const updateCategory = useCallback((id, data) => {
    setCategories(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...data } : c);
      save(STORAGE_KEYS.categories, next);
      return next;
    });
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => { const next = prev.filter(c => c.id !== id); save(STORAGE_KEYS.categories, next); return next; });
  }, []);

  return {
    revenus, addRevenu, updateRevenu, deleteRevenu,
    depenses, addDepense, updateDepense, deleteDepense,
    settings, updateSettings,
    categories, addCategory, updateCategory, deleteCategory,
  };
}
