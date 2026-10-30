"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { isAdminEmail } from "@/lib/adminAuth";

export interface User {
  email: string;
  name: string;
  role: "free" | "trial" | "pro" | "business" | "enterprise" | "admin";
}

export type KanbanStage = "未連絡" | "連絡済み" | "商談中" | "成約";

export interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  quota: any | null;
  refreshQuota: (targetEmail?: string) => Promise<void>;
  logout: () => void;
  upgradeUserPlan: (plan: "free" | "pro" | "business" | "enterprise", couponCode?: string) => Promise<boolean>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  // MyList
  savedCompanies: string[];
  toggleSaveCompany: (corpNum: string) => void;
  saveCompaniesBatch: (corpNums: string[]) => { addedCount: number; totalCount: number; maxReached: boolean };
  isCompanySaved: (corpNum: string) => boolean;
  // Kanban Stages
  kanbanStages: Record<string, KanbanStage>;
  updateKanbanStage: (corpNum: string, stage: KanbanStage) => void;
  // Google Auth
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_CHANNEL_NAME = "kigyou_auth_sync_channel";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [quota, setQuota] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedCompanies, setSavedCompanies] = useState<string[]>([]);
  const [kanbanStages, setKanbanStages] = useState<Record<string, KanbanStage>>({});
  const [mounted, setMounted] = useState(false);

  // Guard ref to prevent stale session re-hydration right after instant logout
  const isLoggingOutRef = useRef<boolean>(false);

  const refreshQuota = React.useCallback(async (targetEmail?: string) => {
    if (isLoggingOutRef.current) return;
    const email = targetEmail || user?.email || session?.user?.email;
    if (!email) return;
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(email)}&_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quota && !isLoggingOutRef.current) {
          setQuota(data.quota);
          const resolvedRole = isAdminEmail(email)
            ? "admin"
            : (data.quota.plan || "free");
          setUser(prev => {
            if (prev && prev.email === email && prev.role !== resolvedRole) {
              const updated = { ...prev, role: resolvedRole };
              try {
                localStorage.setItem("kigyou_user", JSON.stringify(updated));
              } catch {}
              return updated;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error("Failed to sync user quota", e);
    }
  }, [user?.email, session?.user?.email]);

  // 1. Hydrate immediately from localStorage on client mount (0ms Optimistic UI)
  useEffect(() => {
    try {
      const logoutFlag = sessionStorage.getItem("kigyou_logged_out_ts");
      if (logoutFlag && Date.now() - Number(logoutFlag) < 8000) {
        isLoggingOutRef.current = true;
        localStorage.removeItem("kigyou_user");
      } else {
        sessionStorage.removeItem("kigyou_logged_out_ts");
        const storedUser = localStorage.getItem("kigyou_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.email) {
            if (isAdminEmail(parsed.email)) {
              parsed.role = "admin";
            }
            setUser(parsed);
            refreshQuota(parsed.email);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse stored user", e);
    }

    try {
      const storedSaved = localStorage.getItem("kigyou_saved");
      if (storedSaved) {
        setSavedCompanies(JSON.parse(storedSaved));
      }
    } catch {}

    try {
      const storedKanban = localStorage.getItem("kigyou_kanban");
      if (storedKanban) {
        setKanbanStages(JSON.parse(storedKanban));
      }
    } catch {}

    setMounted(true);
  }, []);

  // 2. Multi-Tab Real-Time Sync via BroadcastChannel & Storage Events
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event.data?.type === "LOGOUT") {
            isLoggingOutRef.current = true;
            setUser(null);
            setQuota(null);
            try {
              localStorage.removeItem("kigyou_user");
            } catch {}
          } else if (event.data?.type === "LOGIN" && event.data?.user) {
            isLoggingOutRef.current = false;
            setUser(event.data.user);
            refreshQuota(event.data.user.email);
          }
        };
      }
    } catch {}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "kigyou_user") {
        if (!e.newValue) {
          isLoggingOutRef.current = true;
          setUser(null);
          setQuota(null);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            isLoggingOutRef.current = false;
            setUser(parsed);
          } catch {}
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshQuota]);

  // 3. Sync NextAuth authoritative session from /api/auth/session
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      if (isLoggingOutRef.current) {
        return;
      }
      const email = session.user.email;
      const initialRole = isAdminEmail(email) ? "admin" : "free";

      setUser(prev => {
        if (prev && prev.email === email) {
          // Preserve already-fetched higher plan or admin role
          if (isAdminEmail(email) && prev.role !== "admin") {
            return { ...prev, role: "admin" };
          }
          return prev;
        }
        const nextUser: User = {
          email,
          name: session.user?.name || email.split("@")[0],
          role: initialRole,
        };
        try {
          localStorage.setItem("kigyou_user", JSON.stringify(nextUser));
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const bc = new BroadcastChannel(AUTH_CHANNEL_NAME);
            bc.postMessage({ type: "LOGIN", user: nextUser });
            bc.close();
          }
        } catch {}
        return nextUser;
      });

      refreshQuota(email);

      // Fetch authoritative watchlist from server database
      try {
        fetch("/api/user/watchlist/sync", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        })
          .then(res => res.json())
          .then(data => {
            if (data?.success && Array.isArray(data.watchlist) && !isLoggingOutRef.current) {
              setSavedCompanies(data.watchlist);
              localStorage.setItem("kigyou_saved", JSON.stringify(data.watchlist));
            }
          })
          .catch(() => {});
      } catch {}
    } else if (status === "unauthenticated") {
      isLoggingOutRef.current = false;
      try {
        sessionStorage.removeItem("kigyou_logged_out_ts");
        localStorage.removeItem("kigyou_user");
      } catch {}
      setUser(null);
      setQuota(null);
    }
  }, [session, status, refreshQuota]);

  // Listen to global quotaUpdated events
  useEffect(() => {
    const handleQuotaUpdated = () => {
      refreshQuota();
    };
    window.addEventListener("quotaUpdated", handleQuotaUpdated);
    return () => {
      window.removeEventListener("quotaUpdated", handleQuotaUpdated);
    };
  }, [refreshQuota]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!mounted) return;
    if (user && !isLoggingOutRef.current) {
      localStorage.setItem("kigyou_user", JSON.stringify(user));
    } else if (!user) {
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

  // 4. Instant Optimistic SPA Logout (0ms UI transition, no page flicker)
  const logout = async () => {
    isLoggingOutRef.current = true;
    setUser(null);
    setQuota(null);

    try {
      sessionStorage.setItem("kigyou_logged_out_ts", String(Date.now()));
      localStorage.removeItem("kigyou_user");
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(AUTH_CHANNEL_NAME);
        bc.postMessage({ type: "LOGOUT" });
        bc.close();
      }
    } catch {}

    // Clear server cookies in background + synchronize NextAuth internal state
    try {
      await Promise.allSettled([
        fetch(`/api/auth/signout-direct?_t=${Date.now()}`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        }),
        signOut({ redirect: false }),
      ]);
    } catch {}

    // Only redirect if user is currently on a private route (/admin or /dashboard)
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.includes("/admin") || path.includes("/dashboard")) {
        const segs = path.split("/");
        const loc = ["ja", "en", "vi"].includes(segs[1]) ? segs[1] : "ja";
        window.location.href = `/${loc}`;
      }
    }
  };

  const loginWithGoogle = () => {
    isLoggingOutRef.current = false;
    try {
      sessionStorage.removeItem("kigyou_logged_out_ts");
    } catch {}
    const cleanPath = window.location.pathname + window.location.search;
    signIn("google", { callbackUrl: cleanPath });
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
    const id = String(corpNum).trim();
    if (!id) return;

    setSavedCompanies((prev) => {
      const exists = prev.some((item) => String(item).trim() === id);
      if (exists) {
        setKanbanStages((prevKanban) => {
          const next = { ...prevKanban };
          delete next[id];
          return next;
        });

        const userEmail = user?.email || session?.user?.email;
        if (userEmail) {
          fetch(`/api/user/watchlist?corporateNumber=${encodeURIComponent(id)}`, {
            method: "DELETE",
          }).catch((err) => console.error("Failed to delete company from server watchlist:", err));
        }

        const nextList = prev.filter((item) => String(item).trim() !== id);
        try {
          localStorage.setItem("kigyou_saved", JSON.stringify(nextList));
        } catch {}
        return nextList;
      } else {
        setKanbanStages((prevKanban) => ({
          ...prevKanban,
          [id]: "未連絡",
        }));

        const userEmail = user?.email || session?.user?.email;
        if (userEmail) {
          fetch("/api/user/watchlist/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ corporateNumbers: [id] }),
          }).catch((err) => console.error("Failed to add company to server watchlist:", err));
        }

        const nextList = [...prev, id];
        try {
          localStorage.setItem("kigyou_saved", JSON.stringify(nextList));
        } catch {}
        return nextList;
      }
    });
  };

  const saveCompaniesBatch = (corpNums: string[]) => {
    const validNums = corpNums
      .map(n => String(n).trim())
      .filter(n => /^\d{13}$/.test(n));
    let added = 0;
    let limitHit = false;
    const MAX_LIMIT = 100;

    setSavedCompanies((prev) => {
      const existingSet = new Set(prev.map(p => String(p).trim()));
      const toAdd: string[] = [];

      for (const num of validNums) {
        if (!existingSet.has(num)) {
          if (existingSet.size + toAdd.length >= MAX_LIMIT) {
            limitHit = true;
            break;
          }
          toAdd.push(num);
        }
      }

      if (toAdd.length === 0) return prev;

      added = toAdd.length;

      setKanbanStages((prevKanban) => {
        const next = { ...prevKanban };
        for (const num of toAdd) {
          next[num] = "未連絡";
        }
        return next;
      });

      const userEmail = user?.email || session?.user?.email;
      if (userEmail && toAdd.length > 0) {
        fetch("/api/user/watchlist/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ corporateNumbers: toAdd }),
        }).catch((err) => console.error("Failed to sync batch companies to server watchlist:", err));
      }

      const nextList = [...prev, ...toAdd];
      try {
        localStorage.setItem("kigyou_saved", JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    return { addedCount: added, totalCount: validNums.length, maxReached: limitHit };
  };

  const isCompanySaved = (corpNum: string) => {
    const id = String(corpNum).trim();
    return savedCompanies.some((item) => String(item).trim() === id);
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
        isAuthLoading: !mounted || (status === "loading" && !user),
        quota,
        refreshQuota,
        logout,
        upgradeUserPlan,
        authModalOpen,
        setAuthModalOpen,
        savedCompanies,
        toggleSaveCompany,
        saveCompaniesBatch,
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
