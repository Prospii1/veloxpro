import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const TawkChat = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Tawk.to Script Integration
    var Tawk_API: any = (window as any).Tawk_API || {};
    var Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.async = true;
    script.src = 'https://embed.tawk.to/69bfbff921eed41c37d00fe9/default';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    // Insert script
    const s0 = document.getElementsByTagName("script")[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(script, s0);
    }

    // Optional: Identity Mapping (Auth Aware)
    if (user) {
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_API.onLoad = function() {
        (window as any).Tawk_API.setAttributes({
          'name': user.user_metadata?.full_name || user.email?.split('@')[0],
          'email': user.email
        }, function(error: any) {});
      };
    }

    return () => {
      // Cleanup script on unmount (optional, usually you want it to stay for SPAs)
      // But Tawk creates its own widgets outside the React tree, so complete cleanup is complex.
    };
  }, [user]);

  return null;
};
