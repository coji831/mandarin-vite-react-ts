/**
 * Modal Component — Generic overlay dialog
 *
 * A controlled modal dialog with backdrop, close on Escape/backdrop click,
 * size variants, and header/footer slots. No business domain dependencies.
 */
import { useEffect, useCallback, type ReactNode } from "react";
import { Box, Button } from "shared/components";
import "./Modal.css";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

export function Modal({ isOpen, onClose, title, children, footer, size = "md" }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop flex-center fixed" onClick={onClose} role="presentation">
      <Box
        variant="card"
        className={`modal flex-col gap-sm overflow-hidden modal--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
      >
        <Box variant="header" className="modal__header flex items-center justify-between">
          {title && <h2 className="modal__title font-md fw-600 text-secondary m-0">{title}</h2>}
          <Button variant="icon" onClick={onClose} aria-label="Close dialog">
            ✕
          </Button>
        </Box>
        <Box variant="divider" className="modal-section-divider" />
        <div className="modal__body flex-1">{children}</div>

        {footer && (
          <>
            <Box variant="divider" className="modal-section-divider" />
            <Box variant="header" className="modal__footer flex items-center gap-xs">
              {footer}
            </Box>
          </>
        )}
      </Box>
    </div>
  );
}
