// src/core/components/Modal/Modal.tsx
import { useEffect as useEffect2, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// src/utils/cn.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/hooks/useBodyScrollLock.ts
import { useEffect } from "react";
var lockCount = 0;
var originalOverflow = "";
function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;
    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount++;
    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [isLocked]);
}

// src/core/components/Modal/Modal.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var ModalHeader = ({
  className,
  children,
  onClose,
  showCloseButton = true,
  ...props
}) => /* @__PURE__ */ jsxs("div", { className: cn("flex items-start justify-between px-6 py-4 border-b border-border-base", className), ...props, children: [
  /* @__PURE__ */ jsx("div", { className: "flex-1 pr-4", children }),
  showCloseButton && onClose && /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "p-1 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer",
      "aria-label": "\u0110\xF3ng",
      children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
    }
  )
] });
ModalHeader.displayName = "ModalHeader";
var ModalTitle = ({ className, children, ...props }) => /* @__PURE__ */ jsx("h3", { className: cn("text-lg font-semibold text-content-main leading-6", className), ...props, children });
ModalTitle.displayName = "ModalTitle";
var ModalDescription = ({ className, children, ...props }) => /* @__PURE__ */ jsx("p", { className: cn("text-sm text-content-muted mt-1", className), ...props, children });
ModalDescription.displayName = "ModalDescription";
var ModalBody = ({ className, children, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("p-6 overflow-y-auto flex-1 max-h-[calc(90vh-140px)]", className), ...props, children });
ModalBody.displayName = "ModalBody";
var ModalFooter = ({ className, children, ...props }) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "border-t border-border-base px-6 py-4 bg-surface-subtle/50 flex items-center justify-end gap-3",
      className
    ),
    ...props,
    children
  }
);
ModalFooter.displayName = "ModalFooter";
var Modal = ({
  isOpen,
  onClose,
  title,
  description,
  footer,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className,
  overlayClassName,
  ariaLabel
}) => {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  useBodyScrollLock(isOpen);
  useEffect2(() => {
    if (!isOpen || typeof window === "undefined") return;
    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      dialogRef.current?.focus();
    }, 50);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, closeOnEsc, onClose]);
  if (!isOpen || typeof document === "undefined") return null;
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] h-[90vh]"
  };
  return createPortal(
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto",
        role: "presentation",
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in",
                overlayClassName
              ),
              onClick: closeOnOverlayClick ? onClose : void 0,
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxs(
            "div",
            {
              ref: dialogRef,
              role: "dialog",
              "aria-modal": "true",
              "aria-label": ariaLabel,
              "aria-labelledby": title ? titleId : void 0,
              "aria-describedby": description ? descId : void 0,
              tabIndex: -1,
              className: cn(
                "relative w-full rounded-theme bg-surface-card border border-border-base shadow-2xl z-10 flex flex-col overflow-hidden outline-none",
                "animate-in fade-in zoom-in-95 duration-200",
                sizeClasses[size],
                className
              ),
              onClick: (e) => e.stopPropagation(),
              children: [
                (title || description || showCloseButton) && /* @__PURE__ */ jsxs(ModalHeader, { onClose, showCloseButton, children: [
                  title && /* @__PURE__ */ jsx(ModalTitle, { id: titleId, children: title }),
                  description && /* @__PURE__ */ jsx(ModalDescription, { id: descId, children: description })
                ] }),
                children && /* @__PURE__ */ jsx(ModalBody, { children }),
                footer && /* @__PURE__ */ jsx(ModalFooter, { children: footer })
              ]
            }
          )
        ]
      }
    ),
    document.body
  );
};
Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Description = ModalDescription;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
export {
  Modal as Dialog,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle
};
