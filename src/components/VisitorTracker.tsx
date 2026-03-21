"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const sessionTokenRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      let token = sessionStorage.getItem('visitor_session_token');
      if (!token) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          token = crypto.randomUUID();
        } else {
          token = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
        sessionStorage.setItem('visitor_session_token', token);
      }
      sessionTokenRef.current = token;
    } catch (e) {
      console.error('Session storage error:', e);
    }
  }, []);

  useEffect(() => {
    // We delay slighty in case the token was just generated in the previous effect cycle
    const timeoutId = setTimeout(() => {
      if (!sessionTokenRef.current) return;

      const ping = async () => {
        try {
          await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_token: sessionTokenRef.current,
              current_path: pathname || '/',
            }),
          });
        } catch (err) {
          console.error('Failed to track visitor:', err);
        }
      };

      // Initial ping on path change or mount
      ping();

      // Periodic ping every 30 seconds to keep alive
      const interval = setInterval(ping, 30000); 

      return () => clearInterval(interval);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null; // Invisible tracking component
}
