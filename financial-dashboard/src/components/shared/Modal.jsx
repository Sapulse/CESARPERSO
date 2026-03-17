import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md', confirmClose = false }) {
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) { setShowConfirm(false); return; }
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  function handleClose() {
    if (confirmClose) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }

  if (!open) return null;

  const sizeClass = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className={`relative bg-white w-full ${sizeClass} rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
          <button onClick={handleClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {children}
        </div>
      </div>

      {/* Confirmation de fermeture */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Fermer sans sauvegarder ?</h4>
                <p className="text-sm text-gray-500">Les modifications non enregistrées seront perdues.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="btn-secondary px-4 py-2 text-sm"
                onClick={() => setShowConfirm(false)}
              >
                Rester
              </button>
              <button
                className="btn bg-red-600 text-white hover:bg-red-700 px-4 py-2 text-sm rounded-lg"
                onClick={() => { setShowConfirm(false); onClose(); }}
              >
                Fermer quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
