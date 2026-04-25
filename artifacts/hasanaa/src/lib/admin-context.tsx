import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetAdminMe, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  checkAuth: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useGetAdminMe({
    query: {
      queryKey: getGetAdminMeQueryKey(),
      retry: false,
    }
  });

  const checkAuth = () => {
    refetch();
  };

  return (
    <AdminContext.Provider value={{
      isAdmin: data?.authenticated || false,
      isLoading,
      checkAuth
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
