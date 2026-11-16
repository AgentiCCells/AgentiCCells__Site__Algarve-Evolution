// Generates src/d/atlas/relief.webp: a procedural, relief-like hillshade for the Atlas design (drawn for effect, not survey data).
// Run from the repository root: node src/d/atlas/relief-generator.cjs (needs Playwright's Chromium). Code Apache-2.0, image CC BY 4.0.
// sites-dev@AgentiCCells.dinis, 16 November 2026.
const fs = require('fs'); const { chromium } = require('playwright');
const places = JSON.parse(fs.readFileSync('src/data/places.json','utf8'));
const LON0=-9.1, LAT0=37.62, COS=Math.cos(37.2*Math.PI/180), K=1000, X0=-80, Y0=-360, W=1760, H=1120, S=1.1;
const P=([lo,la])=>[((lo-LON0)*COS*K-X0)*S,((LAT0-la)*K-Y0)*S];
const pt=places.outline.countries.Portugal[0][0].map(P), es=places.outline.countries.Spain[0][0].map(P);
const iMouthP=places.outline.countries.Portugal[0][0].findIndex(q=>q[0]===-7.4071);
const iMouthS=places.outline.countries.Spain[0][0].findIndex(q=>q[0]===-7.4071);
const coast=[...pt.slice(iMouthP), ...[]], coastS=es.slice(0,iMouthS+1);
const bumps=[[-8.56,37.31,0.55,70,70],[-8.66,37.28,0.25,90,60],[-7.95,37.33,0.32,230,90],[-7.75,37.36,0.22,160,80],[-8.30,37.33,0.18,140,70],[-8.80,37.25,0.14,80,120]].map(([lo,la,a,sx,sy])=>{const [x,y]=P([lo,la]);return [x,y,a,sx*S,sy*S]});
(async()=>{
 const b=await chromium.launch(); const pg=await b.newPage();
 const url=await pg.evaluate(({pt,es,coast,coastS,bumps,w,h,S})=>{
  const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d');
  // land mask
  const m=document.createElement('canvas'); m.width=w; m.height=h; const mg=m.getContext('2d');
  mg.fillStyle='#fff'; for (const r of [pt,es]){mg.beginPath(); r.forEach((q,i)=>i?mg.lineTo(q[0],q[1]):mg.moveTo(q[0],q[1])); mg.closePath(); mg.fill();}
  const mask=mg.getImageData(0,0,w,h).data;
  const segs=[]; for (const line of [coast,coastS]) for(let i=0;i<line.length-1;i++) segs.push([...line[i],...line[i+1]]);
  function dseg(px,py){let best=1e9;for(const [x1,y1,x2,y2] of segs){const dx=x2-x1,dy=y2-y1;let t=((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy||1);t=Math.max(0,Math.min(1,t));const ex=x1+t*dx-px,ey=y1+t*dy-py;const d=ex*ex+ey*ey;if(d<best)best=d;}return Math.sqrt(best);}
  // gradient noise
  let seed=11; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const N=256, perm=[...Array(N).keys()]; for(let i=N-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]];}
  const gr=Array.from({length:N},()=>{const a=rnd()*Math.PI*2;return [Math.cos(a),Math.sin(a)];});
  const gidx=(x,y)=>perm[(perm[x&255]+y)&255];
  const fade=t=>t*t*t*(t*(t*6-15)+10);
  function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
    const d=(ix,iy)=>{const g2=gr[gidx(xi+ix,yi+iy)];return g2[0]*(xf-ix)+g2[1]*(yf-iy);};
    const u=fade(xf),v=fade(yf);const a=d(0,0),b2=d(1,0),c2=d(0,1),e=d(1,1);
    return 0.5+0.7*((a+(b2-a)*u)*(1-v)+(c2+(e-c2)*u)*v);}
  function fbm(x,y){let s=0,a=.5,f=1;for(let o=0;o<5;o++){s+=a*vn(x*f+o*17.3,y*f-o*9.1);f*=2.03;a*=.45;}return s;}
  function ridge(x,y){let s=0,a=.55,f=1;for(let o=0;o<5;o++){s+=a*(1-Math.abs(vn(x*f+o*5.7,y*f+o*3.1)*2-1));f*=2.07;a*=.42;}return s;}
  const step=2, gw=Math.ceil(w/step), gh=Math.ceil(h/step); const hgt=new Float32Array(gw*gh);
  for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const x=i*step,y=j*step;const d=dseg(x,y)/S;
    let e=Math.min(1,d/260); e=e*e*(3-2*e)*0.45;
    for(const [bx,by,a,sx,sy] of bumps){const dx=(x-bx)/sx,dy=(y-by)/sy;e+=a*Math.exp(-(dx*dx+dy*dy));}
    const n=fbm(x/(140*S),y/(140*S)), r=ridge(x/(120*S)+3,y/(120*S)+7);
    const inland=Math.min(1,d/120);
    e+= (n-.5)*0.22*inland + (r-.6)*0.55*e;
    hgt[j*gw+i]=Math.max(0,e);}
  const img=g.createImageData(w,h), o=img.data;
  const stops=[[0,[241,235,214]],[.12,[230,231,204]],[.26,[214,222,184]],[.42,[218,208,166]],[.58,[209,183,138]],[.76,[186,148,110]],[1,[156,124,102]]];
  function col(e){e=Math.min(1,e);for(let k=1;k<stops.length;k++)if(e<=stops[k][0]){const [t0,c0]=stops[k-1],[t1,c1]=stops[k];const u=(e-t0)/(t1-t0);return c0.map((v,i)=>v+(c1[i]-v)*u);}return stops[stops.length-1][1];}
  const H=(i,j)=>{i=Math.max(0,Math.min(gw-1,i));j=Math.max(0,Math.min(gh-1,j));return hgt[j*gw+i];};
  const lx=-0.6,ly=-0.6,lz=0.53;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4; const fi=x/step,fj=y/step,i=Math.floor(fi),j=Math.floor(fj),u=fi-i,v=fj-j;
    const e=H(i,j)*(1-u)*(1-v)+H(i+1,j)*u*(1-v)+H(i,j+1)*(1-u)*v+H(i+1,j+1)*u*v;
    const dx=(H(i+1,j)-H(i-1,j))*12, dy=(H(i,j+1)-H(i,j-1))*12; const len=Math.hypot(dx,dy,1);
    let sh=(-dx*lx-dy*ly+lz)/len/ Math.hypot(lx,ly,lz); sh=Math.max(0,Math.min(1,sh));
    const c=col(e); const f=0.86+0.62*(sh-0.62);
    o[p]=Math.min(255,c[0]*f); o[p+1]=Math.min(255,c[1]*f); o[p+2]=Math.min(255,c[2]*f); o[p+3]=255;}
  g.putImageData(img,0,0);
  return c.toDataURL('image/webp',0.8);
 },{pt,es,coast,coastS,bumps,w:Math.round(W*S),h:Math.round(H*S),S});
 fs.writeFileSync('src/d/atlas/relief.webp', Buffer.from(url.split(',')[1],'base64'));
 await b.close(); console.log('ok');
})();
