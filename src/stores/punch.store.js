import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState = {
  punchIn: false,
  punchOut: false,
  breakIn: false,
  breakOut: false,
  attrId: null,
  breakId: null,
  empInTime: "",
  empOutTime: "",
};

export const usePunchStore = create(
  persist(
    (set) => ({
      ...initialState,
      setPunchIn: (value) => set({ punchIn: value }),
      setPunchOut: (value) => set({ punchOut: value }),
      setBreakIn: (value) => set({ breakIn: value }),
      setBreakOut: (value) => set({ breakOut: value }),
      setAttrId: (value) => set({ attrId: value }),
      setBreakId: (value) => set({ breakId: value }),
      setEmpInTime: (value) => set({ empInTime: value }),
      setEmpOutTime: (value) => set({ empOutTime: value }),
      resetAttendance: () => set(initialState),
      employeePunchoutReset: () =>
        set({
          ...initialState,
          punchIn: true,
        }),
    }),
    {
      name: "punch-storage",
      partialize: (state) => ({
        punchIn: state.punchIn,
        punchOut: state.punchOut,
        breakIn: state.breakIn,
        breakOut: state.breakOut,
        attrId: state.attrId,
        breakId: state.breakId,
        empInTime: state.empInTime,
        empOutTime: state.empOutTime,
      }),
    }
  )
);