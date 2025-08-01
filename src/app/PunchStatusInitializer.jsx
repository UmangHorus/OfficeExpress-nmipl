'use client';

import { usePunchStatus } from "@/hooks/usePunchStatus";
import { usePunchStore } from "@/stores/punch.store";

const PunchStatusInitializer = () => {
  const { attrId } = usePunchStore();
  usePunchStatus(attrId);
  return null;
};

export default PunchStatusInitializer;