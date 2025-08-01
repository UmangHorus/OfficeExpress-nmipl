import { create } from 'zustand';

export const useLeadContactStore = create((set) => ({
  leadContact: null,
  setLeadContact: (contact_id, contact_type) => set({ leadContact: { contact_id, contact_type } }),
  clearLeadContact: () => set({ leadContact: null }),
}));