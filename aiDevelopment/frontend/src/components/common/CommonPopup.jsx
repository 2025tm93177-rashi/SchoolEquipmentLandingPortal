import React from "react";
import "./CommonPopup.css";

const CommonPopup = ({ 
  message, 
  isOpen, 
  onClose, 
  buttonText = "OK", 
  type = "info",
  confirm = false,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (!confirm) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className={`popup-icon popup-icon-${type}`}>
          {type === "success" && "✓"}
          {type === "error" && "✕"}
          {type === "warning" && "⚠"}
          {type === "info" && "ℹ"}
        </div>
        <div className="popup-message">{message}</div>
        {confirm ? (
          <div className="popup-buttons-group">
            <button className="popup-button popup-button-cancel" onClick={onClose}>
              {cancelText}
            </button>
            <button className={`popup-button popup-button-${type}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        ) : (
          <button className={`popup-button popup-button-${type}`} onClick={onClose}>
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default CommonPopup;

