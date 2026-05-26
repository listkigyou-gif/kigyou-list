"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export interface User {
  email: string;
  name: string;
  role: "free" | "trial" | "pro" | "business" | "enterprise";
}

export type KanbanStage = "未連絡" | "連絡済み" | "商談中" | "成約";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  logout: () => void;
  upgradeUserPlan: (plan: "free" | "pro" | "business" | "enterprise", couponCode?: string) => Promise<boolean>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  // MyList
  savedCompanies: string[];
  toggleSaveCompany: (corpNum: string) => void;
  isCompanySaved: (corpNum: string) => boolean;
  // Kanban Stages
  kanbanStages: Record<string, KanbanStage>;
  updateKanbanStage: (corpNum: string, stage: KanbanStage) => void;
  // Google Auth
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedCompanies, setSavedCompanies] = useState<string[]>([]);
  const [kanbanStages, setKanbanStages] = useState<Record<string, KanbanStage>>({});
  const [mounted, setMounted] = useState(false);

  const syncUserPlan = async (email: string) => {
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quota && data.quota.plan) {
          setUser(prev => {
            if (prev && prev.email === email && prev.role !== data.quota.plan) {
              return { ...prev, role: data.quota.plan };
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error("Failed to sync user plan", e);
    }
  };

  // Sync NextAuth session
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      const email = session.user.email;
      setUser(prev => {
        if (prev && prev.email === email) return prev;
        return {
          email,
          name: session.user?.name || email.split("@")[0],
          role: "free",
        };
      });
      syncUserPlan(email);
    } else if (status === "unauthenticated" && mounted) {
      setUser(null);
    }
  }, [session, status, mounted]);

  // Sync state from localStorage on mount (hydration safe)
  useEffect(() => {
    const storedUser = localStorage.getItem("kigyou_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Sync plan in background
        syncUserPlan(parsed.email);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    const storedSaved = localStorage.getItem("kigyou_saved");
    if (storedSaved) {
      try {
        setSavedCompanies(JSON.parse(storedSaved));
      } catch (e) {
        console.error("Failed to parse saved companies", e);
      }
    }

    const storedKanban = localStorage.getItem("kigyou_kanban");
    if (storedKanban) {
      try {
        setKanbanStages(JSON.parse(storedKanban));
      } catch (e) {
        console.error("Failed to parse kanban stages", e);
      }
    }

    setMounted(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!mounted) return;
    if (user) {
      localStorage.setItem("kigyou_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("kigyou_user");
    }
  }, [user, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("kigyou_saved", JSON.stringify(savedCompanies));
  }, [savedCompanies, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("kigyou_kanban", JSON.stringify(kanbanStages));
  }, [kanbanStages, mounted]);

  const logout = () => {
    setUser(null);
    signOut();
  };

  const loginWithGoogle = () => {
    signIn("google");
  };

  const upgradeUserPlan = async (plan: "free" | "pro" | "business" | "enterprise", couponCode?: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch("/api/user/upgrade-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, plan, couponCode })
      });
      if (res.ok) {
        setUser({ ...user, role: plan });
        // Trigger quota update in other components (e.g. Header)
        setTimeout(() => {
          window.dispatchEvent(new Event("quotaUpdated"));
        }, 100);
        return true;
      }
    } catch (e) {
      console.error("Failed to upgrade plan", e);
    }
    return false;
  };

  const toggleSaveCompany = (corpNum: string) => {
    setSavedCompanies((prev) => {
      const exists = prev.includes(corpNum);
      if (exists) {
        // Also remove Kanban stage if removed from MyList
        setKanbanStages((prevKanban) => {
          const next = { ...prevKanban };
          delete next[corpNum];
          return next;
        });
        return prev.filter((id) => id !== corpNum);
      } else {
        // Default new company to "未連絡" stage
        setKanbanStages((prevKanban) => ({
          ...prevKanban,
          [corpNum]: "未連絡",
        }));
        return [...prev, corpNum];
      }
    });
  };

  const isCompanySaved = (corpNum: string) => {
    return savedCompanies.includes(corpNum);
  };

  const updateKanbanStage = (corpNum: string, stage: KanbanStage) => {
    setKanbanStages((prev) => ({
      ...prev,
      [corpNum]: stage,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        logout,
        upgradeUserPlan,
        authModalOpen,
        setAuthModalOpen,
        savedCompanies,
        toggleSaveCompany,
        isCompanySaved,
        kanbanStages,
        updateKanbanStage,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
