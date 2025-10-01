import React, { createContext, useContext, useMemo, useState } from "react";

const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  const [isSwitchOn, setIsSwitchOn] = useState(true);
  const [laundryId, setLaundryId] = useState(null);
  const [basicInfo, setBasicInfo] = useState({
    laundryName: "",
    email: "",
    password: "",
    address: "",
    phone: "",
    phone2: "",
    role: "LAUNDRY",
    selectedOptions: [],
    services: [],
    availableItems: [],   
    otherItems: [],       
    laundryImageUrl: "",  
    openTime: "", 
    closeTime: "",
    about: "",   
  });
  
  const updateBasicInfo = (patch = {}) =>
    setBasicInfo((prev) => ({ ...(prev ?? {}), ...patch }));

  // Upsert one service price by title (keeps the array normalized)
  const upsertServicePrice = (title, price) =>
    setBasicInfo((prev) => {
      const list = Array.isArray(prev.services) ? prev.services : [];
      const idx = list.findIndex((s) => s.title === title);
      const next =
        idx >= 0
          ? list.map((s, i) => (i === idx ? { ...s, price } : s))
          : [...list, { title, price }];
      return { ...prev, services: next };
    });

  // Clear everything (useful after successful signup / logout)
  const resetAll = () => {
    setIsSwitchOn(false);
    setBasicInfo({
      laundryName: "",
      email: "",
      password: "",
      address: "",
      phone: "",
      phone2: "",
      role: "LAUNDRY",
      selectedOptions: [],
      services: [],
      availableItems: [],
      otherItems: [],
      laundryImageUrl: "",
      openTime: "",
      closeTime: "",
      about: "",
    });
  };

  const value = useMemo(
    () => ({
      isSwitchOn,
      setIsSwitchOn,

      basicInfo,
      setBasicInfo,       // raw setter (use sparingly)
      updateBasicInfo,    // merge helper (preferred)
      upsertServicePrice, // convenience for pricing

      laundryId,
      setLaundryId,
      resetAll,
    }),
    [isSwitchOn, basicInfo]
  );

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration must be used within a RegistrationProvider");
  return ctx;
}
