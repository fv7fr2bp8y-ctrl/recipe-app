# Estimates calories and macros per serving for every recipe with Gemini (about 2 $ for 711).
# Input: recipes.json dumped from loadMasterRecipes(); output: kcal-all.json, then server/data/nutrition.json.
import json, sys, urllib.request, os, time, threading
from concurrent.futures import ThreadPoolExecutor
S=sys.argv[1]; OUT=f'{S}/kcal-all.json'
key=open(os.path.expanduser('~/.gemini_key')).read().strip()
recipes=json.load(open(f'{S}/recipes.json'))
out=json.load(open(OUT)) if os.path.exists(OUT) else {}
lock=threading.Lock(); usage=[0,0]
schema={"type":"OBJECT","properties":{"kcal":{"type":"INTEGER"},"protein_g":{"type":"INTEGER"},"carbs_g":{"type":"INTEGER"},"fat_g":{"type":"INTEGER"},"note":{"type":"STRING"}},"required":["kcal","protein_g","carbs_g","fat_g","note"]}
def one(x):
    prompt=f"""Изчисли хранителната стойност на ЕДНА порция от тази рецепта, по съставките и количествата (стандартни стойности от USDA / таблици за състав на храните). Рецептата е за {x['servings']} порции.
Заглавие: {x['title']}
Съставки:
""" + "\n".join('- '+s for s in x['ingredients']) + """
Мазнина за пържене брой само поетата част. Ако количество липсва, приеми обичайно. В note: едно кратко изречение кои съставки дават най-много калории."""
    body={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"responseMimeType":"application/json","responseSchema":schema,"temperature":0}}
    for attempt in range(5):
        try:
            req=urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",data=json.dumps(body).encode(),headers={"Content-Type":"application/json","x-goog-api-key":key})
            d=json.load(urllib.request.urlopen(req,timeout=180))
            v=json.loads(d['candidates'][0]['content']['parts'][0]['text'])
            u=d.get('usageMetadata',{})
            with lock:
                usage[0]+=u.get('promptTokenCount',0); usage[1]+=u.get('candidatesTokenCount',0)+u.get('thoughtsTokenCount',0)
                out[x['id']]=v
                if len(out)%25==0: json.dump(out,open(OUT,'w'),ensure_ascii=False)
            return
        except Exception as e:
            time.sleep(5*(attempt+1)); err=e
    print('FAIL',x['id'],err,flush=True)
todo=[x for x in recipes if x['id'] not in out and x['ingredients']]
print('todo',len(todo),flush=True)
with ThreadPoolExecutor(8) as ex: list(ex.map(one,todo))
json.dump(out,open(OUT,'w'),ensure_ascii=False,indent=0)
print('done',len(out),'tokens',usage,'cost $',round(usage[0]*0.3e-6+usage[1]*2.5e-6,3),flush=True)
