import{r as m,j as e}from"./index-GfvVALR8.js";import{C as F,E as L,O as P}from"./Environment-C0hsnqpR.js";import{S as R}from"./STLLoader-DVuSWu1-.js";import{e as E}from"./index-Ds3ZxOXi.js";import{U as z}from"./upload-DTC6O7HW.js";import{D as G}from"./download-6MLqn8d9.js";import{C as _}from"./Center-C6CS5s3D.js";import{S as B}from"./sparkles-CGoDugeg.js";import{a as p,i as x,o as O,h as U,f as W}from"./OrbitControls-DkaTp16U.js";import"./LoaderUtils-BqX4uiyl.js";import"./createLucideIcon-VW8c5MO-.js";const k=[new x("#38bdf8"),new x("#c084fc"),new x("#f472b6"),new x("#34d399")],I={uniforms:{uSeeds:{value:Array(500).fill(new p)},uColors:{value:k},uSeedCount:{value:0},uGapWidth:{value:.05}},vertexShader:`
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
    `},T=({geometry:s,density:f,seeds:n,gapWidth:h})=>{const o=m.useRef(null);return m.useMemo(()=>{o.current&&(o.current.uniforms.uSeeds.value=n,o.current.uniforms.uSeedCount.value=f,o.current.uniforms.uGapWidth.value=h)},[f,n,h]),s?e.jsx("mesh",{geometry:s,children:e.jsx("shaderMaterial",{ref:o,attach:"material",args:[I],uniformsNeedUpdate:!0})}):null};function te(){const[s,f]=m.useState(null),[n,h]=m.useState(300),[o,N]=m.useState(!1),{seeds:y,gapWidth:D}=m.useMemo(()=>{if(!s)return{seeds:Array(500).fill(new p),gapWidth:.05};s.computeVertexNormals(),s.computeBoundingBox();const t=s.boundingBox,r=new p;t.getSize(r);const a=Math.max(r.x,r.y,r.z)*.015,l=[];for(let c=0;c<500;c++)l.push(new p(t.min.x+Math.random()*r.x,t.min.y+Math.random()*r.y,t.min.z+Math.random()*r.z));return{seeds:l,gapWidth:a}},[s]),M=async()=>{if(!(!s||y.length===0)){N(!0),await new Promise(t=>setTimeout(t,50));try{const t=s.clone(),r=t.attributes.position,i=new Float32Array(r.count*3),a=new x,l=new p;for(let u=0;u<r.count;u++){l.fromBufferAttribute(r,u);let b=99999,v=99999,S=0;for(let w=0;w<n;w++){const j=l.distanceTo(y[w]);j<b?(v=b,b=j,S=w):j<v&&(v=j)}v-b<D?a.set("#050505"):a.copy(k[S%4]),i[u*3]=a.r,i[u*3+1]=a.g,i[u*3+2]=a.b}t.setAttribute("color",new O(i,3));const c=new U({vertexColors:!0,roughness:.5}),C=new W(t,c),g=await E(C,{printer_name:"Bambu Lab AMS"}),d=document.createElement("a");d.href=URL.createObjectURL(g),d.download=`Raden_Craft_${Date.now()}.3mf`,d.click()}catch(t){console.error("3MF 导出失败:",t)}finally{N(!1)}}},A=t=>{var a;const r=(a=t.target.files)==null?void 0:a[0];if(!r)return;const i=new FileReader;i.onload=l=>{var d;const c=(d=l.target)==null?void 0:d.result,g=new R().parse(c);g.center(),f(g)},i.readAsArrayBuffer(r)};return e.jsxs("div",{className:"w-full h-screen flex bg-neutral-950 text-white font-sans overflow-hidden",children:[e.jsxs("div",{className:"w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl",children:[e.jsxs("div",{className:"p-6 border-b border-white/10",children:[e.jsx("span",{className:"px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-widest",children:"L1-15"}),e.jsx("h1",{className:"font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase",children:"碎拼螺钿工艺"})]}),e.jsxs("div",{className:"p-6 space-y-8 flex-1 overflow-y-auto",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest uppercase",children:"1. 引入胎体 (STL)"}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"file",accept:".stl",onChange:A,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"}),e.jsxs("div",{className:"w-full py-10 rounded-xl border-2 border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center gap-3 group hover:border-purple-500/50 hover:bg-black/60 transition-all duration-300",children:[e.jsx("div",{className:"p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-colors",children:e.jsx(z,{className:"w-6 h-6 text-white/30 group-hover:text-purple-400.transition-colors"})}),e.jsx("span",{className:"text-xs font-bold text-white/40 group-hover:text-purple-300 tracking-wider",children:"点击或拖拽上传素模"})]})]})]}),s&&e.jsxs("div",{className:"space-y-5 p-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500",children:[e.jsxs("label",{className:"text-xs font-bold text-white/50 flex justify-between tracking-widest uppercase",children:[e.jsx("span",{children:"2. 螺片镶嵌密度"}),e.jsxs("span",{className:"text-purple-400 font-mono",children:[n," CP"]})]}),e.jsx("input",{type:"range",min:"10",max:"500",step:"1",value:n,onChange:t=>h(Number(t.target.value)),className:"w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"}),e.jsx("p",{className:"text-[10px] text-white/30 leading-relaxed italic",children:"系统正在 3D 欧几里得空间内实时解构高达 500 个特征点，模拟极致繁复的非遗冰裂纹路。"})]})]}),e.jsxs("div",{className:"p-6 mt-auto",children:[e.jsxs("button",{onClick:M,disabled:o||!s,className:"w-full py-4 rounded-xl bg-purple-700 hover:bg-purple-600 transition-colors font-black text-[10px] tracking-widest uppercase text-white flex justify-center items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed group",children:[e.jsx(G,{className:"w-4 h-4"}),o?"烘焙顶点数据中...":"导出 3MF 多色物理切片"]}),e.jsx("p",{className:"text-center text-[9px] text-white/20 mt-4 font-bold tracking-tighter uppercase",children:"Physical Splicing Engine v1.0"})]})]}),e.jsxs("div",{className:"flex-1 relative bg-[#050505] cursor-move",children:[e.jsxs(F,{camera:{position:[0,0,150],fov:45},children:[e.jsx("color",{attach:"background",args:["#050505"]}),e.jsx("ambientLight",{intensity:1.5}),e.jsx("directionalLight",{position:[50,100,100],intensity:2.5}),e.jsx("spotLight",{position:[-50,50,50],angle:.15,penumbra:1,intensity:1}),e.jsx(L,{preset:"studio"}),e.jsx(P,{makeDefault:!0,enableDamping:!0,dampingFactor:.05,enablePan:!1,minDistance:50,maxDistance:500}),e.jsx(_,{children:s?e.jsx(T,{geometry:s,density:n,seeds:y,gapWidth:D}):e.jsxs("mesh",{scale:[1,1,1],children:[e.jsx("boxGeometry",{args:[40,40,40]}),e.jsx("meshStandardMaterial",{color:"#222222",wireframe:!0,opacity:.2,transparent:!0})]})})]}),!s&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:e.jsxs("div",{className:"text-center space-y-4 opacity-20",children:[e.jsx(B,{className:"w-12 h-12 mx-auto text-white"}),e.jsx("p",{className:"text-xs font-black tracking-[0.5em] uppercase text-white",children:"等待胎体装载"})]})})]})]})}export{te as default};
