"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ContactModal } from "@/components/modals/contact-modal";

interface ContactModalContextValue {
  /** Optionally pass a service key to show its details in the modal. */
  openContactModal: (service?: string) => void;
  closeContactModal: () => void;
}

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<string | null>(null);

  const openContactModal = useCallback((serviceKey?: string) => {
    setService(serviceKey ?? null);
    setOpen(true);
  }, []);
  const closeContactModal = useCallback(() => setOpen(false), []);

  return (
    <ContactModalContext.Provider value={{ openContactModal, closeContactModal }}>
      {children}
      <ContactModal open={open} service={service} onClose={closeContactModal} />
    </ContactModalContext.Provider>
  );
}

export function useContactModal(): ContactModalContextValue {
  const ctx = useContext(ContactModalContext);
  if (!ctx) {
    throw new Error("useContactModal must be used within ContactModalProvider");
  }
  return ctx;
}
