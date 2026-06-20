import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { loadDB, saveDB, resetDB } from "../api/server.js";

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // React node or null
  const [ui, setUi] = useState({}); // transient view state (dock inspectors, folder tab…)
  const toastTimer = useRef(null);

  useEffect(() => { loadDB().then((d) => { setDb(d); setLoading(false); }); }, []);

  /* Mutate the DB via an Immer-style producer, optimistic, then persist. */
  const update = useCallback((producer) => {
    setDb((prev) => {
      const next = structuredClone(prev);
      producer(next);
      setSaving(true);
      saveDB(next).finally(() => setSaving(false));
      return next;
    });
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const openModal = useCallback((node) => setModal(node), []);
  const closeModal = useCallback(() => setModal(null), []);

  const reset = useCallback(async () => {
    setLoading(true);
    const fresh = await resetDB();
    setDb(fresh); setLoading(false);
    showToast("Database reset from db.json");
  }, [showToast]);

  return (
    <StoreCtx.Provider value={{ db, loading, saving, update, toast, showToast, modal, openModal, closeModal, reset, ui, setUi }}>
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => useContext(StoreCtx);
export const useDB = () => useContext(StoreCtx).db;
