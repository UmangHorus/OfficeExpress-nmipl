import { create } from "zustand";

const useBasicSettingsStore = create((set) => ({
  countries: [],
  titles: [],
  maincompany_id: "",
  maincompanyname: "",
  mainbranch_id: "",
  mainbranchname: "",
  loading: false,
  error: null,

  // Action to update all settings
  setBasicSettings: (data) =>
    set({
      countries: data.countries || [],
      titles: data.titles || [],
      maincompany_id: data.maincompany_id || {},
      maincompanyname: data.maincompanyname || {},
      mainbranch_id: data.mainbranch_id || {},
      mainbranchname: data.mainbranchname || {},
      loading: false,
      error: null,
    }),

  // Individual setters
  //   setCountries: (countries) => set({ countries }),
  //   setStates: (states) => set({ states }),
  //   setOtherSettings: (otherSettings) => set({ otherSettings }),

  // Loading/error states
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  // Reset state
  reset: () =>
    set({
      countries: [],
      titles: [],
      maincompany_id: "",
      maincompanyname: "",
      mainbranch_id: "",
      mainbranchname: "",
      loading: false,
      error: null,
    }),
}));

export default useBasicSettingsStore;
