"use client";

import { useEffect } from "react";

export function ClearCartOnSuccess() {
  useEffect(() => {
    if (window.localStorage.getItem("waptek-cart-pending-clear") === "1") {
      window.localStorage.removeItem("waptek-cart");
      window.localStorage.removeItem("waptek-cart-pending-clear");
    }
  }, []);

  return null;
}
