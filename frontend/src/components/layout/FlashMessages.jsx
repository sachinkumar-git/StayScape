import { useFlash } from "../../context/FlashContext.jsx";

export default function FlashMessages() {
  const { messages, dismiss } = useFlash();

  return messages.map((message) => (
    <div key={message.id} className={`alert alert-${message.type === "error" ? "danger" : "success"} alert-dismissible fade show flash`} role="alert">
      <i className={`fa-solid ${message.type === "error" ? "fa-circle-exclamation" : "fa-circle-check"} me-2`} aria-hidden="true"></i>
      {` ${message.message} `}
      <button type="button" className="btn-close" aria-label="Close" onClick={() => dismiss(message.id)}></button>
    </div>
  ));
}
