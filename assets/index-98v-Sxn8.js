import{r as f,j as e}from"./index-ZbR5YKCu.js";import{C as G,E as F,O as R}from"./Environment-CGH2kY1O.js";import{S as _}from"./STLLoader-DVuSWu1-.js";import{e as z}from"./index-wCiD2SHV.js";import{U as B}from"./upload-BNwRICtq.js";import{D as I}from"./download-COOBopkH.js";import{C as T}from"./Center-D4s89UbM.js";import{S as U}from"./sparkles-CDmN2VWX.js";import{a as g,i as y,I as W,c as O,d as A,h as V,f as H}from"./OrbitControls-DkaTp16U.js";import"./LoaderUtils-BqX4uiyl.js";import"./createLucideIcon-CARVp6vH.js";const L=[new y("#38bdf8"),new y("#c084fc"),new y("#f472b6"),new y("#34d399")],X={uniforms:{uSeeds:{value:Array(500).fill(new g)},uColors:{value:L},uSeedCount:{value:0},uGapWidth:{value:.05}},vertexShader:`
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
    `},Y=({geometry:t,density:b,seeds:u,gapWidth:v})=>{const l=f.useRef(null);return f.useMemo(()=>{l.current&&(l.current.uniforms.uSeeds.value=u,l.current.uniforms.uSeedCount.value=b,l.current.uniforms.uGapWidth.value=v)},[b,u,v]),t?e.jsx("mesh",{geometry:t,children:e.jsx("shaderMaterial",{ref:l,attach:"material",args:[X],uniformsNeedUpdate:!0})}):null};function ne(){const[t,b]=f.useState(null),[u,v]=f.useState(300),[l,k]=f.useState(!1),{seeds:N,gapWidth:M}=f.useMemo(()=>{if(!t)return{seeds:Array(500).fill(new g),gapWidth:.05};t.computeVertexNormals(),t.computeBoundingBox();const r=t.boundingBox,s=new g;r.getSize(s);const m=Math.max(s.x,s.y,s.z)*.015,p=[];for(let n=0;n<500;n++)p.push(new g(r.min.x+Math.random()*s.x,r.min.y+Math.random()*s.y,r.min.z+Math.random()*s.z));return{seeds:p,gapWidth:m}},[t]),E=async()=>{if(!(!t||N.length===0)){k(!0),await new Promise(r=>setTimeout(r,50));try{const r=t.index?t.toNonIndexed():t.clone(),s=r.attributes.position,c=r.attributes.normal,m=L.map(o=>"#"+o.getHexString()),p=["#050505",...m],n={};p.forEach(o=>n[o]={pos:[],norm:[]});const D=new g;for(let o=0;o<s.count;o+=3){D.fromBufferAttribute(s,o);let i=99999,x=99999,j=0;for(let d=0;d<u;d++){const a=D.distanceTo(N[d]);a<i?(x=i,i=a,j=d):a<x&&(x=a)}let C="#050505";x-i>=M&&(C=m[j%4]);for(let d=0;d<3;d++){const a=o+d;n[C].pos.push(s.getX(a),s.getY(a),s.getZ(a)),c&&n[C].norm.push(c.getX(a),c.getY(a),c.getZ(a))}}const h=new W;for(const o of p){if(n[o].pos.length===0)continue;const i=new O;i.setAttribute("position",new A(n[o].pos,3)),n[o].norm.length>0?i.setAttribute("normal",new A(n[o].norm,3)):i.computeVertexNormals();const x=new V({color:o,roughness:.5}),j=new H(i,x);h.add(j)}const w=await z(h,{printer_name:"Bambu Lab AMS"}),S=document.createElement("a");S.href=URL.createObjectURL(w),S.download=`Raden_Craft_Pro_${Date.now()}.3mf`,S.click()}catch(r){console.error("3MF 拆分导出失败:",r)}finally{k(!1)}}},P=r=>{var m;const s=(m=r.target.files)==null?void 0:m[0];if(!s)return;const c=new FileReader;c.onload=p=>{var w;const n=(w=p.target)==null?void 0:w.result,h=new _().parse(n);h.center(),b(h)},c.readAsArrayBuffer(s)};return e.jsxs("div",{className:"w-full h-screen flex bg-neutral-950 text-white font-sans overflow-hidden",children:[e.jsxs("div",{className:"w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl",children:[e.jsxs("div",{className:"p-6 border-b border-white/10",children:[e.jsx("span",{className:"px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-widest",children:"L1-15"}),e.jsx("h1",{className:"font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase",children:"碎拼螺钿工艺"})]}),e.jsxs("div",{className:"p-6 space-y-8 flex-1 overflow-y-auto",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest uppercase",children:"1. 引入胎体 (STL)"}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"file",accept:".stl",onChange:P,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"}),e.jsxs("div",{className:"w-full py-10 rounded-xl border-2 border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center gap-3 group hover:border-purple-500/50 hover:bg-black/60 transition-all duration-300",children:[e.jsx("div",{className:"p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-colors",children:e.jsx(B,{className:"w-6 h-6 text-white/30 group-hover:text-purple-400.transition-colors"})}),e.jsx("span",{className:"text-xs font-bold text-white/40 group-hover:text-purple-300 tracking-wider",children:"点击或拖拽上传素模"})]})]})]}),t&&e.jsxs("div",{className:"space-y-5 p-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500",children:[e.jsxs("label",{className:"text-xs font-bold text-white/50 flex justify-between tracking-widest uppercase",children:[e.jsx("span",{children:"2. 螺片镶嵌密度"}),e.jsxs("span",{className:"text-purple-400 font-mono",children:[u," CP"]})]}),e.jsx("input",{type:"range",min:"10",max:"500",step:"1",value:u,onChange:r=>v(Number(r.target.value)),className:"w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"}),e.jsx("p",{className:"text-[10px] text-white/30 leading-relaxed italic",children:"系统正在 3D 欧几里得空间内实时解构高达 500 个特征点，模拟极致繁复的非遗冰裂纹路。"})]})]}),e.jsxs("div",{className:"p-6 mt-auto",children:[e.jsxs("button",{onClick:E,disabled:l||!t,className:"w-full py-4 rounded-xl bg-purple-700 hover:bg-purple-600 transition-colors font-black text-[10px] tracking-widest uppercase text-white flex justify-center items-center gap-2 shadow-xl ring-1 ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed group",children:[e.jsx(I,{className:"w-4 h-4"}),l?"多实体网格重组中...":"导出 3MF 多实体物理切片"]}),e.jsx("p",{className:"text-center text-[9px] text-white/20 mt-4 font-bold tracking-tighter uppercase",children:"Physical Splicing Engine v1.0"})]})]}),e.jsxs("div",{className:"flex-1 relative bg-[#050505] cursor-move",children:[e.jsxs(G,{camera:{position:[0,0,150],fov:45},children:[e.jsx("color",{attach:"background",args:["#050505"]}),e.jsx("ambientLight",{intensity:1.5}),e.jsx("directionalLight",{position:[50,100,100],intensity:2.5}),e.jsx("spotLight",{position:[-50,50,50],angle:.15,penumbra:1,intensity:1}),e.jsx(F,{preset:"studio"}),e.jsx(R,{makeDefault:!0,enableDamping:!0,dampingFactor:.05,enablePan:!1,minDistance:50,maxDistance:500}),e.jsx(T,{children:t?e.jsx(Y,{geometry:t,density:u,seeds:N,gapWidth:M}):e.jsxs("mesh",{scale:[1,1,1],children:[e.jsx("boxGeometry",{args:[40,40,40]}),e.jsx("meshStandardMaterial",{color:"#222222",wireframe:!0,opacity:.2,transparent:!0})]})})]}),!t&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:e.jsxs("div",{className:"text-center space-y-4 opacity-20",children:[e.jsx(U,{className:"w-12 h-12 mx-auto text-white"}),e.jsx("p",{className:"text-xs font-black tracking-[0.5em] uppercase text-white",children:"等待胎体装载"})]})})]})]})}export{ne as default};
