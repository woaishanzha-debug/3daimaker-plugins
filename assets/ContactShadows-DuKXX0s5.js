import{u as w,b as j,_ as H}from"./Environment-B496gRhf.js";import{r}from"./index-L-jZK4Sa.js";import{aG as P,aK as L,f as O,aL as K,i as X,aM as R}from"./OrbitControls-CISZ-O8Q.js";const q={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
      varying vec2 vUv;

      void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float h;

    varying vec2 vUv;

    void main() {

    	vec4 sum = vec4( 0.0 );

    	sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

    	gl_FragColor = sum;

    }
  `},J={uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`
    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`

  uniform sampler2D tDiffuse;
  uniform float v;

  varying vec2 vUv;

  void main() {

    vec4 sum = vec4( 0.0 );

    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

    gl_FragColor = sum;

  }
  `},$=r.forwardRef(({scale:t=10,frames:D=1/0,opacity:I=1,width:u=1,height:i=1,blur:U=1,near:_=0,far:E=10,resolution:o=512,smooth:G=!0,color:g="#000000",depthWrite:k=!1,renderOrder:A,...z},F)=>{const l=r.useRef(null),v=w(e=>e.scene),a=w(e=>e.gl),f=r.useRef(null);u=u*(Array.isArray(t)?t[0]:t||1),i=i*(Array.isArray(t)?t[1]:t||1);const[m,V,W,n,x,d,p]=r.useMemo(()=>{const e=new P(o,o),T=new P(o,o);T.texture.generateMipmaps=e.texture.generateMipmaps=!1;const B=new L(u,i).rotateX(Math.PI/2),Z=new O(B),c=new K;c.depthTest=c.depthWrite=!1,c.onBeforeCompile=s=>{s.uniforms={...s.uniforms,ucolor:{value:new X(g)}},s.fragmentShader=s.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),s.fragmentShader=s.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};const C=new R(q),b=new R(J);return b.depthTest=C.depthTest=!1,[e,B,c,Z,C,b,T]},[o,u,i,t,g]),y=e=>{n.visible=!0,n.material=x,x.uniforms.tDiffuse.value=m.texture,x.uniforms.h.value=e*1/256,a.setRenderTarget(p),a.render(n,f.current),n.material=d,d.uniforms.tDiffuse.value=p.texture,d.uniforms.v.value=e*1/256,a.setRenderTarget(m),a.render(n,f.current),n.visible=!1};let M=0,h,S;return j(()=>{f.current&&(D===1/0||M<D)&&(M++,h=v.background,S=v.overrideMaterial,l.current.visible=!1,v.background=null,v.overrideMaterial=W,a.setRenderTarget(m),a.render(v,f.current),y(U),G&&y(U*.4),a.setRenderTarget(null),l.current.visible=!0,v.overrideMaterial=S,v.background=h)}),r.useImperativeHandle(F,()=>l.current,[]),r.createElement("group",H({"rotation-x":Math.PI/2},z,{ref:l}),r.createElement("mesh",{renderOrder:A,geometry:V,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},r.createElement("meshBasicMaterial",{transparent:!0,map:m.texture,opacity:I,depthWrite:k})),r.createElement("orthographicCamera",{ref:f,args:[-u/2,u/2,i/2,-i/2,_,E]}))});export{$ as C};
