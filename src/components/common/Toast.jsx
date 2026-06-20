import { useEffect, useState } from 'react';

/**
 * Toast de notificacion emergente.
 * Se destruye automaticamente a los `duration` ms.
 *
 * Uso:
 *   <Toast message="Texto" type="info" onClose={() => setToast(null)} />
 *
 * type: 'info' | 'success' | 'warning'
 */
export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Frame de entrada para que la animacion CSS dispare
    const show = requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 350); // espera que termine la animacion de salida
    }, duration);

    return () => {
      cancelAnimationFrame(show);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const styles = {
    info:    'bg-navy  border-coral/40  text-sand',
    success: 'bg-success border-success/40 text-white',
    warning: 'bg-warning border-warning/40 text-white'
  };

  const icons = {
    info: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    ),
    success: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    warning: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    )
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[100] flex max-w-sm items-start gap-3
        rounded-xl border px-5 py-4 shadow-2xl
        transition-all duration-300 ease-out
        ${styles[type] || styles.info}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icons[type] || icons.info}
      </svg>

      <div className="flex-1">
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>

      <button
        type="button"
        onClick={() => { setVisible(false); setTimeout(onClose, 350); }}
        className="ml-1 shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100"
        aria-label="Cerrar"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
