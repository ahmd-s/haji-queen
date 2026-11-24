/**
 * Opening sequence: the emblem draws itself, the wordmark rises, and the screen
 * lifts away like six panels of cloth.
 *
 * Plays once per browsing session, only when a visit starts on the homepage, and
 * never for visitors who prefer reduced motion. Any tap, key or scroll skips it.
 * The page underneath renders normally throughout. On a slow connection the cloth
 * waits briefly (3.6s at most) for the campaign photographs. The
 * controller is a small inline script that runs before first paint: without
 * JavaScript the intro simply does not appear. The centre lockup is the owner's
 * supplied emblem, lifted gently onto the dark cloth.
 */
import { BRAND_LOGO } from "@/lib/site";
const CONTROLLER = `(function(){try{
var r=document.documentElement,k="hq-intro";
if(location.pathname!=="/"||matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem(k))return;
sessionStorage.setItem(k,"1");
r.dataset.intro="on";
var ev=["pointerdown","keydown","wheel","touchmove"],done=false;
function out(){if(done)return;done=true;r.dataset.intro="out";
ev.forEach(function(e){removeEventListener(e,out,true)});
setTimeout(function(){delete r.dataset.intro},1500)}
ev.forEach(function(e){addEventListener(e,out,{capture:true,passive:true})});
var start=Date.now();
function ready(){var i=document.querySelectorAll(".hero-in");if(!i.length)return false;
for(var n=0;n<i.length;n++)if(!i[n].complete&&i[n].getBoundingClientRect().width)return false;return true}
setTimeout(function wait(){if(ready()||Date.now()-start>3600)out();else setTimeout(wait,80)},2250);
}catch(e){}})();`;

const PANELS = 6;

export function Intro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CONTROLLER }} />
      <div className="intro" aria-hidden="true">
        <div className="intro-panels intro-cloth">
          {Array.from({ length: PANELS }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="intro-panels intro-ink">
          {Array.from({ length: PANELS }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="intro-lockup">
          <img
            src={BRAND_LOGO}
            alt=""
            width={512}
            height={491}
            className="intro-logo"
            fetchPriority="high"
          />
        </div>
      </div>
    </>
  );
}
