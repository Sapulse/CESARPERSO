import { LayoutDashboard, TrendingUp, TrendingDown, BarChart2, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'revenus', label: 'Revenus', icon: TrendingUp },
  { id: 'depenses', label: 'Dépenses', icon: TrendingDown },
  { id: 'previsionnel', label: 'Prévisionnel', icon: BarChart2 },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

export default function Navigation({ currentPage, onNavigate }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 min-h-screen py-6 px-3 shrink-0">
        <div className="px-3 mb-8">
          <h1 className="text-lg font-bold text-gray-900">💼 FinPilot</h1>
          <p className="text-xs text-gray-400 mt-0.5">Pilotage financier</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                currentPage === id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 flex">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-all ${
              currentPage === id ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] leading-tight">{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
