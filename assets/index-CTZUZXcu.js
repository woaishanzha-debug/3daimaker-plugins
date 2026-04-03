import{r as p,j as e}from"./index-Cz0R6udr.js";import{C as F,E as L,O as P}from"./Environment-eBNprqVY.js";import{S as R}from"./STLLoader-DVuSWu1-.js";import{e as E}from"./index-BzaJpFBL.js";import{U as z}from"./upload-BYl-gh25.js";import{D as _}from"./download-DfxCXHmE.js";import{C as G}from"./Center-Cyxe31zl.js";import{S as B}from"./sparkles-CJCSSP6y.js";import{a as x,i as f,o as I,h as O,f as U}from"./OrbitControls-DkaTp16U.js";import"./LoaderUtils-BqX4uiyl.js";import"./createLucideIcon-BL5WNGqW.js";const k=[new f("#38bdf8"),new f("#c084fc"),new f("#f472b6"),new f("#34d399")],W={uniforms:{uSeeds:{value:Array(500).fill(new x)},uColors:{value:k},uSeedCount:{value:0},uGapWidth:{value:.05}},vertexShader:`
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
    `},T=({geometry:t,density:h,seeds:l,gapWidth:g})=>{const i=p.useRef(null);return p.useMemo(()=>{i.current&&(i.current.uniforms.uSeeds.value=l,i.current.uniforms.uSeedCount.value=h,i.current.uniforms.uGapWidth.value=g)},[h,l,g]),t?e.jsx("mesh",{geometry:t,children:e.jsx("shaderMaterial",{ref:i,attach:"material",args:[W],uniformsNeedUpdate:!0})}):null};function te(){const[t,h]=p.useState(null),[l,g]=p.useState(300),[i,N]=p.useState(!1),{seeds:y,gapWidth:D}=p.useMemo(()=>{if(!t)return{seeds:Array(500).fill(new x),gapWidth:.05};t.computeVertexNormals(),t.computeBoundingBox();const s=t.boundingBox,r=new x;s.getSize(r);const a=Math.max(r.x,r.y,r.z)*.015,c=[];for(let d=0;d<500;d++)c.push(new x(s.min.x+Math.random()*r.x,s.min.y+Math.random()*r.y,s.min.z+Math.random()*r.z));return{seeds:c,gapWidth:a}},[t]),M=async()=>{if(!(!t||y.length===0)){N(!0),await new Promise(s=>setTimeout(s,50));try{const s=t.index?t.toNonIndexed():t.clone(),r=s.attributes.position,n=new Float32Array(r.count*3),a=new f,c=new x;for(let m=0;m<r.count;m+=3){c.fromBufferAttribute(r,m);let v=99999,w=99999,S=0;for(let o=0;o<l;o++){const j=c.distanceTo(y[o]);j<v?(w=v,v=j,S=o):j<w&&(w=j)}w-v<D?a.set("#050505"):a.copy(k[S%4]);for(let o=0;o<3;o++)n[(m+o)*3]=a.r,n[(m+o)*3+1]=a.g,n[(m+o)*3+2]=a.b}s.setAttribute("color",new I(n,3));const d=new O({vertexColors:!0,roughness:.5}),C=new U(s,d),b=await E(C,{printer_name:"Bambu Lab AMS"}),u=document.createElement("a");u.href=URL.createObjectURL(b),u.download=`Raden_Craft_Solid_${Date.now()}.3mf`,u.click()}catch(s){console.error("3MF 单实体烘焙失败:",s)}finally{N(!1)}}},A=s=>{var a;const r=(a=s.target.files)==null?void 0:a[0];if(!r)return;const n=new FileReader;n.onload=c=>{var u;const d=(u=c.target)==null?void 0:u.result,b=new R().parse(d);b.center(),h(b)},n.readAsArrayBuffer(r)};return e.jsxs("div",{className:"w-full h-screen flex bg-neutral-950 text-white font-sans overflow-hidden",children:[e.jsxs("div",{className:"w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl",children:[e.jsxs("div",{className:"p-6 border-b border-white/10",children:[e.jsx("span",{className:"px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-widest",children:"L1-15"}),e.jsx("h1",{className:"font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase",children:"碎拼螺钿工艺"})]}),e.jsxs("div",{className:"p-6 space-y-8 flex-1 overflow-y-auto",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest uppercase",children:"1. 引入胎体 (STL)"}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"file",accept:".stl",onChange:A,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"}),e.jsxs("div",{className:"w-full py-10 rounded-xl border-2 border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center gap-3 group hover:border-purple-500/50 hover:bg-black/60 transition-all duration-300",children:[e.jsx("div",{className:"p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-colors",children:e.jsx(z,{className:"w-6 h-6 text-white/30 group-hover:text-purple-400.transition-colors"})}),e.jsx("span",{className:"text-xs font-bold text-white/40 group-hover:text-purple-300 tracking-wider",children:"点击或拖拽上传素模"})]})]})]}),t&&e.jsxs("div",{className:"space-y-5 p-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500",children:[e.jsxs("label",{className:"text-xs font-bold text-white/50 flex justify-between tracking-widest uppercase",children:[e.jsx("span",{children:"2. 螺片镶嵌密度"}),e.jsxs("span",{className:"text-purple-400 font-mono",children:[l," CP"]})]}),e.jsx("input",{type:"range",min:"10",max:"500",step:"1",value:l,onChange:s=>g(Number(s.target.value)),className:"w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"}),e.jsx("p",{className:"text-[10px] text-white/30 leading-relaxed italic",children:"系统正在 3D 欧几里得空间内实时解构高达 500 个特征点，模拟极致繁复的非遗冰裂纹路。"})]})]}),e.jsxs("div",{className:"p-6 mt-auto",children:[e.jsxs("button",{onClick:M,disabled:i||!t,className:"w-full py-4 rounded-xl bg-purple-700 hover:bg-purple-600 transition-colors font-black text-[10px] tracking-widest uppercase text-white flex justify-center items-center gap-2 shadow-xl ring-1 ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed group",children:[e.jsx(_,{className:"w-4 h-4"}),i?"物理结构加固中...":"导出 3MF 固态物理切片"]}),e.jsx("p",{className:"text-center text-[9px] text-white/20 mt-4 font-bold tracking-tighter uppercase",children:"Physical Splicing Engine v1.0"})]})]}),e.jsxs("div",{className:"flex-1 relative bg-[#050505] cursor-move",children:[e.jsxs(F,{camera:{position:[0,0,150],fov:45},children:[e.jsx("color",{attach:"background",args:["#050505"]}),e.jsx("ambientLight",{intensity:1.5}),e.jsx("directionalLight",{position:[50,100,100],intensity:2.5}),e.jsx("spotLight",{position:[-50,50,50],angle:.15,penumbra:1,intensity:1}),e.jsx(L,{preset:"studio"}),e.jsx(P,{makeDefault:!0,enableDamping:!0,dampingFactor:.05,enablePan:!1,minDistance:50,maxDistance:500}),e.jsx(G,{children:t?e.jsx(T,{geometry:t,density:l,seeds:y,gapWidth:D}):e.jsxs("mesh",{scale:[1,1,1],children:[e.jsx("boxGeometry",{args:[40,40,40]}),e.jsx("meshStandardMaterial",{color:"#222222",wireframe:!0,opacity:.2,transparent:!0})]})})]}),!t&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:e.jsxs("div",{className:"text-center space-y-4 opacity-20",children:[e.jsx(B,{className:"w-12 h-12 mx-auto text-white"}),e.jsx("p",{className:"text-xs font-black tracking-[0.5em] uppercase text-white",children:"等待胎体装载"})]})})]})]})}export{te as default};
