import { useState } from 'react';
import Navigation from './components/shared/Navigation';
import Dashboard from './pages/Dashboard';
import Revenus from './pages/Revenus';
import Depenses from './pages/Depenses';
import Previsionnel from './pages/Previsionnel';
import Parametres from './pages/Parametres';
import Import from './pages/Import';
import { useAppData } from './hooks/useAppData';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const data = useAppData();

  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Connexion à Firebase…</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            revenus={data.revenus}
            depenses={data.depenses}
            settings={data.settings}
            categories={data.categories}
            comptes={data.comptes}
            transactions={data.transactions}
            onNavigate={setPage}
          />
        );
      case 'revenus':
        return (
          <Revenus
            revenus={data.revenus}
            addRevenu={data.addRevenu}
            updateRevenu={data.updateRevenu}
            deleteRevenu={data.deleteRevenu}
            transactions={data.transactions}
            comptes={data.comptes}
            categories={data.categories}
            updateTransaction={data.updateTransaction}
          />
        );
      case 'depenses':
        return (
          <Depenses
            depenses={data.depenses}
            categories={data.categories}
            settings={data.settings}
            updateSettings={data.updateSettings}
            addDepense={data.addDepense}
            updateDepense={data.updateDepense}
            deleteDepense={data.deleteDepense}
            transactions={data.transactions}
            comptes={data.comptes}
            updateTransaction={data.updateTransaction}
          />
        );
      case 'previsionnel':
        return (
          <Previsionnel
            revenus={data.revenus}
            depenses={data.depenses}
            settings={data.settings}
            categories={data.categories}
          />
        );
      case 'import':
        return (
          <Import
            comptes={data.comptes}
            transactions={data.transactions}
            importTransactions={data.importTransactions}
            updateTransaction={data.updateTransaction}
            deleteTransaction={data.deleteTransaction}
            categories={data.categories}
            rules={data.rules}
            onNavigate={setPage}
          />
        );
      case 'parametres':
        return (
          <Parametres
            settings={data.settings}
            updateSettings={data.updateSettings}
            categories={data.categories}
            addCategory={data.addCategory}
            updateCategory={data.updateCategory}
            deleteCategory={data.deleteCategory}
            comptes={data.comptes}
            addCompte={data.addCompte}
            updateCompte={data.updateCompte}
            deleteCompte={data.deleteCompte}
            rules={data.rules}
            addRule={data.addRule}
            deleteRule={data.deleteRule}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Navigation currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {renderPage()}
      </main>
    </div>
  );
}
