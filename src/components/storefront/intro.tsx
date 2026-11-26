/**
 * Opening sequence. On the site's own paper the owner's emblem opens in gold
 * and the name appears beneath it. Then the name travels to its real place in
 * the header while the paper lifts off the campaign photographs, so the intro becomes
 * the homepage instead of covering it and being taken away.
 *
 * Plays once per browsing session, only when a visit starts at the top of the
 * homepage, and never for visitors who prefer reduced motion. Any tap, key or
 * scroll skips ahead. On a slow connection it waits briefly (3.8s at most) for the
 * campaign photographs. The controller is a small inline script that runs before
 * first paint: without JavaScript the intro simply does not appear.
 *
 * html[data-intro]: "on" (holding) > "out" (handing over, scroll held while the
 * name travels) > "out-free" (scroll released) > removed. Styles in store.css.
 */
import { EMBLEM_LETTER, EMBLEM_RING } from "@/components/storefront/emblem-paths";
import { SITE_TAGLINE } from "@/lib/site";

const CONTROLLER = `(function(){try{
var r=document.documentElement,k="hq-intro";
if(location.pathname!=="/"||location.hash||matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem(k))return;
sessionStorage.setItem(k,"1");
r.dataset.intro="on";
var ev=["pointerdown","keydown","wheel","touchmove"],done=false;
function out(){if(done)return;done=true;
ev.forEach(function(e){removeEventListener(e,out,true)});
var w=document.querySelector(".intro-word"),t=document.querySelector("[data-brand] span span");
if(w&&t&&w.animate){var a=w.firstChild.getBoundingClientRect(),b=t.getBoundingClientRect(),s=b.width/a.width;
if(a.width&&b.width)w.animate([{transform:"none"},{transform:"translate("+(b.left-a.left)+"px,"+(b.top+b.height/2-a.top-a.height*s/2)+"px) scale("+s+")"}],{duration:1300,easing:"cubic-bezier(.7,0,.16,1)",fill:"forwards"})}
r.dataset.intro="out";
setTimeout(function(){r.dataset.intro="out-free"},1500);
setTimeout(function(){delete r.dataset.intro},2500)}
ev.forEach(function(e){addEventListener(e,out,{capture:true,passive:true})});
var start=Date.now();
function ready(){var i=document.querySelectorAll(".hero-in");if(!i.length)return false;
for(var n=0;n<i.length;n++)if(!i[n].complete&&i[n].getBoundingClientRect().width)return false;return true}
setTimeout(function wait(){if(ready()||Date.now()-start>3800)out();else setTimeout(wait,80)},2500);
}catch(e){}})();`;

export function Intro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CONTROLLER }} />
      <div className="intro" aria-hidden="true">
        <div className="intro-veil" />
        <div className="intro-glow" />
        <div className="intro-lockup">
          <svg className="intro-emblem" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="intro-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c99a45" />
                <stop offset="0.45" stopColor="#a8782b" />
                <stop offset="0.6" stopColor="#bd8d3a" />
                <stop offset="1" stopColor="#8d611f" />
              </linearGradient>
            </defs>
            <path className="intro-ring" d={EMBLEM_RING} fill="url(#intro-gold)" fillRule="evenodd" />
            <path className="intro-letter" d={EMBLEM_LETTER} fill="url(#intro-gold)" fillRule="evenodd" />
          </svg>
          <p className="intro-word">
            <span>HAJI QUEENS</span>
          </p>
          <i className="intro-rule" />
          <p className="intro-by">{SITE_TAGLINE.replace("By", "by")}</p>
        </div>
      </div>
    </>
  );
}
