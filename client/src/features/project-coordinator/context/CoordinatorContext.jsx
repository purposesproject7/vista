import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../../../shared/hooks/useAuth";

const CoordinatorContext = createContext();

export const useCoordinatorContext = () => {
    const context = useContext(CoordinatorContext);
    if (!context) {
        throw new Error(
            "useCoordinatorContext must be used within a CoordinatorProvider"
        );
    }
    return context;
};

/**
 * School + program the coordinator is working in: the one picked in the
 * Program dropdown (one of their own assignments), falling back to the login
 * (primary) assignment until something is picked. Send these with every
 * coordinator API call; the server acts as the matching assignment.
 */
export const useCoordinatorScope = () => {
    const { academicContext } = useCoordinatorContext();
    const { user } = useAuth();
    return {
        school: academicContext.school || user?.school,
        program: academicContext.program || user?.program,
        academicYear: academicContext.academicYearSemester || user?.academicYear,
    };
};

export const CoordinatorProvider = ({ children }) => {
    const [academicContext, setAcademicContext] = useState(() => {
        try {
            const stored = localStorage.getItem("coordinatorAcademicContext");
            return stored ? JSON.parse(stored) : { academicYearSemester: "" };
        } catch (error) {
            console.error(
                "Failed to parse coordinator context from localStorage",
                error
            );
            return { academicYearSemester: "" };
        }
    });

    // Persist to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem(
                "coordinatorAcademicContext",
                JSON.stringify(academicContext)
            );
        } catch (error) {
            console.error(
                "Failed to save coordinator context to localStorage",
                error
            );
        }
    }, [academicContext]);

    const updateAcademicContext = (newContext) => {
        setAcademicContext((prev) => ({
            ...prev,
            ...newContext,
        }));
    };

    const value = {
        academicContext,
        updateAcademicContext,
    };

    return (
        <CoordinatorContext.Provider value={value}>
            {children}
        </CoordinatorContext.Provider>
    );
};
