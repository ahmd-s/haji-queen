"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "@/components/admin/ui";

type UnsavedState = { dirty: boolean; message: string };

type UnsavedContextValue = {
  setUnsaved: (dirty: boolean, message?: string) => void;
};

const DEFAULT_MESSAGE = "You have unsaved changes. Leave this page without saving?";
const UnsavedContext = createContext<UnsavedContextValue>({
  setUnsaved: () => undefined,
});

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UnsavedState>({ dirty: false, message: DEFAULT_MESSAGE });
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const setUnsaved = useCallback((dirty: boolean, message = DEFAULT_MESSAGE) => {
    setState({ dirty, message });
  }, []);

  useEffect(() => {
    if (!state.dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.target === "_blank" || link.hasAttribute("download")) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [state.dirty]);

  const leave = () => {
    const href = pendingHref;
    setPendingHref(null);
    setState({ dirty: false, message: DEFAULT_MESSAGE });
    if (href) window.location.assign(href);
  };

  const value = useMemo(() => ({ setUnsaved }), [setUnsaved]);
  return (
    <UnsavedContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={pendingHref !== null}
        title="Leave without saving?"
        description={state.message}
        confirmLabel="Leave page"
        tone="danger"
        onConfirm={leave}
        onCancel={() => setPendingHref(null)}
      />
    </UnsavedContext.Provider>
  );
}

export function useUnsavedChanges(dirty: boolean, message?: string) {
  const { setUnsaved } = useContext(UnsavedContext);
  useEffect(() => {
    setUnsaved(dirty, message ?? DEFAULT_MESSAGE);
    return () => setUnsaved(false);
  }, [dirty, message, setUnsaved]);
}
