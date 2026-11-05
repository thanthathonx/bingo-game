# How it works

Deep mode: what the site's JavaScript is made of and what its start page did while we watched.

## Its JavaScript

Analysed 10 script(s) from https://gamebuddies.io/bingo/: 8 module(s), 49 endpoint(s), 1 route(s), bundled with vite.

Evidence ev_c374dee85afe87cda5858234f6ff58f5e0fe5ca65bc041be5b53c4b558a76bfc.

```json
{
  "api_operations": [],
  "app_kind": "unknown",
  "bundlers": [
    "vite"
  ],
  "edges": [
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:error",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#K@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:game:error",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#N@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:game:restored",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Oe@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:game:resumed",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Re@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gamebuddies:lobby-redirect",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Ne@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gamebuddies:return-redirect",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Se@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gb:achievement:unlocked",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#de@121"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gb:player:profile",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#W@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gb:postgame:crewstreak",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#z@121"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gb:postgame:rematch-go",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#R@121"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gb:postgame:rematch-update",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#A@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gb:postgame:suggest-go",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Z@121"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gb:postgame:suggest-update",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#V@121"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:gb:postgame:summary",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#ne@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:player:reconnected",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Ae@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:roomStateUpdated",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#he@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:site:notification",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Te@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#D:timer:update",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#ie@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#_:ended",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Y@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#_:mute",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#L@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#_:unmute",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#U@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#c:change",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#y@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#c:focus",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#c.addEventListener(focus)@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:click",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#X@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:focusin",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#l@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:focusout",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#l@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#X@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#b@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#d@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#i@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#m@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#ne@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#v@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:mousedown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#l@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:mousemove",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#L@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:mouseup",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#U@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:pointerdown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#W@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:touchend",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#U@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:touchmove",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#L@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:touchstart",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#X@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:visibilitychange",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#O@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:visibilitychange",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#X@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:visibilitychange",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#he@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:visibilitychange",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#l@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#document:visibilitychange",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#y@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:admin:message",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#t@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:bingo:cosmetics:result",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:bingo:cosmetics:state",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#t@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:change",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#t@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:gb:avatar:result",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:gb:avatar:state",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#t@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:gb:cosmetics:result",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:gb:cosmetics:state",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#t@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:gb:messages:unread",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#e:webrtc:host-muted-all",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#O@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#fe:message",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#fe.onmessage@121"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#g()():speaking",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#g()().on(speaking)@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#g()():stopped_speaking",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#g()().on(stopped_speaking)@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#i:error",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#l@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#i:iceconnectionstatechange",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#m@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#i:load",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#c@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#l:scroll",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#d@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:change",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#i@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:close",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#l@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:connect",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n.on(connect)@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:data",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n.on(data)@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:error",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#l@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:error",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n.onerror@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:load",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n.onload@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:signal",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n.on(signal)@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:statechange",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n.onstatechange@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:stream",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#c@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n:track",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#n.on(track)@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#o:pointerdown",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#g@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#o:pointerenter",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#w@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#o:pointerleave",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#g@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#o:pointerleave",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#y@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#o:pointermove",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#w@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#r:didUpdate",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#r.addEventListener(didUpdate)@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#r:measure",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#i@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():chat:blocked",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#W@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():chat:message",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#N@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():connect",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#X@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():disconnect",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#fe@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():error",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#ne@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():game:ended",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Ae@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():game:restarted",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#ie@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():game:started",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Re@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():host:migrated",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Ne@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():player:kicked",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#A@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:created",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#he@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:host-transferred",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Se@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:joined",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#le@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:player-disconnected",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#pe@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:player-joined",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#pe@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:player-left",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#pe@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:player-list-update",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Te@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:player-reconnected",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#pe@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():room:settings-updated",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Oe@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.connect():settings:updated",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#Oe@6"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.getSocket():connect",
      "kind": "handled-by",
      "to": "fn:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#oe@14"
    },
    {
      "from": "event:gamebuddies.io/bingo/assets/App-CvUxIPyx.js#s.getSocket():di
```

## Ten seconds of it

Watched https://gamebuddies.io/bingo/ for 10000ms: 0 request outline(s), 5 console entr(y/ies).

Evidence ev_f37d29606c5bdc8d2918f659b69e235a8ed88ed6539848f369c3cd1c326a72a0.

