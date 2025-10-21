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
        className="bg-theme-secondary rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border border-theme-default"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start mb-5">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-theme-default">{title}</h2>
            <p className="text-theme-secondary mt-2">{message}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row-reverse gap-3">
          <button 
            onClick={onDeleteAnyway} 
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Permanently
          </button>
          
          <button 
            onClick={onMoveToTrash} 
            className="px-5 py-2.5 rounded-lg bg-theme-primary hover:bg-theme-primary-light text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Move to Trash
          </button>
          
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg bg-theme-tertiary hover:bg-theme-hover text-theme-default font-medium transition-colors border border-theme-default flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePromptConfirmModal;