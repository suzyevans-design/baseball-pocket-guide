const MLB='https://statsapi.mlb.com';
const DAY=86400000;
const validId=(v)=>/^\d{1,8}$/.test(v||'');
export function upstreamFor(url, now=new Date()) {
  const p=url.searchParams, year=now.getUTCFullYear();
  const date=(d)=>d.toISOString().slice(0,10);
  const id=p.get('teamId');
  switch(url.pathname){
    case '/api/schedule':
      if(!validId(id))return null;
      return `${MLB}/api/v1/schedule?${new URLSearchParams({sportId:'1',teamId:id,startDate:`${now.getUTCMonth()<2?year-1:year}-03-01`,endDate:date(new Date(+now+35*DAY)),hydrate:'team,linescore,probablePitcher,broadcasts(all),venue(location)'})}`;
    case '/api/postseason':
      return `${MLB}/api/v1/schedule?${new URLSearchParams({sportId:'1',season:String(year),gameTypes:'F,D,L,W',hydrate:'team,linescore,probablePitcher,broadcasts(all),venue(location)'})}`;
    case '/api/roster':
      if(!validId(id))return null;
      return `${MLB}/api/v1/teams/${id}/roster?${new URLSearchParams({rosterType:'active',hydrate:`person(stats(type=[season],group=[hitting,pitching],season=${year}))`})}`;
    case '/api/game':
      if(!validId(p.get('gamePk')))return null;
      return `${MLB}/api/v1.1/game/${p.get('gamePk')}/feed/live`;
    case '/api/news':
      if(!['112','145'].includes(id))return null;
      return `https://www.mlb.com/${id==='112'?'cubs':'whitesox'}/feeds/news/rss.xml`;
    case '/api/weather': {
      const lat=Number(p.get('lat')),lon=Number(p.get('lon'));
      if(!p.has('lat')||!p.has('lon')||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
      return `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({latitude:String(lat),longitude:String(lon),daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',temperature_unit:'fahrenheit',timezone:'auto',forecast_days:'16'})}`;
    }
    default:return null;
  }
}
export async function apiResponse(request,ctx={}) {
  const url=new URL(request.url);
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  const upstream=upstreamFor(url);
  if(!upstream)return Response.json({error:'Unknown or invalid request'},{status:400});
  // Sites' isolated Workers do not permit the default Cache API.
  // Use the existing HTTP/browser TTLs without accessing that runtime cache.
  try{
    const res=await fetch(upstream,{headers:{'Accept':url.pathname==='/api/news'?'application/rss+xml':'application/json'},signal:AbortSignal.timeout(12000)});
    if(!res.ok)throw new Error('Upstream unavailable');
    const body=await res.text();
    if(url.pathname!=='/api/news')JSON.parse(body);
    const response=new Response(body,{headers:{'Content-Type':url.pathname==='/api/news'?'application/xml; charset=utf-8':'application/json; charset=utf-8','Cache-Control':`public, max-age=${url.pathname==='/api/game'?30:url.pathname==='/api/news'?300:60}`,'X-Data-Fetched-At':new Date().toISOString(),'X-Content-Type-Options':'nosniff'}});
    return response;
  }catch{return Response.json({error:'The data provider is temporarily unavailable. Please try again.'},{status:502,headers:{'Cache-Control':'no-store'}})}
}
export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return apiResponse(request,ctx);
  return env.ASSETS.fetch(request);
}};
