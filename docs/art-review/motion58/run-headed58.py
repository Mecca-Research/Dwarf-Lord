import datetime,json,shutil,subprocess
from pathlib import Path
root=Path('/opt/codex-work/dwarf-lord');work=root/'work/expanded-cycles/motion58'
original=Path('/mnt/c/Users/Tariq/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js')
client=work/'gameplay-client58.mjs'
# Keep the provided skill client; add only readiness for this game's asynchronous assets.
text=original.read_text();assert text.count('  let steps = null;')==1
client.write_text(text.replace('  let steps = null;', '  await page.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).workstations.length === 14, null, { timeout: 60000 });\n  let steps = null;'))
actions=work/'gameplay-actions58.json';actions.write_text(json.dumps({'steps':[{'buttons':['up'],'frames':18},{'buttons':['right'],'frames':18}]})+'\n')
command=['xvfb-run','-a','node',str(client),'--url','http://localhost:8081/Dwarf-Lord/','--click-selector','button:has-text("Walk the road")','--actions-file',str(actions),'--iterations','2','--headless','false','--screenshot-dir',str(work/'skill-client')]
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
with(work/'skill-client.log').open('w')as f:result=subprocess.run(command,cwd=root,stdout=f,stderr=subprocess.STDOUT)
(work/'skill-client-exit58.json').write_text(json.dumps({'command':command,'clientSource':str(original),'adaptation':'One asynchronous14-station readiness wait; provided client/action/screenshot logic otherwise unchanged. Earlier no-wait captures excluded from complete-scene validation.','started':started,'completed':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':result.returncode},indent=2)+'\n')
