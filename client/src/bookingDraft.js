import { create } from "zustand";

const STORAGE_KEY = "smarttutor.bookingDraft";
const initialDraft = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");

// The Book Session flow spans two screens (Figma 9:163 -> 10:2). The hand-rolled
// router carries neither query strings nor navigation state, so the draft picked
// on the tutor profile is held here until step 3 confirms or clears it.
export const useBookingDraft = create((set) => ({
  draft: initialDraft,
  setDraft: (draft) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    set({ draft });
  },
  clearDraft: () => {
    sessionStorage.removeItem(STORAGE_KEY);
    set({ draft: null });
  }
}));
