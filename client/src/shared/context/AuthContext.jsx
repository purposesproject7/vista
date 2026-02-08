import React, { useState, useEffect, createContext } from "react";
import api from "../../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in (check token in localStorage)
        const token = localStorage.getItem("authToken");
        if (token) {
            verifyToken();
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async () => {
        try {
            const response = await api.get("/auth/profile");
            if (response.data.success) {
                setUser(response.data.data);
            } else {
                localStorage.removeItem("authToken");
            }
        } catch (err) {
            console.error("Token verification failed:", err);
            localStorage.removeItem("authToken");
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await api.post("/auth/login", {
                emailId: credentials.emailId || credentials.email,
                password: credentials.password,
            });

            if (response.data.success) {
                const { token, data } = response.data;
                localStorage.setItem("authToken", token);
                setUser(data);
                return { user: data, token };
            } else {
                throw new Error(response.data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("authToken");
            setUser(null);
        }
    };

    const isSudoAdmin = () => {
        return user?.employeeId === "ADMIN001";
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isSudoAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
