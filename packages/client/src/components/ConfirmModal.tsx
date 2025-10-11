import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel' 
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
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
