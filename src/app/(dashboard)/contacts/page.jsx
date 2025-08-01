"use client";
import ContactList from "@/components/contacts/ContactsList";
import { useLoginStore } from "@/stores/auth.store";

export default function ContactsListPage() {
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">{contactLabel}</h1>
      <ContactList />
    </div>
  );
}
