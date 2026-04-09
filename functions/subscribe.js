export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const BEEHIIV_API_KEY = env.BEEHIIV_API_KEY;
  const PUB_ID = env.BEEHIIV_PUB_ID;
  if (!BEEHIIV_API_KEY || !PUB_ID) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: corsHeaders });
  }

  let email;
  try {
    const body = await request.json();
    email = body.email;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Valid email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BEEHIIV_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: 'spacex-ipo-tracker',
          utm_medium: 'website',
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Beehiiv error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'Beehiiv subscription failed' }),
        {
          status: res.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.data?.id }),
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error('subscribe error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
