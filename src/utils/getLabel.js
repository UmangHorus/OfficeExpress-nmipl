// src/utils/getLabel.js
export const getContactLabel = (navConfig) => {
  return navConfig?.labels?.contacts || "Contact";
};

export const getLeadLabel = (navConfig) => {
  return navConfig?.labels?.leads || "Lead";
};
