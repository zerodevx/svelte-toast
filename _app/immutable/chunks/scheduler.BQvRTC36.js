function k(){}const v=t=>t;function w(t,n){for(const e in n)t[e]=n[e];return t}function j(t){return t()}function A(){return Object.create(null)}function E(t){t.forEach(j)}function B(t){return typeof t=="function"}function C(t,n){return t!=t?n==n:t!==n||t&&typeof t=="object"||typeof t=="function"}let l;function D(t,n){return t===n?!0:(l||(l=document.createElement("a")),l.href=n,t===l.href)}function P(t){return Object.keys(t).length===0}function q(t,...n){if(t==null){for(const r of n)r(void 0);return k}const e=t.subscribe(...n);return e.unsubscribe?()=>e.unsubscribe():e}function S(t,n,e){t.$$.on_destroy.push(q(n,e))}function U(t,n,e,r){if(t){const o=m(t,n,e,r);return t[0](o)}}function m(t,n,e,r){return t[1]&&r?w(e.ctx.slice(),t[1](r(n))):e.ctx}function G(t,n,e,r){if(t[2]&&r){const o=t[2](r(e));if(n.dirty===void 0)return o;if(typeof o=="object"){const a=[],_=Math.max(n.dirty.length,o.length);for(let u=0;u<_;u+=1)a[u]=n.dirty[u]|o[u];return a}return n.dirty|o}return n.dirty}function H(t,n,e,r,o,a){if(o){const _=m(n,e,r,a);t.p(_,o)}}function I(t){if(t.ctx.length>32){const n=[],e=t.ctx.length/32;for(let r=0;r<e;r++)n[r]=-1;return n}return-1}function J(t){return t??""}function K(t){const n=typeof t=="string"&&t.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);return n?[parseFloat(n[1]),n[2]||"px"]:[t,"px"]}let f;function d(t){f=t}function g(){if(!f)throw new Error("Function called outside component initialization");return f}function L(t){g().$$.on_mount.push(t)}function N(t){g().$$.after_update.push(t)}function Q(t){g().$$.on_destroy.push(t)}const i=[],b=[];let c=[];const y=[],x=Promise.resolve();let p=!1;function O(){p||(p=!0,x.then(F))}function R(){return O(),x}function z(t){c.push(t)}const h=new Set;let s=0;function F(){if(s!==0)return;const t=f;do{try{for(;s<i.length;){const n=i[s];s++,d(n),M(n.$$)}}catch(n){throw i.length=0,s=0,n}for(d(null),i.length=0,s=0;b.length;)b.pop()();for(let n=0;n<c.length;n+=1){const e=c[n];h.has(e)||(h.add(e),e())}c.length=0}while(i.length);for(;y.length;)y.pop()();p=!1,h.clear(),d(t)}function M(t){if(t.fragment!==null){t.update(),E(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(z)}}function T(t){const n=[],e=[];c.forEach(r=>t.indexOf(r)===-1?n.push(r):e.push(r)),e.forEach(r=>r()),c=n}export{w as A,Q as B,J as C,N as a,b,S as c,U as d,G as e,D as f,I as g,z as h,B as i,v as j,A as k,F as l,P as m,k as n,L as o,T as p,f as q,E as r,C as s,R as t,H as u,d as v,j as w,i as x,O as y,K as z};
