import{r as c,j as e}from"./index-DJfl8kNh.js";import{C as g,E as b,O as v}from"./Environment-Bdn6q942.js";import{S as j}from"./STLLoader-DVuSWu1-.js";import{U as w}from"./upload-CQL_VLbE.js";import{D as N}from"./download-nV8ZFQUs.js";import{C as y}from"./Center--LJt2YbY.js";import{S}from"./sparkles-BXqHLKzc.js";import{a as d,i as l}from"./OrbitControls-DkaTp16U.js";import"./LoaderUtils-BqX4uiyl.js";import"./createLucideIcon-Bp4cBLPo.js";const D=[new l("#38bdf8"),new l("#c084fc"),new l("#f472b6"),new l("#34d399")],C={uniforms:{uSeeds:{value:Array(100).fill(new d)},uColors:{value:D},uSeedCount:{value:0},uGapWidth:{value:.03}},vertexShader:`
        varying vec3 vPosition;
        void main() {
            vPosition = position; // 捕获局部坐标系 3D 坐标
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,fragmentShader:`
        uniform vec3 uSeeds[100];
        uniform vec3 uColors[4];
        uniform int uSeedCount;
        uniform float uGapWidth;
        
        varying vec3 vPosition;

        void main() {
            if (uSeedCount == 0) {
                gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0); // 默认黑漆底色
                return;
            }

            float minDist1 = 9999.0;
            float minDist2 = 9999.0;
            int closestIndex = 0;

            // 遍历所有特征点，计算空间距离场
            for(int i = 0; i < 100; i++) {
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

            // 计算该像素点离第一近和第二近特征点的距离差
            float edgeDist = minDist2 - minDist1;

            if (edgeDist < uGapWidth) {
                // 落入缝隙区间，模拟填缝的黑大漆
                gl_FragColor = vec4(0.05, 0.05, 0.05, 1.0); 
            } else {
                // 落入螺片区域，根据特征点索引映射到 4 种幻彩色
                vec3 color = uColors[int(mod(float(closestIndex), 4.0))];
                // 叠加一个基础的环境高光感
                float specular = 1.0 - (minDist1 * 0.1); 
                gl_FragColor = vec4(color * specular, 1.0);
            }
        }
    `},k=({geometry:t,density:o})=>{const s=c.useRef(null);return c.useMemo(()=>{if(!t||!s.current)return;t.computeBoundingBox();const r=t.boundingBox,i=new d;r.getSize(i);const a=[];for(let n=0;n<100;n++)a.push(new d(r.min.x+Math.random()*i.x,r.min.y+Math.random()*i.y,r.min.z+Math.random()*i.z));s.current.uniforms.uSeeds.value=a,s.current.uniforms.uSeedCount.value=o},[t,o]),t?e.jsx("mesh",{geometry:t,children:e.jsx("shaderMaterial",{ref:s,attach:"material",args:[C],uniformsNeedUpdate:!0})}):null};function B(){const[t,o]=c.useState(null),[s,r]=c.useState(30),i=a=>{var p;const n=(p=a.target.files)==null?void 0:p[0];if(!n)return;const u=new FileReader;u.onload=f=>{var m;const h=(m=f.target)==null?void 0:m.result,x=new j().parse(h);x.center(),o(x)},u.readAsArrayBuffer(n)};return e.jsxs("div",{className:"w-full h-screen flex bg-neutral-950 text-white font-sans overflow-hidden",children:[e.jsxs("div",{className:"w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl",children:[e.jsxs("div",{className:"p-6 border-b border-white/10",children:[e.jsx("span",{className:"px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-widest",children:"L1-15"}),e.jsx("h1",{className:"font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase",children:"碎拼螺钿工艺"})]}),e.jsxs("div",{className:"p-6 space-y-8 flex-1 overflow-y-auto",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest uppercase",children:"1. 引入胎体 (STL)"}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"file",accept:".stl",onChange:i,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"}),e.jsxs("div",{className:"w-full py-10 rounded-xl border-2 border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center gap-3 group hover:border-purple-500/50 hover:bg-black/60 transition-all duration-300",children:[e.jsx("div",{className:"p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-colors",children:e.jsx(w,{className:"w-6 h-6 text-white/30 group-hover:text-purple-400.transition-colors"})}),e.jsx("span",{className:"text-xs font-bold text-white/40 group-hover:text-purple-300 tracking-wider",children:"点击或拖拽上传素模"})]})]})]}),t&&e.jsxs("div",{className:"space-y-5 p-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500",children:[e.jsxs("label",{className:"text-xs font-bold text-white/50 flex justify-between tracking-widest uppercase",children:[e.jsx("span",{children:"2. 螺片镶嵌密度"}),e.jsxs("span",{className:"text-purple-400 font-mono",children:[s," CP"]})]}),e.jsx("input",{type:"range",min:"5",max:"100",step:"1",value:s,onChange:a=>r(Number(a.target.value)),className:"w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"}),e.jsx("p",{className:"text-[10px] text-white/30 leading-relaxed italic",children:"系统正在 3D 欧几里得空间内实时解构特征点，模拟天然贝壳碎裂产生的冰裂纹路。"})]})]}),e.jsxs("div",{className:"p-6 mt-auto",children:[e.jsxs("button",{className:"w-full py-4 rounded-xl bg-white/5 border border-white/10 font-black text-[10px] tracking-widest uppercase text-white/20 flex justify-center items-center gap-2 cursor-not-allowed group",children:[e.jsx(N,{className:"w-4 h-4 opacity-50"})," 顶点染色导出 (TODO)"]}),e.jsx("p",{className:"text-center text-[9px] text-white/20 mt-4 font-bold tracking-tighter uppercase",children:"Physical Splicing Engine v1.0"})]})]}),e.jsxs("div",{className:"flex-1 relative bg-[#050505] cursor-move",children:[e.jsxs(g,{camera:{position:[0,0,150],fov:45},children:[e.jsx("color",{attach:"background",args:["#050505"]}),e.jsx("ambientLight",{intensity:1.5}),e.jsx("directionalLight",{position:[50,100,100],intensity:2.5}),e.jsx("spotLight",{position:[-50,50,50],angle:.15,penumbra:1,intensity:1}),e.jsx(b,{preset:"studio"}),e.jsx(v,{makeDefault:!0,enableDamping:!0,dampingFactor:.05}),e.jsx(y,{children:t?e.jsx(k,{geometry:t,density:s}):e.jsxs("mesh",{scale:[1,1,1],children:[e.jsx("boxGeometry",{args:[40,40,40]}),e.jsx("meshStandardMaterial",{color:"#222222",wireframe:!0,opacity:.2,transparent:!0})]})})]}),!t&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:e.jsxs("div",{className:"text-center space-y-4 opacity-20",children:[e.jsx(S,{className:"w-12 h-12 mx-auto text-white"}),e.jsx("p",{className:"text-xs font-black tracking-[0.5em] uppercase text-white",children:"等待胎体装载"})]})})]})]})}export{B as default};
