import{r as v,j as e}from"./index-CQHweZCI.js";import{C as Y,E as Z,O as ee}from"./Environment-DjE1zk16.js";import{S as te}from"./STLLoader-Dp_wtbxo.js";import{exportTo3MF as se}from"./index-WpZ5qCSV.js";import{U as oe}from"./upload-CdWCuz9d.js";import{D as ne}from"./download-DboOPO58.js";import{C as re}from"./Center-iOrBVO-i.js";import{S as ae}from"./sparkles-BTyyZAH0.js";import{a,i as G,I as ie,h as T,f as O,c as le,d as ce}from"./OrbitControls-DS9UXjOA.js";import"./LoaderUtils-BqX4uiyl.js";import"./createLucideIcon-gdW-I6DP.js";const U=[new G("#38bdf8"),new G("#c084fc"),new G("#f472b6"),new G("#34d399")],de={uniforms:{uSeeds:{value:Array(500).fill(new a)},uColors:{value:U},uSeedCount:{value:0},uGapWidth:{value:.05}},vertexShader:`
        varying vec3 vPosition;
        varying vec3 vNormal; // 新增：传递法线给片元着色器
        void main() {
            vPosition = position;
            // 将法线转换到视觉坐标系，供光照计算
            vNormal = normalMatrix * normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,fragmentShader:`
        uniform vec3 uSeeds[500]; // 扩容至 500
        uniform vec3 uColors[4];
        uniform int uSeedCount;
        uniform float uGapWidth;
        
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
            if (uSeedCount == 0) {
                gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
                return;
            }

            float minDist1 = 99999.0; // 扩大初始极大值防溢出
            float minDist2 = 99999.0;
            int closestIndex = 0;

            // 循环上限同步提升为 500
            for(int i = 0; i < 500; i++) {
                if (i >= uSeedCount) break;
                float dist = distance(vPosition, uSeeds[i]);
                if (dist < minDist1) {
                    minDist2 = minDist1;
                    minDist1 = dist;
                    closestIndex = i;
                } else if (dist < minDist2) {
                    minDist2 = dist;
                }
            }

            float edgeDist = minDist2 - minDist1;

            if (edgeDist < uGapWidth) {
                // 落入缝隙区间：黑漆底
                gl_FragColor = vec4(0.02, 0.02, 0.02, 1.0); 
            } else {
                // 落入螺片区域：幻彩色
                vec3 baseColor = uColors[int(mod(float(closestIndex), 4.0))];
                
                // 核心修复：引入真实的 3D 漫反射光照
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(vec3(1.0, 2.0, 3.0)); // 模拟右上角主光源
                float diff = max(dot(normal, lightDir), 0.0);
                
                // 环境光 0.4 + 漫反射 0.6
                vec3 finalColor = baseColor * (diff * 0.6 + 0.4);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        }
    `},ue=({geometry:t,density:b,seeds:x,gapWidth:w})=>{const l=v.useRef(null);return v.useMemo(()=>{l.current&&(l.current.uniforms.uSeeds.value=x,l.current.uniforms.uSeedCount.value=b,l.current.uniforms.uGapWidth.value=w)},[b,x,w]),t?e.jsx("mesh",{geometry:t,children:e.jsx("shaderMaterial",{ref:l,attach:"material",args:[de],uniformsNeedUpdate:!0})}):null};function Ne(){const[t,b]=v.useState(null),[x,w]=v.useState(300),[l,I]=v.useState(!1),{seeds:E,gapWidth:V}=v.useMemo(()=>{if(!t)return{seeds:Array(500).fill(new a),gapWidth:.05};t.computeVertexNormals(),t.computeBoundingBox();const s=t.boundingBox,o=new a;s.getSize(o);const c=Math.max(o.x,o.y,o.z)*.015,i=[];for(let r=0;r<500;r++)i.push(new a(s.min.x+Math.random()*o.x,s.min.y+Math.random()*o.y,s.min.z+Math.random()*o.z));return{seeds:i,gapWidth:c}},[t]),W=async()=>{if(!(!t||E.length===0)){I(!0),await new Promise(s=>setTimeout(s,50));try{const s=t.index?t.toNonIndexed():t.clone(),o=s.attributes.position,f=U.map(n=>"#"+n.getHexString()),c={};f.forEach(n=>c[n]=[]);const i=new a,r=new a,h=new a,j=.6,y=-.2;for(let n=0;n<o.count;n+=3){i.fromBufferAttribute(o,n),r.fromBufferAttribute(o,n+1),h.fromBufferAttribute(o,n+2);const N=new a().addVectors(i,r).add(h).divideScalar(3);let d=99999,g=99999,S=0;for(let m=0;m<x;m++){const p=N.distanceTo(E[m]);p<d?(g=d,d=p,S=m):p<g&&(g=p)}if(g-d<V)continue;const K=f[S%4],Q=new a().subVectors(h,r),X=new a().subVectors(i,r),D=new a().crossVectors(Q,X);if(D.lengthSq()<1e-6)continue;D.normalize();const R=D.clone().multiplyScalar(j),P=D.clone().multiplyScalar(y),C=i.clone().add(R),M=r.clone().add(R),k=h.clone().add(R),z=i.clone().add(P),A=r.clone().add(P),B=h.clone().add(P),u=(m,p,_)=>{c[K].push(m.x,m.y,m.z,p.x,p.y,p.z,_.x,_.y,_.z)};u(C,M,k),u(z,B,A),u(C,z,A),u(C,A,M),u(M,A,B),u(M,B,k),u(k,B,z),u(k,z,C)}const F=new ie,q=new T({color:"#050505",roughness:.8}),$=new O(s,q);F.add($);for(const n of f){const N=c[n];if(N.length===0)continue;const d=new le;d.setAttribute("position",new ce(N,3)),d.computeVertexNormals();const g=new T({color:n,roughness:.2}),S=new O(d,g);F.add(S)}const J=await se(F,{printer_name:"Bambu Lab AMS"}),L=document.createElement("a");L.href=URL.createObjectURL(J),L.download=`Raden_Craft_Solid_Inlay_${Date.now()}.3mf`,L.click()}catch(s){console.error("3MF 挤出实体导出失败:",s)}finally{I(!1)}}},H=s=>{var c;const o=(c=s.target.files)==null?void 0:c[0];if(!o)return;const f=new FileReader;f.onload=i=>{var y;const r=(y=i.target)==null?void 0:y.result,j=new te().parse(r);j.center(),b(j)},f.readAsArrayBuffer(o)};return e.jsxs("div",{className:"w-full h-screen flex bg-neutral-950 text-white font-sans overflow-hidden",children:[e.jsxs("div",{className:"w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl",children:[e.jsxs("div",{className:"p-6 border-b border-white/10",children:[e.jsx("span",{className:"px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-widest",children:"L1-15"}),e.jsx("h1",{className:"font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase",children:"碎拼螺钿工艺"})]}),e.jsxs("div",{className:"p-6 space-y-8 flex-1 overflow-y-auto",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest uppercase",children:"1. 引入胎体 (STL)"}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"file",accept:".stl",onChange:H,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"}),e.jsxs("div",{className:"w-full py-10 rounded-xl border-2 border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center gap-3 group hover:border-purple-500/50 hover:bg-black/60 transition-all duration-300",children:[e.jsx("div",{className:"p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-colors",children:e.jsx(oe,{className:"w-6 h-6 text-white/30 group-hover:text-purple-400.transition-colors"})}),e.jsx("span",{className:"text-xs font-bold text-white/40 group-hover:text-purple-300 tracking-wider",children:"点击或拖拽上传素模"})]})]})]}),t&&e.jsxs("div",{className:"space-y-5 p-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500",children:[e.jsxs("label",{className:"text-xs font-bold text-white/50 flex justify-between tracking-widest uppercase",children:[e.jsx("span",{children:"2. 螺片镶嵌密度"}),e.jsxs("span",{className:"text-purple-400 font-mono",children:[x," CP"]})]}),e.jsx("input",{type:"range",min:"10",max:"500",step:"1",value:x,onChange:s=>w(Number(s.target.value)),className:"w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"}),e.jsx("p",{className:"text-[10px] text-white/30 leading-relaxed italic",children:"系统正在 3D 欧几里得空间内实时解构高达 500 个特征点，模拟极致繁复的非遗冰裂纹路。"})]})]}),e.jsxs("div",{className:"p-6 mt-auto",children:[e.jsxs("button",{onClick:W,disabled:l||!t,className:"w-full py-4 rounded-xl bg-purple-700 hover:bg-purple-600 transition-colors font-black text-[10px] tracking-widest uppercase text-white flex justify-center items-center gap-2 shadow-xl ring-1 ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed group",children:[e.jsx(ne,{className:"w-4 h-4"}),l?"3D 实体挤出重组中...":"导出 3MF 实体镶嵌模型"]}),e.jsx("p",{className:"text-center text-[9px] text-white/20 mt-4 font-bold tracking-tighter uppercase",children:"Physical Splicing Engine v1.0"})]})]}),e.jsxs("div",{className:"flex-1 relative bg-[#050505] cursor-move",children:[e.jsxs(Y,{camera:{position:[0,0,150],fov:45},children:[e.jsx("color",{attach:"background",args:["#050505"]}),e.jsx("ambientLight",{intensity:1.5}),e.jsx("directionalLight",{position:[50,100,100],intensity:2.5}),e.jsx("spotLight",{position:[-50,50,50],angle:.15,penumbra:1,intensity:1}),e.jsx(Z,{preset:"studio"}),e.jsx(ee,{makeDefault:!0,enableDamping:!0,dampingFactor:.05,enablePan:!1,minDistance:50,maxDistance:500}),e.jsx(re,{children:t?e.jsx(ue,{geometry:t,density:x,seeds:E,gapWidth:V}):e.jsxs("mesh",{scale:[1,1,1],children:[e.jsx("boxGeometry",{args:[40,40,40]}),e.jsx("meshStandardMaterial",{color:"#222222",wireframe:!0,opacity:.2,transparent:!0})]})})]}),!t&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:e.jsxs("div",{className:"text-center space-y-4 opacity-20",children:[e.jsx(ae,{className:"w-12 h-12 mx-auto text-white"}),e.jsx("p",{className:"text-xs font-black tracking-[0.5em] uppercase text-white",children:"等待胎体装载"})]})})]})]})}export{Ne as default};
