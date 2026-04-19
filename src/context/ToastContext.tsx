import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let _id = 0;
const SHOW_MS  = 3000;   // visible duration
const FADE_MS  = 400;    // fade-out duration

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, msg, type, visible: true }]);

    // Start fade-out after SHOW_MS
    const t = setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
      // Remove from DOM after fade completes
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), FADE_MS);
    }, SHOW_MS);

    timers.current.set(id, t);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium min-w-[240px] max-w-[360px]
              ${toast.type === "success" ? "bg-[#1A1A1A] text-white"
                : toast.type === "error"   ? "bg-red-600 text-white"
                :                            "bg-[#2382AA] text-white"}`}
            style={{
              transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
              opacity: toast.visible ? 1 : 0,
              transform: toast.visible ? "translateY(0)" : "translateY(8px)",
            }}
          >
            {/* Icon */}
            {toast.type === "success" && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
            )}
            {toast.type === "error" && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </span>
            )}
            {toast.type === "info" && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </span>
            )}
            <span className="flex-1">{toast.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
