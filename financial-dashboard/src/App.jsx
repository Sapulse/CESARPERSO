import { useState } from 'react';
import Navigation from './components/shared/Navigation';
import Dashboard from './pages/Dashboard';
import Revenus from './pages/Revenus';
import Depenses from './pages/Depenses';
import Previsionnel from './pages/Previsionnel';
import Parametres from './pages/Parametres';
import { useAppData } from './hooks/useAppData';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const data = useAppData();

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            revenus={data.revenus}
            depenses={data.depenses}
            settings={data.settings}
            categories={data.categories}
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
          />
        );
      case 'depenses':
        return (
          <Depenses
            depenses={data.depenses}
            categories={data.categories}
            addDepense={data.addDepense}
            updateDepense={data.updateDepense}
            deleteDepense={data.deleteDepense}
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
      case 'parametres':
        return (
          <Parametres
            settings={data.settings}
            updateSettings={data.updateSettings}
            categories={data.categories}
            addCategory={data.addCategory}
            updateCategory={data.updateCategory}
            deleteCategory={data.deleteCategory}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Navigation currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}
