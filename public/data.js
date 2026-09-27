export const postseasonTypes=new Set(['F','D','L','W']);
export const stages={F:'Wild Card Series',D:'Division Series',L:'Championship Series',W:'World Series'};
export function flattenSchedule(data){return(data?.dates||[]).flatMap(d=>d.games||[]).sort((a,b)=>new Date(a.gameDate)-new Date(b.gameDate));}
export function selectGames(games,now=new Date()){
  const live=games.find(g=>g.status?.abstractGameState==='Live');
  const finals=games.filter(g=>g.status?.abstractGameState==='Final'&&new Date(g.gameDate)<=now);
  const next=games.find(g=>g.status?.abstractGameState!=='Final'&&!['Cancelled','Postponed'].includes(g.status?.detailedState)&&new Date(g.gameDate)>=new Date(+now-12*3600000));
  return{live,next,last:finals.at(-1),focus:live||next||finals.at(-1)};
}
export function tvNames(game,teamId){
  const side=game?.teams?.home?.team?.id===Number(teamId)?'home':game?.teams?.away?.team?.id===Number(teamId)?'away':null;
  return[...new Set((game?.broadcasts||[]).filter(b=>['TV','Internet'].includes(b.type)&&(!b.language||b.language==='en')&&(!side||b.isNational||!b.homeAway||b.homeAway===side)).map(b=>b.name))];
}
export function opponentOf(game,teamId){if(!game)return null;return game.teams?.home?.team?.id===Number(teamId)?game.teams?.away?.team:game.teams?.home?.team;}
export function hasKnownTime(game){return Boolean(game?.gameDate)&&game?.status?.startTimeTBD===false;}
export function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function officialUrl(s){try{const u=new URL(s);return u.protocol==='https:'&&(u.hostname==='mlb.com'||u.hostname.endsWith('.mlb.com'))?u.href:null;}catch{return null;}}
