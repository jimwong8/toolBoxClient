import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast as RBToast, ToastContainer } from 'react-bootstrap';
import './index.scss';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
    return id;
  }, [removeToast]);

  const showSuccess = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const showError = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const showWarning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const showInfo = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer className="toast-container">
        {toasts.map((t) => (
          <RBToast
            key={t.id}
            onClose={() => removeToast(t.id)}
            className={`toast-item toast-${t.type}`}
            delay={3000}
            autohide
          >
            <RBToast.Header closeButton>
              <span className="toast-header-text">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
              <span className="toast-header-title">{t.type.charAt(0).toUpperCase() + t.type.slice(1)}</span>
            </RBToast.Header>
            <RBToast.Body>{t.message}</RBToast.Body>
          </RBToast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
