import { useEffect } from "react";
import { useStore } from "../store/store.jsx";

export default function Modal() {
  const { modal, closeModal } = useStore();
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeModal]);
  if (!modal) return null;
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains("modal-overlay")) closeModal(); }}>
      {modal}
    </div>
  );
}

/** Reusable modal frame used by feature modals. */
export function ModalFrame({ title, children, footer, lg = true }) {
  const { closeModal } = useStore();
  return (
    <div className={"modal" + (lg ? " modal--lg" : "")}>
      <header className="modal__head"><h3>{title}</h3><button className="iconbtn" onClick={closeModal}>✕</button></header>
      <div className="modal__body">
        {children}
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
