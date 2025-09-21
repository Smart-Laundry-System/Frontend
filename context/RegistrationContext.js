import React, { createContext, useContext, useMemo, useState } from "react";

const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  // Single source of truth for the whole registration flow
  const [basicInfo, setBasicInfo] = useState({
    // Step 1 (UserRegistre)
    laundryName: "",
    email: "",
    password: "",
    address: "",
    phone: "",
    phone2: "",
    role: "LAUNDRY",

    // Step 1 output (names only)
    // e.g. ["Ironing", "Dry Clean"] or [{ name/title,... }]
    selectedOptions: [],

    // Step 2 (with prices) — normalized shape
    // [{ title: "Ironing", price: "120" }, ...]
    services: [],

    // Step 2 selections
    availableItems: [],   // combined list (types + cloths + user's "others")
    otherItems: [],       // raw "others" inputs (optional to keep)
    laundryImageUrl: "",  // single uploaded laundry image absolute URL

    // NEW: Business hours (send to backend as "HH:mm")
    openTime: "",         // e.g. "09:00"
    closeTime: "",        // e.g. "21:00"

    // Final step
    about: "",            // "About the laundry" / message
  });

  // ---- helpers ----
  // Merge a patch into basicInfo (preferred way to update)
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
