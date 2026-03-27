export async function onRequestGet() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300' // cache 5 min
  };

  try {
    // Kalshi SpaceX IPO markets — fetch key timeframes
    const kalshiTickers = [
      'KXIPOSPACEX-26JUN01',
      'KXIPOSPACEX-26DEC01',
      'KXIPOSPACEX-27JUN01'
    ];

    const kalshiResults = await Promise.allSettled(
      kalshiTickers.map(ticker =>
        fetch(`https://api.elections.kalshi.com/trade-api/v2/markets/${ticker}`)
          .then(r => r.json())
          .then(d => d.market)
      )
    );

    const kalshiMarkets = kalshiResults
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => ({
        ticker: r.value.ticker,
        title: r.value.yes_sub_title || r.value.title,
        yes_price: parseFloat(r.value.yes_bid_dollars || 0),
        yes_pct: Math.round(parseFloat(r.value.yes_bid_dollars || 0) * 100),
        no_pct: Math.round(parseFloat(r.value.no_bid_dollars || 0) * 100),
        volume: parseInt(r.value.volume_fp || 0),
        status: r.value.status,
        close_time: r.value.close_time,
        url: `https://kalshi.com/markets/${r.value.event_ticker.toLowerCase()}/${r.value.ticker.toLowerCase()}`
      }));

    // Polymarket — search for SpaceX/Starlink IPO markets via gamma API
    let polymarkets = [];
    try {
      const polyRes = await fetch(
        'https://gamma-api.polymarket.com/markets?q=SpaceX&limit=10&active=true',
        { headers: { 'Accept': 'application/json' } }
      );
      if (polyRes.ok) {
        const polyData = await polyRes.json();
        // Filter for SpaceX/Starlink/IPO markets only
        const filtered = (Array.isArray(polyData) ? polyData : [])
          .filter(m => {
            const q = (m.question || '').toLowerCase();
            return q.includes('spacex') || q.includes('starlink') || q.includes('ipo');
          })
          .slice(0, 3);
        
        polymarkets = filtered.map(m => ({
          id: m.id || m.conditionId,
          question: m.question,
          yes_pct: m.outcomePrices ? Math.round(parseFloat(m.outcomePrices[0]) * 100) : null,
          volume: m.volume ? Math.round(parseFloat(m.volume)) : 0,
          url: m.url || `https://polymarket.com/event/${m.slug || m.id}`
        }));
      }
    } catch (e) {
      // Polymarket optional — don't fail if it's down
    }

    return new Response(
      JSON.stringify({
        updated: new Date().toISOString(),
        kalshi: kalshiMarkets,
        polymarket: polymarkets
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers
      }
    );
  }
}
