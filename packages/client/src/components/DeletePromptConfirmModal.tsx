import React from 'react';

interface DeletePromptConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoveToTrash: () => void;
  onDeleteAnyway: () => void;
  title: string;
  message: string;
}

const DeletePromptConfirmModal: React.FC<DeletePromptConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onMoveToTrash,
    onDeleteAnyway,
    title, 
    message, 
}) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
        onClick={onClose}
    >
      <div 
        className="bg-theme-secondary rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-theme-default mb-4">{title}</h2>
        <p className="text-theme-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md bg-theme-tertiary hover:bg-theme-hover text-theme-default font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onMoveToTrash} 
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            Move to Trash
          </button>
          <button 
            onClick={onDeleteAnyway} 
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
          >
            Delete Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePromptConfirmModal;