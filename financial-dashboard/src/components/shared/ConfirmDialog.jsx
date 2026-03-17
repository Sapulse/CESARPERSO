import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmer', message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => { onConfirm(); onClose(); }}>
          Supprimer
        </button>
      </div>
    </Modal>
  );
}
