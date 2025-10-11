"use client";

import { createContext, useContext } from "react";

interface FormsContextValue {
  switchTab?: (value: string) => void;
}

const FormsContext = createContext<FormsContextValue>({});

export function FormsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: FormsContextValue;
}) {
  return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
}

export function useFormsContext() {
  return useContext(FormsContext);
}

