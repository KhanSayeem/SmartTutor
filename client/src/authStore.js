import { create } from "zustand";

const initialUser = JSON.parse(localStorage.getItem("smarttutor.user") || "null");

export const useAuthStore = create((set) => ({
  user: initialUser,
  token: localStorage.getItem("smarttutor.token"),
  setSession: ({ token, user }) => {
    localStorage.setItem("smarttutor.token", token);
    localStorage.setItem("smarttutor.user", JSON.stringify(user));
    set({ token, user });
  },
  updateUser: (user) => {
    localStorage.setItem("smarttutor.user", JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("smarttutor.token");
    localStorage.removeItem("smarttutor.user");
    set({ token: null, user: null });
  }
}));
