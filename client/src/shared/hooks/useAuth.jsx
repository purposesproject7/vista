import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Re-export AuthProvider for backward compatibility in imports (optional but risky for HMR if we want to solve it completely)
// To solve HMR issue, we should NOT export component from here.
// So I will NOT re-export AuthProvider here.
