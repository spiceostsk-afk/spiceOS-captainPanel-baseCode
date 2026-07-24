import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { applyCaptainTheme } from '../lib/theme';

/**
 * Loads this restaurant's brand (colors + logo) once the tenant is known, applies
 * the colors to the captain CSS variables, and exposes the logo URL to the UI.
 * Mounted only inside the authenticated+tenant branch, so RLS scopes the read.
 */
const BrandingContext = createContext({ logoUrl: null });

export function BrandingProvider({ children }) {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    let active = true;
    supabase
      .from('restaurant_themes')
      .select('tokens, logo_url')
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        applyCaptainTheme(data.tokens);
        setLogoUrl(data.logo_url || null);
      });
    return () => { active = false; };
  }, []);

  return (
    <BrandingContext.Provider value={{ logoUrl }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
