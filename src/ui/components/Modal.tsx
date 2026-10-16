import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { text } from './text';
import './modal.css';

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal${wide ? ' modal-wide' : ''}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label={text('common.close')}
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow modal-kicker">COIN CLICKER</span>
        <h2 id={titleId}>{title}</h2>
        {subtitle && <p className="muted modal-subtitle">{subtitle}</p>}
        {children}
      </div>
    </dialog>
  );
}
