import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { session_token, current_path } = body;

    if (!session_token) {
      return NextResponse.json(
        { error: 'Missing session_token' },
        { status: 400 }
      );
    }

    // Attempt to get geo headers and user agent
    let country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('x-country') ||
      req.headers.get('cf-ipcountry');
    let city =
      req.headers.get('x-vercel-ip-city');
    const user_agent = req.headers.get('user-agent') || 'Unknown';

    // Fallback: use ip-api.com if no geo headers present
    if (!country) {
      try {
        const ip =
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          req.headers.get('x-real-ip') ||
          '';
        // ip-api.com is free for non-commercial use, max 45 req/min
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=country,countryCode,city`,
          { signal: AbortSignal.timeout(1500) }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.countryCode) {
            country = geoData.countryCode;
            city = geoData.city || city;
          }
        }
      } catch {
        // silently ignore geo errors
      }
    }

    country = country || 'Unknown';
    city = city || 'Unknown';

    const supabase = await createClient();

    // In Supabase UPSERT, unspecified columns (like started_at) are NOT overwritten on an update
    // if we don't specify them in the payload. However to be safe, we also only pass the columns we update.
    const { error } = await supabase
      .from('visitor_sessions')
      .upsert(
        {
          session_token,
          country,
          city,
          user_agent,
          current_path,
          last_active_at: new Date().toISOString(),
        },
        {
          onConflict: 'session_token',
        }
      );

    if (error) {
      console.error('Visitor tracking UPSERT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Visitor tracking route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
