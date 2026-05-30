"use client";

/**
 * AuthContext.js
 * Unified React Context and Session Provider for VoiceKhata.
 * Orchestrates Firebase authentication states, secure JWT validation,
 * routing protections, and persistent storage synchronization.
 */

"use strict";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Session Restoration on Boot
  useEffect(() => {
    async function restoreSession() {
      if (typeof window === "undefined") return;

      // Theme restore on boot
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark-theme");
      } else if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark-theme");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
          document.body.classList.add("dark-theme");
        } else {
          document.documentElement.classList.remove("dark");
          document.body.classList.remove("dark-theme");
        }
      }

      const savedToken = localStorage.getItem("voicekhata_token");

      if (savedToken) {
        try {
          console.log("[Auth Provider] Persistent session token detected. Validating...");
          
          // Apply token temporarily to API client before verify-me fetch
          localStorage.setItem("voicekhata_token", savedToken);
          setToken(savedToken);

          const response = await apiClient.getMe();
          if (response.success && response.data.user) {
            setUser(response.data.user);
            console.log(`[Auth Provider] Session restored for merchant: ${response.data.user.shopName || "New User"}`);
          } else {
            throw new Error("Invalid session profile");
          }
        } catch (err) {
          console.warn("[Auth Provider] Session restoration failed. Clearing stale credentials:", err.message);
          clearSession();
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  // 2. Protected Route Redirect Guards
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/", "/login", "/terms", "/privacy"];
    const isPublic = publicRoutes.includes(pathname);

    if (!user && !isPublic) {
      console.warn(`[Protected Route] Unauthenticated access to "${pathname}" blocked. Redirecting to landing.`);
      window.location.href = "/";
    } else if (user && user.onboardingIncomplete && !isPublic) {
      console.warn(`[Protected Route] Onboarding incomplete access to "${pathname}" blocked. Redirecting to landing.`);
      window.location.href = "/";
    } else if (user && isPublic) {
      if (user.onboardingIncomplete) {
        console.log("[Auth Provider] User onboarding incomplete. Directing to setup.");
      } else {
        console.log(`[Auth Provider] Authenticated merchant active. Redirecting "${pathname}" → "/dashboard".`);
        window.location.href = "/dashboard";
      }
    }
  }, [user, loading, pathname]);

  const clearSession = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("voicekhata_token");
      localStorage.removeItem("merchant_profile");
      localStorage.removeItem("is_authenticated");
    }
    setUser(null);
    setToken(null);
  };

  /**
   * loginWithFirebaseToken(idToken)
   * Verifies Firebase token with backend and sets up signed JWT session.
   */
  const loginWithFirebaseToken = async (idToken) => {
    try {
      setLoading(true);
      const response = await apiClient.verifyToken(idToken);
      
      if (response.success && response.data) {
        const { token: sessionToken, user: profile } = response.data;
        
        localStorage.setItem("voicekhata_token", sessionToken);
        localStorage.setItem("merchant_profile", JSON.stringify(profile));
        localStorage.setItem("is_authenticated", "true");
        
        setToken(sessionToken);
        setUser(profile);
        setLoading(false);
        return profile;
      } else {
        throw new Error(response.message || "Token verification rejected");
      }
    } catch (err) {
      clearSession();
      setLoading(false);
      throw err;
    }
  };

  /**
   * completeMerchantOnboarding(profileData)
   * Submits customization choices and transitions user state to live dashboard.
   */
  const completeMerchantOnboarding = async (profileData) => {
    try {
      setLoading(true);
      const response = await apiClient.completeOnboarding(profileData);
      
      if (response.success && response.data.user) {
        const updatedUser = response.data.user;
        localStorage.setItem("merchant_profile", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setLoading(false);
        return updatedUser;
      } else {
        throw new Error(response.message || "Failed to save customization details");
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    console.log("[Auth Provider] Logging out merchant...");
    clearSession();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithFirebaseToken,
        completeMerchantOnboarding,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be called inside an AuthProvider");
  }
  return context;
}
