import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerVariant?: 'coral' | 'teal';
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  headerVariant = 'coral',
  children,
  footer,
  maxWidth = 520,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const headerClass = headerVariant === 'coral' ? 'modal-header-coral' : 'modal-header-teal';

  const modalElement = (
    <div
      className="modal-backdrop"
      style={{
        pointerEvents: 'auto',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-content"
        style={{
          maxWidth,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={headerClass}>
          <h2 style={{ fontSize: '1.35rem', margin: 0 }}>{title}</h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close dialog"
            style={{
              background: 'rgba(0,0,0,0.18)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-paper)',
              cursor: 'pointer',
              transition: 'background var(--motion-fast) ease',
              pointerEvents: 'auto',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ pointerEvents: 'auto' }}>
          {children}
        </div>

        {footer && (
          <div className="modal-footer" style={{ pointerEvents: 'auto' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalElement, document.body);
  }

  return modalElement;
};
