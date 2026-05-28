import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    print("Starting session...")
    req1 = urllib.request.Request('https://backend-production-49f37.up.railway.app/api/session/new', method='POST')
    res1 = urllib.request.urlopen(req1, context=ctx)
    data1 = json.loads(res1.read())
    session_id = data1['session_id']

    # Message 1
    req2 = urllib.request.Request(
        'https://backend-production-49f37.up.railway.app/api/chat',
        data=json.dumps({'session_id': session_id, 'message': 'I am studying and need some calm instrumental music to focus.', 'history': []}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}, method='POST'
    )
    res2 = urllib.request.urlopen(req2, context=ctx)
    data2 = json.loads(res2.read())
    
    # Message 2
    req3 = urllib.request.Request(
        'https://backend-production-49f37.up.railway.app/api/chat',
        data=json.dumps({'session_id': session_id, 'message': 'I am feeling very calm and focused, my energy is low and I have no stress.', 'history': []}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}, method='POST'
    )
    res3 = urllib.request.urlopen(req3, context=ctx)
    data3 = json.loads(res3.read())
    
    if data3.get('is_complete'):
        print("\n=== Mood Profile Generated! ===")
        print(f"Vibe: {data3['mood_profile']['recommended_vibe']}")
        print(f"Genres: {data3['mood_profile']['preferred_genres']}")
        
        print("\n=== Fetching Spotify Recommendations... ===")
        req4 = urllib.request.Request(f'https://backend-production-49f37.up.railway.app/api/recommendations/{session_id}')
        res4 = urllib.request.urlopen(req4, context=ctx)
        data4 = json.loads(res4.read())
        
        tracks = data4.get('tracks', [])
        print(f"\n🎶 Found {len(tracks)} tracks from Spotify:")
        for t in tracks[:5]:
            print(f"- {t['name']} by {t['artist']}")
            print(f"  Link: {t['external_url']}")
    else:
        print("Chat still not complete:", data3)

except Exception as e:
    import traceback
    traceback.print_exc()