```json
{
  "accessibility": null,
  "console": {
    "count": 5,
    "entries": [
      {
        "level": "log",
        "source": "console-api"
      },
      {
        "level": "log",
        "source": "console-api"
      },
      {
        "level": "log",
        "source": "console-api"
      },
      {
        "level": "error",
        "source": "console-api"
      },
      {
        "level": "log",
        "source": "console-api"
      }
    ],
    "has_text": false
  },
  "dom": {
    "attribute_names": [
      "alt",
      "aria-busy",
      "aria-controls",
      "aria-expanded",
      "aria-haspopup",
      "aria-hidden",
      "aria-label",
      "aria-live",
      "as",
      "charset",
      "class",
      "content",
      "crossorigin",
      "cx",
      "cy",
      "d",
      "data-cf-beacon",
      "data-collapse-stage",
      "data-header-action",
      "data-header-panel",
      "data-stage",
      "data-theme",
      "data-world-ui",
      "decoding",
      "defer",
      "disabled",
      "fetchpriority",
      "fill",
      "for",
      "height",
      "href",
      "http-equiv",
      "id",
      "imagesizes",
      "imagesrcset",
      "inert",
      "integrity",
      "lang",
      "maxlength",
      "name",
      "placeholder",
      "points",
      "property",
      "r",
      "rel",
      "required",
      "role",
      "src",
      "stroke",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-width",
      "style",
      "tabindex",
      "target",
      "title",
      "type",
      "value",
      "viewbox",
      "width",
      "x1",
      "x2",
      "xmlns",
      "y1",
      "y2"
    ],
    "elements_by_name": {
      "a": 13,
      "b": 9,
      "body": 1,
      "button": 48,
      "circle": 17,
      "div": 57,
      "footer": 1,
      "form": 1,
      "g": 20,
      "h1": 1,
      "head": 1,
      "header": 1,
      "html": 1,
      "img": 11,
      "input": 3,
      "label": 3,
      "line": 42,
      "link": 20,
      "meta": 19,
      "noscript": 1,
      "p": 2,
      "path": 109,
      "polyline": 10,
      "script": 5,
      "span": 56,
      "style": 1,
      "svg": 53,
      "title": 1
    },
    "text_nodes": 54,
    "total_nodes": 574,
    "truncated": false
  },
  "dropped_events": 0,
  "frame_origins": [
    "https://gamebuddies.io"
  ],
  "network": {
    "request_count": 0,
    "requests": []
  },
  "origin": "https://gamebuddies.io/bingo/",
  "resources": [
    {
      "mime_type": "audio/mpeg",
      "type": "Media",
      "url": "https://gamebuddies.io/bingo/music/background.mp3"
    },
    {
      "mime_type": "font/woff2",
      "type": "Font",
      "url": "https://gamebuddies.io/bingo/fonts/short-stack-400.woff2"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://static.cloudflareinsights.com/beacon.min.js"
    },
    {
      "mime_type": "font/woff2",
      "type": "Font",
      "url": "https://gamebuddies.io/bingo/fonts/orbitron-700.woff2"
    },
    {
      "mime_type": "font/woff2",
      "type": "Font",
      "url": "https://gamebuddies.io/bingo/fonts/outfit-700.woff2"
    },
    {
      "mime_type": "font/woff2",
      "type": "Font",
      "url": "https://gamebuddies.io/bingo/fonts/bungee-400.woff2"
    },
    {
      "mime_type": "font/woff2",
      "type": "Font",
      "url": "https://gamebuddies.io/bingo/fonts/space-grotesk.woff2"
    },
    {
      "mime_type": "font/woff2",
      "type": "Font",
      "url": "https://gamebuddies.io/bingo/fonts/outfit-800.woff2"
    },
    {
      "mime_type": "image/webp",
      "type": "Image",
      "url": "https://gamebuddies.io/bingo/mascot.webp?v=gabu-v16"
    },
    {
      "mime_type": "font/woff2",
      "type": "Font",
      "url": "https://gamebuddies.io/bingo/fonts/fredoka.woff2"
    }
  ],
  "scripts": [
    {
      "length": 1366,
      "source_map_url": null,
      "url": "https://gamebuddies.io/bingo/"
    },
    {
      "length": 31853,
      "source_map_url": null,
      "url": "https://static.cloudflareinsights.com/beacon.min.js/vce701823e78c4301a35b7e07294d87301792088814092"
    },
    {
      "length": 6875,
      "source_map_url": null,
      "url": "https://gamebuddies.io/bingo/assets/index-C_OpU7F9.js"
    },
    {
      "length": 31853,
      "source_map_url": null,
      "url": "https://static.cloudflareinsights.com/beacon.min.js"
    },
    {
      "length": 236,
      "source_map_url": null,
      "url": "https://gamebuddies.io/bingo/assets/runtime-helpers-Cpj98o6Y.js"
    },
    {
      "length": 92885,
      "source_map_url": null,
      "url": "https://gamebuddies.io/bingo/assets/socketService-BOAPLSP5.js"
    },
    {
      "length": 194398,
      "source_map_url": null,
      "url": "https://gamebuddies.io/bingo/assets/vendor-react-D7JGONfl.js"
    },
    {
      "length": 62707,
      "source_map_url": null,
      "url": "https://gamebuddies.io/bingo/assets/application-C6loQcVd.js"
    },
    {
      "length": 555666,
      "source_map_url": null,
      "url": "https://gamebuddies.io/bingo/assets/App-CvUxIPyx.js"
    },
    {
      "length": 239872,
      "source_map_url": null,
      "url": "https://gamebuddies.io/bingo/assets/index-CYRCLvRd.js"
    }
  ],
  "scripts_truncated": false,
  "secret_redactions": 0,
  "storage_keys": null,
  "watch_ms": 10000,
  "websockets": {
    "connections": [],
    "frames": []
  }
}
```
