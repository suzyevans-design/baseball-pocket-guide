import{postseasonTypes,stages,flattenSchedule,selectGames,tvNames,opponentOf,hasKnownTime,escapeHtml as esc,officialUrl}from'./data.js';
const $=s=>document.querySelector(s);
const teams={112:{name:'Chicago Cubs',short:'Cubs',slug:'cubs',accent:'#194e7a',social:'cubs'},145:{name:'Chicago White Sox',short:'White Sox',slug:'whitesox',accent:'#343b3d',social:'whitesox'}};
const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback}catch{return fallback}};
const save=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const state={team:Number(read('pocket-team','112')),tab:'today',zone:read('pocket-zone','local'),schedule:null,scheduleError:false,updated:null,busy:false,postseason:null,postseasonError:false,rosters:{},rosterErrors:{},rosterTeam:null,game:null,gameError:false,news:{},newsErrors:{},weather:{},editorial:{}};
if(!teams[state.team])state.team=112;
const cache=new Map();let version=0;let renderVersion=0;
const team=()=>teams[state.team];
const zone=()=>state.zone==='local'?Intl.DateTimeFormat().resolvedOptions().timeZone:state.zone;
const dateFormat=(date,opts={})=>new Intl.DateTimeFormat('en-US',{timeZone:zone(),...opts}).format(new Date(date));
const localDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const timeString=g=>hasKnownTime(g)?dateFormat(g.gameDate,{hour:'numeric',minute:'2-digit',timeZoneName:'short'}):'Time to be announced';
const dateString=g=>dateFormat(g.gameDate,{weekday:'short',month:'short',day:'numeric'});
const gameDateString=g=>hasKnownTime(g)?dateString(g):new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date((g.officialDate||g.gameDate.slice(0,10))+'T12:00:00Z'));
const externalIcon='<svg class="link-icon" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ext=(url,label,cls='')=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"${cls?` class="${cls}"`:''}>${label} ${externalIcon}</a>`;
const logo=id=>`<img src="https://www.mlbstatic.com/team-logos/${Number(id)}.svg" alt="" loading="lazy" width="39" height="39">`;
const pending=(title,text,link)=>`<div class="empty-state"><h3>${title}</h3><p>${text}</p>${link||''}</div>`;
async function request(path,ttl=60000){
  const hit=cache.get(path);if(hit&&Date.now()-hit.time<ttl)return hit.value;
  const res=await fetch(path,{signal:AbortSignal.timeout(16000)});if(!res.ok)throw Error('Feed unavailable');
  const data=path.startsWith('/api/news')?await res.text():await res.json();cache.set(path,{value:data,time:Date.now()});return data;
}
function updateControls(){
  document.documentElement.style.setProperty('--accent',team().accent);
  document.querySelectorAll('[data-team]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.team)===state.team)));
  document.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===state.tab));b.tabIndex=b.dataset.tab===state.tab?0:-1;});
  $('#team-context').textContent=`${team().name} guide`;
  $('#panel').setAttribute('aria-labelledby',`tab-${state.tab}`);
  $('#timezone').value=state.zone;
  $('#season-year').textContent=new Date().getFullYear();
  $('#refresh').disabled=state.busy;$('#refresh').textContent=state.busy?'Checking…':'Refresh';
  const status=$('#update-status');status.classList.toggle('error',state.scheduleError);
  status.textContent=state.busy?'Checking MLB for the latest details…':state.scheduleError?(state.schedule?`Unable to refresh. Showing the last loaded schedule from ${dateFormat(state.updated,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}.`:'MLB’s schedule is unavailable right now. Try Refresh or use the official schedule link.'):`MLB schedule checked ${state.updated?dateFormat(state.updated,{hour:'numeric',minute:'2-digit',timeZoneName:'short'}):'just now'}. Times and broadcasts may change.`;
}
function head(title,description='',link=''){return`<div class="section-head"><div><h2>${title}</h2>${description?`<p>${description}</p>`:''}</div>${link}</div>`;}
function watch(g){
  const override=state.editorial.broadcastOverrides?.[g.gamePk];
  return override?.label?`${esc(override.label)}${override.source?` · ${ext(override.source,'Listing')}`:''}`:tvNames(g,state.team).map(esc).join(' · ')||'TV / streaming to be announced';
}
function playoffNote(){return`<aside class="schedule-note"><h3>October is taking shape.</h3><p>${esc(state.editorial.notice||'Opponents, game times and TV assignments will appear as they’re announced.')}</p><ul class="waiting-list"><li>Playoff opponent <span>Awaiting matchup</span></li><li>Series roster <span>Awaiting announcement</span></li><li>TV & streaming <span>Game-by-game updates</span></li></ul><button class="text-button next-link" data-go="playoffs">See the playoff picture</button></aside>`;}
function upcomingAside(games){
 const upcoming=games.filter(g=>postseasonTypes.has(g.gameType)&&g.status?.abstractGameState!=='Final');
 if(!upcoming.length)return playoffNote();
 const g=upcoming[0];return`<aside class="schedule-note series-note"><h3>${esc(stages[g.gameType]||'Postseason')}</h3><p>Series rosters are still to be confirmed. Check the Players and Pitching tabs for current active rosters.</p><button class="text-button next-link" data-go="schedule">See all series games & TV listings</button><button class="text-button next-link" data-go="playoffs">Explore the playoff picture</button></aside>`;
}
function scoreBlock(g){
 const played=['Live','Final'].includes(g.status?.abstractGameState),isLive=g.status?.abstractGameState==='Live';
 return`<div class="scoreboard"><div class="status-line"><span class="pill ${isLive?'live':''}">${esc(g.status?.detailedState||'Scheduled')}</span><span>${esc(stages[g.gameType]||'Regular season')}${g.seriesGameNumber&&postseasonTypes.has(g.gameType)?` · Game ${g.seriesGameNumber}`:''}</span></div><div class="score-teams">${['away','home'].map(side=>{const t=g.teams[side];return`<div class="score-team">${logo(t.team.id)}<span>${esc(t.team.name)}</span><strong>${played?esc(t.score??'—'):'—'}</strong></div>`}).join('')}</div><p class="game-date">${esc(gameDateString(g))}${played?'':` · ${esc(timeString(g))}`}</p><p class="game-venue">${esc(g.venue?.name||'Venue to be announced')}${g.venue?.location?.city?` · ${esc(g.venue.location.city)}`:''}</p></div>`;
}
function lineScore(g){
 const aggregate=`<p class="aggregate-score">${['away','home'].map(s=>`<span>${esc(g.teams[s].team.abbreviation||g.teams[s].team.teamName||g.teams[s].team.name)} <strong>${esc(g.teams[s].score??'—')}</strong></span>`).join('<span class="score-divider" aria-hidden="true">–</span>')}</p>`;
 const l=state.game?.gamePk===g.gamePk?state.game.liveData?.linescore:g.linescore;
 if(!l?.innings?.length)return aggregate+`<p class="small muted">${state.gameError?'The detailed box score is temporarily unavailable.':g.status?.abstractGameState==='Preview'?'The box score will appear after the first pitch.':'Detailed box score is not yet available.'} ${ext(`https://www.mlb.com/gameday/${g.gamePk}`,'MLB Gameday')}</p>`;
 return aggregate+`<p class="table-hint small muted">Scroll the inning table sideways for all innings and totals.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Inning-by-inning score, scroll horizontally"><table class="line-score"><caption class="small muted">${esc(g.status?.detailedState||'Game')} · Inning-by-inning score</caption><thead><tr><th scope="col">Team</th>${l.innings.map(i=>`<th scope="col">${i.num}</th>`).join('')}<th class="total" scope="col">R</th><th class="total" scope="col">H</th><th class="total" scope="col">E</th></tr></thead><tbody>${['away','home'].map(s=>`<tr><th scope="row">${esc(g.teams[s].team.abbreviation||g.teams[s].team.teamName||g.teams[s].team.name)}</th>${l.innings.map(i=>`<td>${esc(i[s]?.runs??'—')}</td>`).join('')}<td class="total">${esc(l.teams?.[s]?.runs??'—')}</td><td class="total">${esc(l.teams?.[s]?.hits??'—')}</td><td class="total">${esc(l.teams?.[s]?.errors??'—')}</td></tr>`).join('')}</tbody></table></div>`;
}
function gameDay(){
 const games=flattenSchedule(state.schedule),{live,next,last,focus}=selectGames(games);
 let main;
 if(!focus)main=`<div class="pending-game"><span class="pill">${state.scheduleError?'Feed unavailable':'Awaiting the next matchup'}</span><h2>${team().short}.<br>Ready when it’s official.</h2><p>${state.scheduleError?'We couldn’t retrieve the schedule. Refresh to try again.':'The next game hasn’t appeared in MLB’s schedule yet. We’ll show the opponent, first pitch, venue and broadcast here when they’re posted.'}</p>${ext(`https://www.mlb.com/${team().slug}/schedule`,'Official team schedule','button')}</div>`;
 else main=scoreBlock(focus)+`<div class="details-grid"><div class="game-detail"><b>${focus.status.abstractGameState==='Final'?'Listed broadcast':'Watch / stream'}</b>${watch(focus)}</div><div class="game-detail"><b>At the ballpark</b><div id="weather-detail">${focus.status.abstractGameState==='Final'?'Final game · forecast not shown':'Checking the game-day forecast…'}</div></div></div><p class="watch-note">Broadcast availability depends on your location and provider.</p>${ext(`https://www.mlb.com/gameday/${focus.gamePk}`,'Open MLB Gameday','small')}`;
 const box=live||last;
 return head(`${team().short} game day`,focus?(live?'Follow the game as it happens.':next?'Your next game, at a glance.':'The latest result stays here until the next game.'):'Good baseball is worth keeping close.')+`<div class="game-layout"><div>${main}</div>${upcomingAside(games)}</div>`+(box?`<section class="subsection"><div class="section-head"><div><h3>${live?'Live box score':'Last game box score'}</h3><p>${esc(gameDateString(box))} · ${esc(box.teams.away.team.name)} at ${esc(box.teams.home.team.name)}</p></div>${ext(`https://www.mlb.com/gameday/${box.gamePk}`,'Full box score')}</div>${lineScore(box)}<p class="small muted">${live?'Checks every minute while this page is visible. Updates may lag the action.':'Kept here between games.'}</p></section>`:'');
}
function gameRows(games){return`<div class="game-list">${games.map(g=>`<article class="game-row"><time datetime="${esc(g.gameDate)}">${esc(gameDateString(g))}<span>${esc(timeString(g))}</span></time><div><h3>${esc(g.teams.away.team.name)} at ${esc(g.teams.home.team.name)}</h3><p>${esc(g.venue?.name||'Venue to be announced')} · ${esc(stages[g.gameType]||'Regular season')}${g.seriesGameNumber&&postseasonTypes.has(g.gameType)?` · Game ${g.seriesGameNumber}`:''}${g.ifNecessary==='Y'?' · If necessary':''}</p><p>${esc(g.status?.detailedState||'Scheduled')}${g.status?.abstractGameState==='Final'?` · ${esc(g.teams.away.score)}–${esc(g.teams.home.score)}`:''} · ${ext(`https://www.mlb.com/gameday/${g.gamePk}`,'Game details')}</p></div><div class="broadcast">${watch(g)}<span>TV / streaming listing</span></div></article>`).join('')}</div>`;}
function schedule(){
 const games=flattenSchedule(state.schedule),upcoming=games.filter(g=>g.officialDate>=localDay()),past=games.filter(g=>g.officialDate<localDay()).slice(-3);
 return head('Make room for baseball.','Game times in '+(state.zone==='local'?`${zone().replaceAll('_',' ')} (your time zone).`:'Chicago time (CT).'),ext(`https://www.mlb.com/${team().slug}/schedule`,'Official schedule'))+`<p class="pending-strip">Times, opponents and networks may still change. “To be announced” means that detail is not confirmed in the guide.</p>`+(upcoming.length?gameRows(upcoming):pending(state.scheduleError?'Schedule temporarily unavailable':'Next games to be announced',state.scheduleError?'Try Refresh or check the official team schedule.':'This space is ready for the next series. Confirmed games will appear as MLB posts them.'))+(past.length?`<section class="subsection"><h3>Recent games</h3>${gameRows(past)}</section>`:'')+`<p class="watch-note">Listings come from MLB. Local restrictions and subscriptions may apply. A network listing does not guarantee the game is available through every streaming service.</p>`;
}
function rosterContent(pitching=false){
 const games=flattenSchedule(state.schedule),sel=selectGames(games),opp=opponentOf(sel.next||sel.live||sel.last,state.team);const id=state.rosterTeam||state.team;
 const data=state.rosters[id],error=state.rosterErrors[id];
 const title=pitching?'Know your pitchers.':'The names behind the numbers.';
 return head(title,pitching?'Throwing hand and current-season pitching numbers.':'Positions, batting hand and current-season hitting numbers.')+`<p class="roster-note">Current active roster from MLB, <strong>not a confirmed postseason roster</strong>. Teams announce a new roster for each series. Bats: L = left, R = right, S = switch. Throws: L / R.</p><div class="control-row"><label for="roster-team" class="small">Team</label><select id="roster-team"><option value="${state.team}" ${id===state.team?'selected':''}>${team().name}</option>${opp?`<option value="${opp.id}" ${id===opp.id?'selected':''}>${esc(opp.name)} · ${sel.next||sel.live?'opponent':'last opponent'}</option>`:''}</select><input id="player-search" type="search" placeholder="Find a player by name" aria-label="Find a player by name"></div><div id="roster-rows">${error?pending('Roster temporarily unavailable','Please try Refresh. No roster is being assumed.',ext(`https://www.mlb.com/${team().slug}/roster`,'Official team roster')):!data?pending('Checking the roster…','Getting the latest available player list.'):rosterRows(data,'',pitching)}</div>${pitching?`<section class="subsection"><h3>Who’s starting?</h3>${probables(sel.live||sel.next)}<details><summary>Batter vs. pitcher matchups</summary><p class="roster-note">Once the opponent and starting pitchers are confirmed, use the player statistics links above to explore splits. Direct head-to-head comparisons are planned for a later update; small samples need context.</p></details></section>`:''}`;
}
function rosterRows(data,filter,pitching){
 const rows=(data.roster||[]).filter(p=>(pitching?p.position?.type==='Pitcher':p.position?.type!=='Pitcher')&&p.person.fullName.toLowerCase().includes(filter.toLowerCase())).sort((a,b)=>a.person.fullName.localeCompare(b.person.fullName));
 if(!rows.length)return`<p class="empty-state">${filter?'No players match that name.':'No players are listed in this group yet.'}</p>`;
 const stat=(p,key)=>p.person.stats?.find(s=>s.group?.displayName===(pitching?'pitching':'hitting'))?.splits?.[0]?.stat?.[key]??'—';
 return`<div class="table-wrap"><table class="roster-table"><thead><tr><th scope="col">Player / stats</th><th scope="col">${pitching?'Throws':'Pos'}</th><th scope="col">${pitching?'W–L':'Bats'}</th><th class="numeric" scope="col">${pitching?'ERA':'AVG'}</th><th class="numeric" scope="col">${pitching?'WHIP':'HR'}</th><th class="numeric" scope="col">${pitching?'K':'OPS'}</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${ext(`https://www.mlb.com/player/${p.person.id}`,esc(p.person.fullName))}<small>#${esc(p.jerseyNumber||'—')}${pitching?` · ${esc(p.position?.name||'Pitcher')}`:''}</small></td><td>${esc(pitching?p.person.pitchHand?.code||'—':p.position?.abbreviation||'—')}</td><td>${pitching?`${esc(stat(p,'wins'))}–${esc(stat(p,'losses'))}`:esc(p.person.batSide?.code||'—')}</td><td class="numeric">${esc(stat(p,pitching?'era':'avg'))}</td><td class="numeric">${esc(stat(p,pitching?'whip':'homeRuns'))}</td><td class="numeric">${esc(stat(p,pitching?'strikeOuts':'ops'))}</td></tr>`).join('')}</tbody></table></div><p class="small muted">${rows.length} ${pitching?'pitchers':'position players'} · ${new Date().getFullYear()} MLB regular-season statistics when available. Dash = not supplied.</p>`;
}
function probables(g){if(!g)return`<p class="roster-note">Starting pitchers will appear once the next game and its probable starters are announced.</p>`;return`<p class="small muted">${esc(gameDateString(g))} · ${esc(g.teams.away.team.name)} at ${esc(g.teams.home.team.name)}</p><div class="details-grid">${['away','home'].map(s=>`<div class="game-detail"><b>${esc(g.teams[s].team.name)}</b>${g.teams[s].probablePitcher?ext(`https://www.mlb.com/player/${g.teams[s].probablePitcher.id}`,esc(g.teams[s].probablePitcher.fullName)):'To be announced'}</div>`).join('')}</div><p class="small muted">Probable starters are subject to change.</p>`;}
function playoffPicture(){
 const games=flattenSchedule(state.postseason),chicago=games.filter(g=>[g.teams.home.team.id,g.teams.away.team.id].includes(state.team)),upcoming=games.filter(g=>g.status?.abstractGameState!=='Final'),latest=games.filter(g=>g.status?.abstractGameState==='Final').slice(-8);
 return head('October, one round at a time.','The same little guide, wherever the postseason goes.',ext('https://www.mlb.com/postseason','MLB postseason'))+`<p class="roster-note">Chicago matchups appear only when listed by MLB. The full field below keeps the rest of October in view, even after a team’s final game.</p><div class="playoff-stages"><div><h3>Wild Card</h3><p>Opening series</p></div><div><h3>Division Series</h3><p>The next round</p></div><div><h3>League Series</h3><p>For the pennant</p></div><div><h3>World Series</h3><p>For the championship</p></div></div><h3>${team().short} in the postseason</h3>`+(chicago.length?gameRows(chicago):pending(state.postseasonError?'Postseason feed unavailable':state.postseason===null?'Checking October’s schedule…':'Matchup to be announced',state.postseasonError?'We couldn’t retrieve the playoff schedule. Use the official postseason link above.':'No confirmed postseason game for this team is available in the guide yet. Qualification and opponents are not assumed.'))+`<section class="subsection"><h3>Around the postseason</h3>${upcoming.length?gameRows(upcoming):pending('The next round is taking shape.','Confirmed games, venues, times and broadcasts for the full playoff field will appear here.')}${latest.length?`<h3 class="subsection">Latest postseason results</h3>${gameRows(latest)}`:''}</section>`;
}
function parseNews(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('Invalid RSS');
 return[...doc.querySelectorAll('item')].slice(0,6).map(i=>({title:i.querySelector('title')?.textContent,url:officialUrl(i.querySelector('link')?.textContent),date:i.querySelector('pubDate')?.textContent})).filter(i=>i.url&&i.title);
}
function news(){const entries=state.news[state.team],error=state.newsErrors[state.team];return head('From the clubhouse.','A few headlines. A little baseball conversation.',ext(`https://www.mlb.com/${team().slug}/news`,'All team news'))+(entries?.length?`<ul class="news-list">${entries.map(n=>`<li>${n.date&&!Number.isNaN(Date.parse(n.date))?`<time datetime="${new Date(n.date).toISOString()}">${esc(dateFormat(n.date,{month:'short',day:'numeric'}))} · MLB</time>`:''}${ext(n.url,esc(n.title))}</li>`).join('')}</ul>`:pending(error?'Headlines are taking a breather.':entries?'No headlines available yet.':'Checking the clubhouse…',error?'The news feed couldn’t be reached. You can still read the latest directly from the team.':'New team headlines will appear here as the feed updates.',ext(`https://www.mlb.com/${team().slug}/news`,'Read official team news','button')))+`<section class="subsection"><h3>Around the ballpark</h3><p class="roster-note">Photos, highlights and conversation from the team’s official accounts. These open on the original platform.</p><div class="social-links">${ext(`https://www.instagram.com/${team().social}/`,'Instagram')}${ext(`https://x.com/${team().social}`,'X')}${ext(`https://www.mlb.com/${team().slug}/video`,'Team videos')}</div></section>`;}
function render(){updateControls();const renderers={today:gameDay,schedule,roster:()=>rosterContent(false),pitching:()=>rosterContent(true),playoffs:playoffPicture,news};$('#panel').innerHTML=renderers[state.tab]();bindPanel();}
function bindPanel(){document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>changeTab(b.dataset.go)));$('#player-search')?.addEventListener('input',e=>{$('#roster-rows').innerHTML=rosterRows(state.rosters[state.rosterTeam||state.team]||{},e.target.value,state.tab==='pitching')});$('#roster-team')?.addEventListener('change',async e=>{state.rosterTeam=Number(e.target.value);render();await loadRoster(state.rosterTeam);if(['roster','pitching'].includes(state.tab))render()});}
async function loadRoster(id){try{state.rosters[id]=await request(`/api/roster?teamId=${id}`,300000);state.rosterErrors[id]=false}catch{state.rosterErrors[id]=true}}
async function loadTab(){
 const v=++renderVersion,currentTeam=state.team,currentTab=state.tab;
 if(['roster','pitching'].includes(currentTab))await loadRoster(state.rosterTeam||currentTeam);
 if(currentTab==='playoffs'){try{state.postseason=await request('/api/postseason');state.postseasonError=false}catch{state.postseasonError=true}}
 if(currentTab==='news'){try{state.news[currentTeam]=parseNews(await request(`/api/news?teamId=${currentTeam}`,300000));state.newsErrors[currentTeam]=false}catch{state.newsErrors[currentTeam]=true}}
 if(v!==renderVersion||currentTeam!==state.team||currentTab!==state.tab)return;
 render();if(currentTab==='today')await loadGameDetails();
}
async function loadGameDetails(){
 const v=renderVersion,t=state.team,{live,last,focus}=selectGames(flattenSchedule(state.schedule));const box=live||last;
 if(box){try{const data=await request(`/api/game?gamePk=${box.gamePk}`,30000);if(v!==renderVersion||t!==state.team)return;state.game=data;state.gameError=false}catch{if(v!==renderVersion||t!==state.team)return;state.gameError=true}if(state.tab==='today')render();}
 if(focus&&state.tab==='today'&&v===renderVersion)await loadWeather(focus,v);
}
async function loadWeather(g,v){
 const node=$('#weather-detail');if(!node||g.status?.abstractGameState==='Final')return;
 const c=g.venue?.location?.defaultCoordinates;
 if(!c){node.textContent='Forecast when the venue is confirmed';return;}
 try{const d=await request(`/api/weather?lat=${c.latitude}&lon=${c.longitude}`,900000);if(v!==renderVersion||!$('#weather-detail'))return;
 const date=g.officialDate||g.gameDate.slice(0,10),i=d.daily?.time?.indexOf(date)??-1;
 if(i<0){$('#weather-detail').textContent='Forecast closer to game day';return;}
 const high=d.daily.temperature_2m_max[i],low=d.daily.temperature_2m_min[i],rain=d.daily.precipitation_probability_max[i];
 $('#weather-detail').innerHTML=`${Math.round(low)}–${Math.round(high)}°F · ${rain}% rain chance<small class="muted small" style="display:block">Daily forecast · ${ext('https://open-meteo.com/','Open-Meteo')}</small>`;
 }catch{if(v===renderVersion&&$('#weather-detail'))$('#weather-detail').textContent='Forecast temporarily unavailable'}
}
function changeTab(name,{jump=true}={}){state.tab=name;render();loadTab();if(jump){const panel=$('#panel');panel.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});panel.focus({preventScroll:true})}}
async function loadTeam(){
 const v=++version;++renderVersion;const id=state.team;state.busy=true;state.scheduleError=false;updateControls();
 try{const d=await request(`/api/schedule?teamId=${id}`);if(v!==version)return;state.schedule=d;state.updated=new Date().toISOString();save(`pocket-schedule-${id}`,JSON.stringify({data:d,updated:state.updated}));}
 catch{if(v!==version)return;state.scheduleError=true;if(!state.schedule){try{const saved=JSON.parse(read(`pocket-schedule-${id}`,'null'));if(saved?.data){state.schedule=saved.data;state.updated=saved.updated}}catch{}}}
 if(v!==version)return;state.busy=false;render();await loadTab();
}
document.querySelectorAll('[data-team]').forEach(b=>b.addEventListener('click',()=>{if(Number(b.dataset.team)===state.team)return;state.team=Number(b.dataset.team);save('pocket-team',state.team);state.schedule=null;state.game=null;state.rosterTeam=null;state.scheduleError=false;state.updated=null;render();loadTeam()}));
document.querySelectorAll('[data-tab]').forEach(b=>{b.addEventListener('click',()=>changeTab(b.dataset.tab));b.addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(b);let target;if(e.key==='ArrowRight')target=tabs[(i+1)%tabs.length];if(e.key==='ArrowLeft')target=tabs[(i-1+tabs.length)%tabs.length];if(e.key==='Home')target=tabs[0];if(e.key==='End')target=tabs.at(-1);if(target){e.preventDefault();target.focus();changeTab(target.dataset.tab,{jump:false})}})});
$('#timezone').addEventListener('change',e=>{state.zone=e.target.value;save('pocket-zone',state.zone);render();if(state.tab==='today')loadGameDetails()});
$('#refresh').addEventListener('click',()=>{cache.clear();loadTeam()});
$('#print').addEventListener('click',()=>window.print());
const photoViewer=$('#photo-viewer');
document.querySelectorAll('.memories figure>a,.intro-memory>a').forEach(link=>link.addEventListener('click',event=>{
 if(typeof photoViewer.showModal!=='function')return;
 event.preventDefault();const photo=link.querySelector('img');
 $('#photo-viewer-image').src=link.href;$('#photo-viewer-image').alt=photo?.alt||'';
 $('#photo-viewer-title').textContent=link.closest('figure')?.querySelector('figcaption strong,figcaption h2')?.textContent||'Baseball memory';
 photoViewer.showModal();
}));
$('#photo-viewer-close').addEventListener('click',()=>photoViewer.close());
photoViewer.addEventListener('click',event=>{if(event.target===photoViewer)photoViewer.close()});
function setTextSize(on){document.documentElement.classList.toggle('large-text',on);$('#text-size').setAttribute('aria-pressed',String(on));$('#text-size').setAttribute('aria-label',on?'Use standard text size':'Use larger text');$('#text-size').innerHTML=`Aa <span>${on?'Standard text':'Larger text'}</span>`;save('pocket-large',on?'1':'0')}
setTextSize(read('pocket-large','0')==='1');$('#text-size').addEventListener('click',()=>setTextSize(!document.documentElement.classList.contains('large-text')));
request('/editorial.json',300000).then(d=>{state.editorial=d;render()}).catch(()=>{});
render();loadTeam();
setInterval(()=>{if(!document.hidden&&!state.busy&&state.tab==='today')loadTeam()},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!state.busy)loadTeam()});
