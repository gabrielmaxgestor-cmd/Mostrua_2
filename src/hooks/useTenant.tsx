import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { resolveReseller } from '../middleware/tenantResolver';

interface TenantContextType {
  reseller: any | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({ reseller: null, loading: true, error: null });

export const TenantProvider = ({ children, slug }: { children: ReactNode, slug?: string }) => {
  const [reseller, setReseller] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const host = window.location.hostname;
        const tenant = await resolveReseller(host, slug);
        if (tenant) {
          setReseller(tenant);
        } else {
          setError('Loja não encontrada');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [slug]);

  return (
    <TenantContext.Provider value={{ reseller, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
