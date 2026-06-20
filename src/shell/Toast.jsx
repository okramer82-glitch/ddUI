import { useStore } from "../store/store.jsx";

export default function Toast() {
  const { toast } = useStore();
  return <div className={"toast" + (toast ? " is-show" : "")} hidden={!toast}>{toast}</div>;
}
