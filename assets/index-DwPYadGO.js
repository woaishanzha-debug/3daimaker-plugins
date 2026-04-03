import{r as d,j as r,R as ve}from"./index-D0VM6bl6.js";import{v as le,u as we,_ as F,C as Se,E as _e,O as Ee,a as Le}from"./Environment-BClIKGbK.js";import{c as q}from"./createLucideIcon-C4GCbR9s.js";import{B as Me}from"./box-BoD1qBDw.js";import{E as Ae}from"./eraser-Bp96ONgN.js";import{T as je}from"./trash-2-Cu8ZzHWY.js";import{D as Ne}from"./download-BPSMUTTx.js";import{C as Ue}from"./Center-zdBh2u5C.js";import{aK as Ce,d as $,aL as X,aA as O,aM as ze,u as J,s as ce,a as N,aJ as Pe,aN as Q,aO as ee,V as de,f as Te,x as I,q as Be,t as P,at as Oe,i as Ie,aP as De,X as H,E as fe,aQ as ue,C as ke,T as Re,b as pe,c as qe}from"./OrbitControls-DkaTp16U.js";const he=le>=125?"uv1":"uv2",te=new J,D=new N;class Y extends Ce{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],t=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],n=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(n),this.setAttribute("position",new $(e,3)),this.setAttribute("uv",new $(t,2))}applyMatrix4(e){const t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));const n=new X(t,6,1);return this.setAttribute("instanceStart",new O(n,3,0)),this.setAttribute("instanceEnd",new O(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const i=new X(n,t*2,1);return this.setAttribute("instanceColorStart",new O(i,t,0)),this.setAttribute("instanceColorEnd",new O(i,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new ze(e.geometry)),this}fromLineSegments(e){const t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new J);const e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),te.setFromBufferAttribute(t),this.boundingBox.union(te))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ce),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){const n=this.boundingSphere.center;this.boundingBox.getCenter(n);let i=0;for(let s=0,l=e.count;s<l;s++)D.fromBufferAttribute(e,s),i=Math.max(i,n.distanceToSquared(D)),D.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(D));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}class me extends Y{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){const t=e.length-3,n=new Float32Array(2*t);for(let i=0;i<t;i+=3)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];return super.setPositions(n),this}setColors(e,t=3){const n=e.length-t,i=new Float32Array(2*n);if(t===3)for(let s=0;s<n;s+=t)i[2*s]=e[s],i[2*s+1]=e[s+1],i[2*s+2]=e[s+2],i[2*s+3]=e[s+3],i[2*s+4]=e[s+4],i[2*s+5]=e[s+5];else for(let s=0;s<n;s+=t)i[2*s]=e[s],i[2*s+1]=e[s+1],i[2*s+2]=e[s+2],i[2*s+3]=e[s+3],i[2*s+4]=e[s+4],i[2*s+5]=e[s+5],i[2*s+6]=e[s+6],i[2*s+7]=e[s+7];return super.setColors(i,t),this}fromLine(e){const t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class K extends Pe{constructor(e){super({type:"LineMaterial",uniforms:Q.clone(Q.merge([ee.common,ee.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new de(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${le>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(t){this.uniforms.diffuse.value=t}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(t){t===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(t){this.uniforms.linewidth.value=t}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(t){!!t!="USE_DASH"in this.defines&&(this.needsUpdate=!0),t===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(t){this.uniforms.dashScale.value=t}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(t){this.uniforms.dashSize.value=t}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(t){this.uniforms.dashOffset.value=t}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(t){this.uniforms.gapSize.value=t}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(t){this.uniforms.opacity.value=t}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(t){this.uniforms.resolution.value.copy(t)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(t){!!t!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),t===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}const G=new I,ne=new N,ie=new N,w=new I,S=new I,C=new I,W=new N,V=new P,_=new Be,se=new N,k=new J,R=new ce,z=new I;let T,B;function re(a,e,t){return z.set(0,0,-e,1).applyMatrix4(a.projectionMatrix),z.multiplyScalar(1/z.w),z.x=B/t.width,z.y=B/t.height,z.applyMatrix4(a.projectionMatrixInverse),z.multiplyScalar(1/z.w),Math.abs(Math.max(z.x,z.y))}function He(a,e){const t=a.matrixWorld,n=a.geometry,i=n.attributes.instanceStart,s=n.attributes.instanceEnd,l=Math.min(n.instanceCount,i.count);for(let o=0,m=l;o<m;o++){_.start.fromBufferAttribute(i,o),_.end.fromBufferAttribute(s,o),_.applyMatrix4(t);const f=new N,p=new N;T.distanceSqToSegment(_.start,_.end,p,f),p.distanceTo(f)<B*.5&&e.push({point:p,pointOnLine:f,distance:T.origin.distanceTo(p),object:a,face:null,faceIndex:o,uv:null,[he]:null})}}function Ge(a,e,t){const n=e.projectionMatrix,s=a.material.resolution,l=a.matrixWorld,o=a.geometry,m=o.attributes.instanceStart,f=o.attributes.instanceEnd,p=Math.min(o.instanceCount,m.count),c=-e.near;T.at(1,C),C.w=1,C.applyMatrix4(e.matrixWorldInverse),C.applyMatrix4(n),C.multiplyScalar(1/C.w),C.x*=s.x/2,C.y*=s.y/2,C.z=0,W.copy(C),V.multiplyMatrices(e.matrixWorldInverse,l);for(let g=0,x=p;g<x;g++){if(w.fromBufferAttribute(m,g),S.fromBufferAttribute(f,g),w.w=1,S.w=1,w.applyMatrix4(V),S.applyMatrix4(V),w.z>c&&S.z>c)continue;if(w.z>c){const u=w.z-S.z,E=(w.z-c)/u;w.lerp(S,E)}else if(S.z>c){const u=S.z-w.z,E=(S.z-c)/u;S.lerp(w,E)}w.applyMatrix4(n),S.applyMatrix4(n),w.multiplyScalar(1/w.w),S.multiplyScalar(1/S.w),w.x*=s.x/2,w.y*=s.y/2,S.x*=s.x/2,S.y*=s.y/2,_.start.copy(w),_.start.z=0,_.end.copy(S),_.end.z=0;const y=_.closestPointToPointParameter(W,!0);_.at(y,se);const L=Oe.lerp(w.z,S.z,y),b=L>=-1&&L<=1,U=W.distanceTo(se)<B*.5;if(b&&U){_.start.fromBufferAttribute(m,g),_.end.fromBufferAttribute(f,g),_.start.applyMatrix4(l),_.end.applyMatrix4(l);const u=new N,E=new N;T.distanceSqToSegment(_.start,_.end,E,u),t.push({point:E,pointOnLine:u,distance:T.origin.distanceTo(E),object:a,face:null,faceIndex:g,uv:null,[he]:null})}}}class ge extends Te{constructor(e=new Y,t=new K({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let l=0,o=0,m=t.count;l<m;l++,o+=2)ne.fromBufferAttribute(t,l),ie.fromBufferAttribute(n,l),i[o]=o===0?0:i[o-1],i[o+1]=i[o]+ne.distanceTo(ie);const s=new X(i,2,1);return e.setAttribute("instanceDistanceStart",new O(s,1,0)),e.setAttribute("instanceDistanceEnd",new O(s,1,1)),this}raycast(e,t){const n=this.material.worldUnits,i=e.camera;i===null&&!n&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const s=e.params.Line2!==void 0&&e.params.Line2.threshold||0;T=e.ray;const l=this.matrixWorld,o=this.geometry,m=this.material;B=m.linewidth+s,o.boundingSphere===null&&o.computeBoundingSphere(),R.copy(o.boundingSphere).applyMatrix4(l);let f;if(n)f=B*.5;else{const c=Math.max(i.near,R.distanceToPoint(T.origin));f=re(i,c,m.resolution)}if(R.radius+=f,T.intersectsSphere(R)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),k.copy(o.boundingBox).applyMatrix4(l);let p;if(n)p=B*.5;else{const c=Math.max(i.near,k.distanceToPoint(T.origin));p=re(i,c,m.resolution)}k.expandByScalar(p),T.intersectsBox(k)!==!1&&(n?He(this,t):Ge(this,i,t))}onBeforeRender(e){const t=this.material.uniforms;t&&t.resolution&&(e.getViewport(G),this.material.uniforms.resolution.value.set(G.z,G.w))}}class We extends ge{constructor(e=new me,t=new K({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type="Line2"}}const Ve=d.forwardRef(function({points:e,color:t=16777215,vertexColors:n,linewidth:i,lineWidth:s,segments:l,dashed:o,...m},f){var p,c;const g=we(b=>b.size),x=d.useMemo(()=>l?new ge:new We,[l]),[h]=d.useState(()=>new K),y=(n==null||(p=n[0])==null?void 0:p.length)===4?4:3,L=d.useMemo(()=>{const b=l?new Y:new me,U=e.map(u=>{const E=Array.isArray(u);return u instanceof N||u instanceof I?[u.x,u.y,u.z]:u instanceof de?[u.x,u.y,0]:E&&u.length===3?[u[0],u[1],u[2]]:E&&u.length===2?[u[0],u[1],0]:u});if(b.setPositions(U.flat()),n){t=16777215;const u=n.map(E=>E instanceof Ie?E.toArray():E);b.setColors(u.flat(),y)}return b},[e,l,n,y]);return d.useLayoutEffect(()=>{x.computeLineDistances()},[e,x]),d.useLayoutEffect(()=>{o?h.defines.USE_DASH="":delete h.defines.USE_DASH,h.needsUpdate=!0},[o,h]),d.useEffect(()=>()=>{L.dispose(),h.dispose()},[L]),d.createElement("primitive",F({object:x,ref:f},m),d.createElement("primitive",{object:L,attach:"geometry"}),d.createElement("primitive",F({object:h,attach:"material",color:t,vertexColors:!!n,resolution:[g.width,g.height],linewidth:(c=i??s)!==null&&c!==void 0?c:1,dashed:o,transparent:y===4},m)))}),Fe=d.forwardRef(({threshold:a=15,geometry:e,...t},n)=>{const i=d.useRef(null);d.useImperativeHandle(n,()=>i.current,[]);const s=d.useMemo(()=>[0,0,0,1,0,0],[]),l=d.useRef(),o=d.useRef();return d.useLayoutEffect(()=>{const m=i.current.parent,f=e??(m==null?void 0:m.geometry);if(!f||l.current===f&&o.current===a)return;l.current=f,o.current=a;const c=new De(f,a).attributes.position.array;i.current.geometry.setPositions(c),i.current.geometry.attributes.instanceStart.needsUpdate=!0,i.current.geometry.attributes.instanceEnd.needsUpdate=!0,i.current.computeLineDistances()}),d.createElement(Ve,F({segments:!0,points:s,ref:i,raycast:()=>null},t))});/**
 * @license lucide-react v1.6.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=[["path",{d:"M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2",key:"1fvzgz"}],["path",{d:"M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2",key:"1kc0my"}],["path",{d:"M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8",key:"10h0bg"}],["path",{d:"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",key:"1s1gnw"}]],Xe=q("hand",$e);/**
 * @license lucide-react v1.6.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze=[["path",{d:"M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z",key:"15q6uc"}],["path",{d:"m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845",key:"byia6g"}]],Je=q("layers-2",Ze);/**
 * @license lucide-react v1.6.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]],Ke=q("pencil",Ye);/**
 * @license lucide-react v1.6.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=[["path",{d:"M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z",key:"1bo67w"}],["rect",{x:"3",y:"14",width:"7",height:"7",rx:"1",key:"1bkyp8"}],["circle",{cx:"17.5",cy:"17.5",r:"3.5",key:"w3z12y"}]],ae=q("shapes",Qe),v=30,Z=v*Math.sqrt(3)/2,oe=["#ffffff","#ef4444","#f59e0b","#10b981","#3b82f6"],M=Math.PI-125.264*Math.PI/180,A=Math.PI-135*Math.PI/180,j=Math.PI-144.736*Math.PI/180,xe=new pe().moveTo(-v/2,0).lineTo(v/2,0).lineTo(v/2,v).lineTo(-v/2,v),et=new pe().moveTo(-v/2,0).lineTo(v/2,0).lineTo(0,Z),ye=et,tt=new fe(xe,{depth:.8,bevelEnabled:!1}),nt=new fe(ye,{depth:.8,bevelEnabled:!1}),it=new ue(xe),st=new ue(ye),rt=a=>{const e=new qe;return e.setAttribute("position",new $([-a/2,0,.81,a/2,0,.81],3)),e},at=rt(v),ot={id:"s0",type:"square",edge:0,fa:M,children:[{id:"t1",type:"triangle",edge:0,fa:M,children:[{id:"s1",type:"square",edge:1,fa:M,children:[{id:"t5",type:"triangle",edge:0,fa:M,children:[{id:"s5",type:"square",edge:2,fa:M,children:[]}]}]}]},{id:"t2",type:"triangle",edge:1,fa:M,children:[{id:"s2",type:"square",edge:1,fa:M,children:[{id:"t6",type:"triangle",edge:0,fa:M,children:[]}]}]},{id:"t3",type:"triangle",edge:2,fa:M,children:[{id:"s3",type:"square",edge:1,fa:M,children:[{id:"t7",type:"triangle",edge:0,fa:M,children:[]}]}]},{id:"t4",type:"triangle",edge:3,fa:M,children:[{id:"s4",type:"square",edge:1,fa:M,children:[{id:"t8",type:"triangle",edge:0,fa:M,children:[]}]}]}]},lt={id:"s0",type:"square",edge:0,fa:A,children:[{id:"s1",type:"square",edge:0,fa:A,children:[{id:"t1",type:"triangle",edge:1,fa:j,children:[{id:"s13",type:"square",edge:1,fa:j,children:[{id:"t5",type:"triangle",edge:0,fa:j,children:[]}]}]},{id:"t2",type:"triangle",edge:3,fa:j,children:[{id:"s14",type:"square",edge:1,fa:j,children:[{id:"t6",type:"triangle",edge:0,fa:j,children:[]}]}]},{id:"s5",type:"square",edge:0,fa:A,children:[{id:"s9",type:"square",edge:0,fa:A,children:[]}]}]},{id:"s2",type:"square",edge:1,fa:A,children:[{id:"s6",type:"square",edge:0,fa:A,children:[{id:"s10",type:"square",edge:0,fa:A,children:[]}]}]},{id:"s3",type:"square",edge:2,fa:A,children:[{id:"t3",type:"triangle",edge:1,fa:j,children:[{id:"s15",type:"square",edge:1,fa:j,children:[{id:"t7",type:"triangle",edge:0,fa:j,children:[]}]}]},{id:"t4",type:"triangle",edge:3,fa:j,children:[{id:"s16",type:"square",edge:1,fa:j,children:[{id:"t8",type:"triangle",edge:0,fa:j,children:[]}]}]},{id:"s7",type:"square",edge:0,fa:A,children:[{id:"s11",type:"square",edge:0,fa:A,children:[]}]}]},{id:"s4",type:"square",edge:3,fa:A,children:[{id:"s8",type:"square",edge:0,fa:A,children:[{id:"s12",type:"square",edge:0,fa:A,children:[{id:"s17",type:"square",edge:0,fa:A,children:[]}]}]}]}]},ct=({points:a,color:e})=>{const t=d.useMemo(()=>{let n=a;if(a.length===1&&(n=[a[0],a[0].clone().add(new N(0,.001,0))]),n.length<2)return null;const i=new ke(n,!1,"centripetal",.5);return new Re(i,Math.max(10,n.length*2),.5,8,!1)},[a]);return t?r.jsx("mesh",{geometry:t,raycast:()=>null,children:r.jsx("meshStandardMaterial",{color:e,roughness:.6,metalness:.1})}):null};function be(a){const e=[];function t(n,i,s,l,o){const m=new P,f=new P;let p=0,c=0,g=0;o?(p=0,c=-v/2,g=0):i==="square"?(n.edge===0&&(p=0,c=v,g=0),n.edge===1&&(p=v/2,c=v/2,g=-Math.PI/2),n.edge===2&&(p=0,c=0,g=Math.PI),n.edge===3&&(p=-v/2,c=v/2,g=Math.PI/2)):(n.edge===0&&(p=0,c=0,g=Math.PI),n.edge===1&&(p=v/4,c=Z/2,g=-Math.PI/3),n.edge===2&&(p=-v/4,c=Z/2,g=Math.PI/3));const x=new P().makeTranslation(p,c,0),h=new P().makeRotationZ(g);if(m.multiply(x).multiply(h),f.multiply(x).multiply(h),!o){const b=new P().makeRotationX(-n.fa);f.multiply(b)}const y=s.clone().multiply(m),L=l.clone().multiply(f);if(e.push({id:n.id,type:n.type,flatMatrix:y,assembledMatrix:L}),n.children)for(const b of n.children)t(b,n.type,y,L,!1)}return t(a,null,new P,new P,!0),e}const dt=be(ot),ft=be(lt),ut=ve.memo(({faceDef:a,viewMode:e,strokes:t})=>{const n=d.useRef(null),i=a.type==="square",s=e==="assemble";return Le(()=>{if(!n.current)return;const l=s?a.assembledMatrix:a.flatMatrix;if(n.current.matrixAutoUpdate=!1,n.current.matrix.copy(l),s){const o=new P().makeRotationX(-Math.PI/2).premultiply(new P().makeRotationY(Math.PI/4));n.current.matrix.premultiply(o)}n.current.updateMatrixWorld(!0)}),r.jsxs("group",{ref:n,userData:{faceId:a.id},children:[r.jsxs("mesh",{geometry:i?tt:nt,children:[r.jsx("meshStandardMaterial",{color:"#1a1a1a",roughness:.4}),r.jsx(Fe,{scale:1.001,threshold:1,color:"#ffffff",opacity:.6,transparent:!0})]}),r.jsx("mesh",{geometry:i?it:st,position:[0,0,.81],userData:{isPaper:!0},children:r.jsx("meshStandardMaterial",{color:"#111111",roughness:.8})}),!s&&a.id!=="s0"&&r.jsx("lineSegments",{geometry:at,children:r.jsx("lineDashedMaterial",{color:"#ffffff",dashSize:2,gapSize:2,opacity:.8,transparent:!0})}),t.filter(l=>l.faceId===a.id).map(l=>r.jsx(ct,{points:l.points,color:l.color},l.id))]})}),pt=({activeTopology:a,viewMode:e,activeTool:t,activeColor:n,strokes:i,setStrokes:s})=>{const l=d.useRef(!1),o=d.useRef(null),m=a==="NET_14"?dt:ft,f=x=>{const h=x.intersections.find(U=>U.object.userData.isPaper);if(!h)return null;const y=h.object.parent,L=y.userData.faceId,b=y.worldToLocal(h.point.clone());return b.z+=.25,{faceId:L,pt:b}},p=d.useCallback(x=>{if(t==="drag"||e!=="paint")return;const h=f(x);h&&(l.current=!0,x.stopPropagation(),o.current=h,s(y=>[...y,{id:Date.now(),faceId:h.faceId,color:t==="eraser"?"#ffffff":n,points:[h.pt]}]))},[t,e,n]),c=d.useCallback(x=>{if(!l.current||t==="drag"||e!=="paint")return;const h=f(x);if(!h){o.current=null;return}x.stopPropagation(),o.current&&o.current.faceId!==h.faceId?s(y=>[...y,{id:Date.now(),faceId:h.faceId,color:t==="eraser"?"#ffffff":n,points:[h.pt]}]):s(y=>{const L=[...y],b=L.filter(E=>E.faceId===h.faceId);if(b.length===0)return y;const U=b[b.length-1],u=U.points[U.points.length-1];return u&&u.distanceTo(h.pt)>.5&&(U.points=[...U.points,h.pt]),L}),o.current=h},[t,e,n]),g=()=>{l.current=!1,o.current=null};return r.jsx("group",{onPointerDown:p,onPointerMove:c,onPointerUp:g,onPointerLeave:g,children:m.map(x=>r.jsx(ut,{faceDef:x,viewMode:e,strokes:i},x.id))})};function _t(){const[a,e]=d.useState("paint"),[t,n]=d.useState("pencil"),[i,s]=d.useState(oe[0]),[l,o]=d.useState("NET_14"),[m,f]=d.useState([]),p=d.useMemo(()=>t==="drag"?"cursor-grab":a==="paint"?"cursor-crosshair":"cursor-alias",[t,a]);return r.jsxs("div",{className:"w-full h-screen flex bg-[#0a0a0a] text-white font-sans overflow-hidden",children:[r.jsxs("div",{className:"w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl",children:[r.jsxs("div",{className:"p-6 border-b border-white/10",children:[r.jsx("span",{className:"px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest",children:"L1-16"}),r.jsx("h1",{className:"font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase",children:"煤精组印"})]}),r.jsxs("div",{className:"p-6 space-y-8 flex-1 overflow-y-auto",children:[r.jsxs("div",{className:"space-y-3",children:[r.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest",children:"拓扑底板结构"}),r.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[r.jsxs("button",{onClick:()=>{o("NET_14"),f([])},className:`py-4 rounded-xl text-xs font-black tracking-widest uppercase border transition-all ${l==="NET_14"?"bg-blue-600/20 border-blue-500 text-blue-400":"border-white/5 text-white/30"}`,children:[r.jsx(ae,{className:"w-4 h-4 mx-auto mb-2 opacity-50"})," 14面体"]}),r.jsxs("button",{onClick:()=>{o("NET_26"),f([])},className:`py-4 rounded-xl text-xs font-black tracking-widest uppercase border transition-all ${l==="NET_26"?"bg-purple-600/20 border-purple-500 text-purple-400":"border-white/5 text-white/30"}`,children:[r.jsx(ae,{className:"w-4 h-4 mx-auto mb-2 opacity-50"})," 26面体"]})]})]}),r.jsxs("div",{className:"space-y-3",children:[r.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest",children:"工坊阶段"}),r.jsxs("div",{className:"flex bg-black/40 rounded-xl p-1 border border-white/5",children:[r.jsxs("button",{onClick:()=>e("paint"),className:`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${a==="paint"?"bg-emerald-600 text-white shadow-lg":"text-white/40"}`,children:[r.jsx(Je,{className:"w-4 h-4"})," 1. 平铺作画"]}),r.jsxs("button",{onClick:()=>e("assemble"),className:`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${a==="assemble"?"bg-blue-600 text-white shadow-lg":"text-white/40"}`,children:[r.jsx(Me,{className:"w-4 h-4"})," 2. 立体组装"]})]})]}),r.jsxs("div",{className:"space-y-4",children:[r.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest",children:"工具箱 (互斥操作)"}),r.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[r.jsx("button",{onClick:()=>n("drag"),className:`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${t==="drag"?"bg-amber-600 border-amber-500 shadow-xl":"bg-white/5 border-white/10 hover:bg-white/10"}`,children:r.jsx(Xe,{className:"w-6 h-6"})}),r.jsx("button",{onClick:()=>n("pencil"),className:`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${t==="pencil"?"bg-emerald-600 border-emerald-500 shadow-xl":"bg-white/5 border-white/10 hover:bg-white/10"}`,children:r.jsx(Ke,{className:"w-6 h-6"})}),t!=="drag"&&r.jsx("div",{className:"col-span-2 space-y-3 pt-3",children:r.jsxs("div",{className:"flex gap-2.5",children:[r.jsx("button",{onClick:()=>n("eraser"),className:`p-2 rounded flex-1 flex justify-center items-center border ${t==="eraser"?"bg-white text-black border-white":"bg-black text-white border-white/20"}`,children:r.jsx(Ae,{className:"w-4 h-4"})}),oe.map(c=>r.jsx("button",{onClick:()=>{s(c),n("pencil")},className:`w-8 h-8 rounded-full border-2 transition-transform ${i===c&&t==="pencil"?"border-white scale-110":"border-transparent"}`,style:{backgroundColor:c}},c))]})})]})]}),r.jsx("div",{className:"flex gap-2 pt-4 border-t border-white/10",children:r.jsxs("button",{onClick:()=>f([]),className:"flex-1 py-4 rounded-xl bg-white/5 text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-red-400 hover:border-red-500/50 border border-transparent transition-all",children:[r.jsx(je,{className:"w-4 h-4 mx-auto mb-1"})," 清理印面"]})})]}),r.jsx("div",{className:"p-6",children:r.jsxs("button",{className:"w-full py-4 rounded bg-neutral-800 font-bold text-sm flex justify-center items-center gap-2 text-white/50 cursor-not-allowed",children:[r.jsx(Ne,{className:"w-4 h-4"})," 导出 3MF 物理切片 (TODO)"]})})]}),r.jsx("div",{className:`flex-1 relative bg-[#f8f9fa] ${p}`,children:r.jsxs(Se,{camera:{position:[0,0,260],fov:45},children:[r.jsx("color",{attach:"background",args:["#f8f9fa"]}),r.jsx("ambientLight",{intensity:.9}),r.jsx("directionalLight",{position:[50,100,100],intensity:1.5}),r.jsx(_e,{preset:"city"}),r.jsx(Ee,{makeDefault:!0,enableRotate:a==="assemble"||t==="drag",mouseButtons:{LEFT:t==="drag"?H.ROTATE:null,MIDDLE:H.DOLLY,RIGHT:H.ROTATE}}),r.jsx(Ue,{children:r.jsx(pt,{activeTopology:l,viewMode:a,activeTool:t,activeColor:i,strokes:m,setStrokes:f})})]})})]})}export{_t as default};
