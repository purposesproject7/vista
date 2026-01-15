import React, { createContext, useContext, useState, useEffect } from "react";

const AdminContext = createContext();

export const useAdminContext = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error("useAdminContext must be used within an AdminProvider");
    }
    return context;
};

export const AdminProvider = ({ children }) => {
    const [academicContext, setAcademicContext] = useState(() => {
        try {
            const stored = localStorage.getItem("adminAcademicContext");
            return stored ? JSON.parse(stored) : { school: "", program: "", year: "" };
        } catch (error) {
            console.error("Failed to parse admin context from localStorage", error);
            return { school: "", program: "", year: "" };
        }
    });

    // Persist to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem("adminAcademicContext", JSON.stringify(academicContext));
        } catch (error) {
            console.error("Failed to save admin context to localStorage", error);
        }
    }, [academicContext]);

    const updateAcademicContext = (newContext) => {
        setAcademicContext((prev) => ({
            ...prev,
            ...newContext,
        }));
    };

    const clearAcademicContext = () => {
        setAcademicContext({ school: "", program: "", year: "" });
        localStorage.removeItem("adminAcademicContext");
    };

    const value = {
        academicContext,
        updateAcademicContext,
        clearAcademicContext,
    };

    return (
        <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
    );
};
