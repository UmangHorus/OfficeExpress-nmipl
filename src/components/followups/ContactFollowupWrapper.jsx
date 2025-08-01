// src/components/followups/ContactFollowupWrapper.jsx
"use client";

import { useLoginStore } from "@/stores/auth.store";
import ContactFollowup from "@/components/followups/ContactFollowup";

export default function ContactFollowupWrapper() {
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">{contactLabel} Followups</h1>
      <ContactFollowup />
    </>
  );
}
