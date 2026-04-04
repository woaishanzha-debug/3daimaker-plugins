import{r as f,j as r,R as We}from"./index-CeyddRE4.js";import{v as Le,u as Ae,_ as ne,C as Fe,E as Ve,O as $e,b as Xe}from"./Environment-BOlnNKUd.js";import{e as Ye}from"./index-BkN_76pY.js";import{c as J}from"./createLucideIcon-VBfN7eyA.js";import{B as Ze}from"./box-DETgab1P.js";import{E as Je}from"./eraser-C9FuXSjJ.js";import{T as Ke}from"./trash-2-aBIazU-D.js";import{D as Qe}from"./download-DXVgzG_Q.js";import{C as et}from"./Center-BzHLMkxE.js";import{aN as tt,d as ie,aO as se,av as q,aP as nt,u as re,s as je,a as M,aM as it,aQ as he,aR as me,V as Ne,f as X,x as G,q as st,t as T,ao as rt,i as at,aS as ot,K,I as ge,h as xe,E as Y,C as Ue,T as Ce,aB as ye,b as Pe,aT as Te,c as lt}from"./OrbitControls-CISZ-O8Q.js";const ze=Le>=125?"uv1":"uv2",be=new re,F=new M;class ae extends tt{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],t=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],n=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(n),this.setAttribute("position",new ie(e,3)),this.setAttribute("uv",new ie(t,2))}applyMatrix4(e){const t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));const n=new se(t,6,1);return this.setAttribute("instanceStart",new q(n,3,0)),this.setAttribute("instanceEnd",new q(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const i=new se(n,t*2,1);return this.setAttribute("instanceColorStart",new q(i,t,0)),this.setAttribute("instanceColorEnd",new q(i,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new nt(e.geometry)),this}fromLineSegments(e){const t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new re);const e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),be.setFromBufferAttribute(t),this.boundingBox.union(be))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new je),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){const n=this.boundingSphere.center;this.boundingBox.getCenter(n);let i=0;for(let s=0,l=e.count;s<l;s++)F.fromBufferAttribute(e,s),i=Math.max(i,n.distanceToSquared(F)),F.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(F));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}class Be extends ae{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){const t=e.length-3,n=new Float32Array(2*t);for(let i=0;i<t;i+=3)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];return super.setPositions(n),this}setColors(e,t=3){const n=e.length-t,i=new Float32Array(2*n);if(t===3)for(let s=0;s<n;s+=t)i[2*s]=e[s],i[2*s+1]=e[s+1],i[2*s+2]=e[s+2],i[2*s+3]=e[s+3],i[2*s+4]=e[s+4],i[2*s+5]=e[s+5];else for(let s=0;s<n;s+=t)i[2*s]=e[s],i[2*s+1]=e[s+1],i[2*s+2]=e[s+2],i[2*s+3]=e[s+3],i[2*s+4]=e[s+4],i[2*s+5]=e[s+5],i[2*s+6]=e[s+6],i[2*s+7]=e[s+7];return super.setColors(i,t),this}fromLine(e){const t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class oe extends it{constructor(e){super({type:"LineMaterial",uniforms:he.clone(he.merge([me.common,me.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new Ne(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
					#include <${Le>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(t){this.uniforms.diffuse.value=t}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(t){t===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(t){this.uniforms.linewidth.value=t}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(t){!!t!="USE_DASH"in this.defines&&(this.needsUpdate=!0),t===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(t){this.uniforms.dashScale.value=t}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(t){this.uniforms.dashSize.value=t}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(t){this.uniforms.dashOffset.value=t}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(t){this.uniforms.gapSize.value=t}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(t){this.uniforms.opacity.value=t}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(t){this.uniforms.resolution.value.copy(t)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(t){!!t!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),t===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}const Q=new G,ve=new M,we=new M,S=new G,E=new G,C=new G,ee=new M,te=new T,_=new st,Se=new M,V=new re,$=new je,P=new G;let z,D;function Ee(a,e,t){return P.set(0,0,-e,1).applyMatrix4(a.projectionMatrix),P.multiplyScalar(1/P.w),P.x=D/t.width,P.y=D/t.height,P.applyMatrix4(a.projectionMatrixInverse),P.multiplyScalar(1/P.w),Math.abs(Math.max(P.x,P.y))}function ct(a,e){const t=a.matrixWorld,n=a.geometry,i=n.attributes.instanceStart,s=n.attributes.instanceEnd,l=Math.min(n.instanceCount,i.count);for(let o=0,x=l;o<x;o++){_.start.fromBufferAttribute(i,o),_.end.fromBufferAttribute(s,o),_.applyMatrix4(t);const m=new M,h=new M;z.distanceSqToSegment(_.start,_.end,h,m),h.distanceTo(m)<D*.5&&e.push({point:h,pointOnLine:m,distance:z.origin.distanceTo(h),object:a,face:null,faceIndex:o,uv:null,[ze]:null})}}function dt(a,e,t){const n=e.projectionMatrix,s=a.material.resolution,l=a.matrixWorld,o=a.geometry,x=o.attributes.instanceStart,m=o.attributes.instanceEnd,h=Math.min(o.instanceCount,x.count),p=-e.near;z.at(1,C),C.w=1,C.applyMatrix4(e.matrixWorldInverse),C.applyMatrix4(n),C.multiplyScalar(1/C.w),C.x*=s.x/2,C.y*=s.y/2,C.z=0,ee.copy(C),te.multiplyMatrices(e.matrixWorldInverse,l);for(let y=0,L=h;y<L;y++){if(S.fromBufferAttribute(x,y),E.fromBufferAttribute(m,y),S.w=1,E.w=1,S.applyMatrix4(te),E.applyMatrix4(te),S.z>p&&E.z>p)continue;if(S.z>p){const c=S.z-E.z,g=(S.z-p)/c;S.lerp(E,g)}else if(E.z>p){const c=E.z-S.z,g=(E.z-p)/c;E.lerp(S,g)}S.applyMatrix4(n),E.applyMatrix4(n),S.multiplyScalar(1/S.w),E.multiplyScalar(1/E.w),S.x*=s.x/2,S.y*=s.y/2,E.x*=s.x/2,E.y*=s.y/2,_.start.copy(S),_.start.z=0,_.end.copy(E),_.end.z=0;const j=_.closestPointToPointParameter(ee,!0);_.at(j,Se);const d=rt.lerp(S.z,E.z,j),u=d>=-1&&d<=1,b=ee.distanceTo(Se)<D*.5;if(u&&b){_.start.fromBufferAttribute(x,y),_.end.fromBufferAttribute(m,y),_.start.applyMatrix4(l),_.end.applyMatrix4(l);const c=new M,g=new M;z.distanceSqToSegment(_.start,_.end,g,c),t.push({point:g,pointOnLine:c,distance:z.origin.distanceTo(g),object:a,face:null,faceIndex:y,uv:null,[ze]:null})}}}class Ie extends X{constructor(e=new ae,t=new oe({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let l=0,o=0,x=t.count;l<x;l++,o+=2)ve.fromBufferAttribute(t,l),we.fromBufferAttribute(n,l),i[o]=o===0?0:i[o-1],i[o+1]=i[o]+ve.distanceTo(we);const s=new se(i,2,1);return e.setAttribute("instanceDistanceStart",new q(s,1,0)),e.setAttribute("instanceDistanceEnd",new q(s,1,1)),this}raycast(e,t){const n=this.material.worldUnits,i=e.camera;i===null&&!n&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const s=e.params.Line2!==void 0&&e.params.Line2.threshold||0;z=e.ray;const l=this.matrixWorld,o=this.geometry,x=this.material;D=x.linewidth+s,o.boundingSphere===null&&o.computeBoundingSphere(),$.copy(o.boundingSphere).applyMatrix4(l);let m;if(n)m=D*.5;else{const p=Math.max(i.near,$.distanceToPoint(z.origin));m=Ee(i,p,x.resolution)}if($.radius+=m,z.intersectsSphere($)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),V.copy(o.boundingBox).applyMatrix4(l);let h;if(n)h=D*.5;else{const p=Math.max(i.near,V.distanceToPoint(z.origin));h=Ee(i,p,x.resolution)}V.expandByScalar(h),z.intersectsBox(V)!==!1&&(n?ct(this,t):dt(this,i,t))}onBeforeRender(e){const t=this.material.uniforms;t&&t.resolution&&(e.getViewport(Q),this.material.uniforms.resolution.value.set(Q.z,Q.w))}}class ut extends Ie{constructor(e=new Be,t=new oe({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type="Line2"}}const ft=f.forwardRef(function({points:e,color:t=16777215,vertexColors:n,linewidth:i,lineWidth:s,segments:l,dashed:o,...x},m){var h,p;const y=Ae(u=>u.size),L=f.useMemo(()=>l?new Ie:new ut,[l]),[A]=f.useState(()=>new oe),j=(n==null||(h=n[0])==null?void 0:h.length)===4?4:3,d=f.useMemo(()=>{const u=l?new ae:new Be,b=e.map(c=>{const g=Array.isArray(c);return c instanceof M||c instanceof G?[c.x,c.y,c.z]:c instanceof Ne?[c.x,c.y,0]:g&&c.length===3?[c[0],c[1],c[2]]:g&&c.length===2?[c[0],c[1],0]:c});if(u.setPositions(b.flat()),n){t=16777215;const c=n.map(g=>g instanceof at?g.toArray():g);u.setColors(c.flat(),j)}return u},[e,l,n,j]);return f.useLayoutEffect(()=>{L.computeLineDistances()},[e,L]),f.useLayoutEffect(()=>{o?A.defines.USE_DASH="":delete A.defines.USE_DASH,A.needsUpdate=!0},[o,A]),f.useEffect(()=>()=>{d.dispose(),A.dispose()},[d]),f.createElement("primitive",ne({object:L,ref:m},x),f.createElement("primitive",{object:d,attach:"geometry"}),f.createElement("primitive",ne({object:A,attach:"material",color:t,vertexColors:!!n,resolution:[y.width,y.height],linewidth:(p=i??s)!==null&&p!==void 0?p:1,dashed:o,transparent:j===4},x)))}),pt=f.forwardRef(({threshold:a=15,geometry:e,...t},n)=>{const i=f.useRef(null);f.useImperativeHandle(n,()=>i.current,[]);const s=f.useMemo(()=>[0,0,0,1,0,0],[]),l=f.useRef(),o=f.useRef();return f.useLayoutEffect(()=>{const x=i.current.parent,m=e??(x==null?void 0:x.geometry);if(!m||l.current===m&&o.current===a)return;l.current=m,o.current=a;const p=new ot(m,a).attributes.position.array;i.current.geometry.setPositions(p),i.current.geometry.attributes.instanceStart.needsUpdate=!0,i.current.geometry.attributes.instanceEnd.needsUpdate=!0,i.current.computeLineDistances()}),f.createElement(ft,ne({segments:!0,points:s,ref:i,raycast:()=>null},t))});/**
 * @license lucide-react v1.6.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=[["path",{d:"M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2",key:"1fvzgz"}],["path",{d:"M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2",key:"1kc0my"}],["path",{d:"M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8",key:"10h0bg"}],["path",{d:"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",key:"1s1gnw"}]],mt=J("hand",ht);/**
 * @license lucide-react v1.6.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=[["path",{d:"M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z",key:"15q6uc"}],["path",{d:"m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845",key:"byia6g"}]],xt=J("layers-2",gt);/**
 * @license lucide-react v1.6.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yt=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]],bt=J("pencil",yt);/**
 * @license lucide-react v1.6.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vt=[["path",{d:"M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z",key:"1bo67w"}],["rect",{x:"3",y:"14",width:"7",height:"7",rx:"1",key:"1bkyp8"}],["circle",{cx:"17.5",cy:"17.5",r:"3.5",key:"w3z12y"}]],_e=J("shapes",vt),v=30,Z=v*Math.sqrt(3)/2,Me=["#ffffff","#ef4444","#f59e0b","#10b981","#3b82f6"],N=Math.PI-125.264*Math.PI/180,w=Math.PI-135*Math.PI/180,B=Math.PI-144.736*Math.PI/180,le=new Pe().moveTo(-v/2,0).lineTo(v/2,0).lineTo(v/2,v).lineTo(-v/2,v),wt=new Pe().moveTo(-v/2,0).lineTo(v/2,0).lineTo(0,Z),ce=wt,St=new Y(le,{depth:.8,bevelEnabled:!1}),Et=new Y(ce,{depth:.8,bevelEnabled:!1}),_t=new Te(le),Mt=new Te(ce),Lt=a=>{const e=new lt;return e.setAttribute("position",new ie([-a/2,0,.81,a/2,0,.81],3)),e},At=Lt(v),jt={id:"s0",type:"square",edge:0,fa:N,children:[{id:"t1",type:"triangle",edge:0,fa:N,children:[{id:"s1",type:"square",edge:1,fa:N,children:[{id:"t5",type:"triangle",edge:0,fa:N,children:[{id:"s5",type:"square",edge:2,fa:N,children:[]}]}]}]},{id:"t2",type:"triangle",edge:1,fa:N,children:[{id:"s2",type:"square",edge:1,fa:N,children:[{id:"t6",type:"triangle",edge:0,fa:N,children:[]}]}]},{id:"t3",type:"triangle",edge:2,fa:N,children:[{id:"s3",type:"square",edge:1,fa:N,children:[{id:"t7",type:"triangle",edge:0,fa:N,children:[]}]}]},{id:"t4",type:"triangle",edge:3,fa:N,children:[{id:"s4",type:"square",edge:1,fa:N,children:[{id:"t8",type:"triangle",edge:0,fa:N,children:[]}]}]}]},Nt={id:"s0",type:"square",edge:0,fa:w,children:[{id:"s8",type:"square",edge:0,fa:w,children:[{id:"s16",type:"square",edge:0,fa:w,children:[]}]},{id:"s9",type:"square",edge:2,fa:w,children:[{id:"s17",type:"square",edge:0,fa:w,children:[]}]},{id:"s1",type:"square",edge:1,fa:w,children:[{id:"t0",type:"triangle",edge:3,fa:B,children:[]},{id:"t1",type:"triangle",edge:1,fa:B,children:[]},{id:"s2",type:"square",edge:0,fa:w,children:[{id:"s10",type:"square",edge:3,fa:w,children:[]},{id:"s11",type:"square",edge:1,fa:w,children:[]},{id:"s3",type:"square",edge:0,fa:w,children:[{id:"t2",type:"triangle",edge:3,fa:B,children:[]},{id:"t3",type:"triangle",edge:1,fa:B,children:[]},{id:"s4",type:"square",edge:0,fa:w,children:[{id:"s12",type:"square",edge:3,fa:w,children:[]},{id:"s13",type:"square",edge:1,fa:w,children:[]},{id:"s5",type:"square",edge:0,fa:w,children:[{id:"t4",type:"triangle",edge:3,fa:B,children:[]},{id:"t5",type:"triangle",edge:1,fa:B,children:[]},{id:"s6",type:"square",edge:0,fa:w,children:[{id:"s14",type:"square",edge:3,fa:w,children:[]},{id:"s15",type:"square",edge:1,fa:w,children:[]},{id:"s7",type:"square",edge:0,fa:w,children:[{id:"t6",type:"triangle",edge:3,fa:B,children:[]},{id:"t7",type:"triangle",edge:1,fa:B,children:[]}]}]}]}]}]}]}]}]},Ut=({tick:a})=>{const{camera:e,controls:t}=Ae();return f.useEffect(()=>{a>0&&(e.position.set(0,0,320),e.lookAt(0,0,0),t&&(t.target.set(0,0,0),t.update()))},[a,e,t]),null},Ct=({points:a,color:e})=>{const t=f.useMemo(()=>{let n=a;if(a.length===1&&(n=[a[0],a[0].clone().add(new M(0,.001,0))]),n.length<2)return null;const i=new Ue(n,!1,"centripetal",.5);return new Ce(i,Math.max(10,n.length*2),.5,8,!1)},[a]);return t?r.jsx("mesh",{geometry:t,raycast:()=>null,children:r.jsx("meshStandardMaterial",{color:e,roughness:.6,metalness:.1})}):null};function ke(a){const e=[];function t(n,i,s,l,o){const x=new T,m=new T;let h=0,p=0,y=0;o?(h=0,p=-v/2,y=0):i==="square"?(n.edge===0&&(h=0,p=v,y=0),n.edge===1&&(h=v/2,p=v/2,y=-Math.PI/2),n.edge===2&&(h=0,p=0,y=Math.PI),n.edge===3&&(h=-v/2,p=v/2,y=Math.PI/2)):(n.edge===0&&(h=0,p=0,y=Math.PI),n.edge===1&&(h=v/4,p=Z/2,y=-Math.PI/3),n.edge===2&&(h=-v/4,p=Z/2,y=Math.PI/3));const L=new T().makeTranslation(h,p,0),A=new T().makeRotationZ(y);if(x.multiply(L).multiply(A),m.multiply(L).multiply(A),!o){const u=new T().makeRotationX(-n.fa);m.multiply(u)}const j=s.clone().multiply(x),d=l.clone().multiply(m);if(e.push({id:n.id,type:n.type,flatMatrix:j,assembledMatrix:d}),n.children)for(const u of n.children)t(u,n.type,j,d,!1)}return t(a,null,new T,new T,!0),e}const Oe=ke(jt),De=ke(Nt),Pt=We.memo(({faceDef:a,viewMode:e,strokes:t})=>{const n=f.useRef(null),i=a.type==="square",s=e==="assemble";return Xe(()=>{if(!n.current)return;const l=s?a.assembledMatrix:a.flatMatrix;if(n.current.matrixAutoUpdate=!1,n.current.matrix.copy(l),s){const o=new T().makeRotationX(-Math.PI/2).premultiply(new T().makeRotationY(Math.PI/4));n.current.matrix.premultiply(o)}n.current.updateMatrixWorld(!0)}),r.jsxs("group",{ref:n,userData:{faceId:a.id},children:[r.jsxs("mesh",{geometry:i?St:Et,children:[r.jsx("meshStandardMaterial",{color:"#1a1a1a",roughness:.4}),r.jsx(pt,{scale:1.001,threshold:1,color:"#ffffff",opacity:.6,transparent:!0})]}),r.jsx("mesh",{geometry:i?_t:Mt,position:[0,0,.81],userData:{isPaper:!0},children:r.jsx("meshStandardMaterial",{color:"#111111",roughness:.8})}),!s&&a.id!=="s0"&&r.jsx("lineSegments",{geometry:At,children:r.jsx("lineDashedMaterial",{color:"#ffffff",dashSize:2,gapSize:2,opacity:.8,transparent:!0})}),t.filter(l=>l.faceId===a.id).map(l=>r.jsx(Ct,{points:l.points,color:l.color},l.id))]})}),Tt=({activeTopology:a,viewMode:e,activeTool:t,activeColor:n,strokes:i,setStrokes:s})=>{const l=f.useRef(!1),o=f.useRef(null),x=a==="NET_14"?Oe:De,m=a==="NET_26"?.85:1,h=f.useMemo(()=>a==="NET_26"&&e==="paint"?new ye(0,0,-Math.PI/2):new ye(0,0,0),[a,e]),p=f.useMemo(()=>a==="NET_26"&&e==="paint"?new M(0,100,0):new M(0,0,0),[a,e]),y=d=>{const u=d.intersections.find(U=>U.object.userData.isPaper);if(!u)return null;const b=u.object.parent,c=b.userData.faceId,g=b.worldToLocal(u.point.clone());return g.z+=.25,{faceId:c,pt:g}},L=f.useCallback(d=>{if(t==="drag"||e!=="paint")return;const u=y(d);if(u){if(d.stopPropagation(),t==="eraser"){s(b=>b.filter(c=>c.faceId!==u.faceId?!0:!c.points.some(g=>g.distanceToSquared(u.pt)<16)));return}l.current=!0,o.current=u,s(b=>[...b,{id:Date.now(),faceId:u.faceId,color:n,points:[u.pt]}])}},[t,e,n]),A=f.useCallback(d=>{if(t==="drag"||e!=="paint")return;const u=y(d);if(!u){o.current=null;return}if(d.stopPropagation(),t==="eraser"){d.buttons===1&&s(b=>b.filter(c=>c.faceId!==u.faceId?!0:!c.points.some(g=>g.distanceToSquared(u.pt)<16)));return}l.current&&(o.current&&o.current.faceId!==u.faceId?s(b=>[...b,{id:Date.now(),faceId:u.faceId,color:n,points:[u.pt]}]):s(b=>{const c=[...b],g=c.filter(I=>I.faceId===u.faceId);if(g.length===0)return b;const U=g[g.length-1],R=U.points[U.points.length-1];return R&&R.distanceTo(u.pt)>.5&&(U.points=[...U.points,u.pt]),c}),o.current=u)},[t,e,n]),j=()=>{l.current=!1,o.current=null};return r.jsx("group",{scale:m,rotation:h,position:p,onPointerDown:L,onPointerMove:A,onPointerUp:j,onPointerLeave:j,children:x.map(d=>r.jsx(Pt,{faceDef:d,viewMode:e,strokes:i},d.id))})};function Ft(){const[a,e]=f.useState("paint"),[t,n]=f.useState("pencil"),[i,s]=f.useState(Me[0]),[l,o]=f.useState("NET_14"),[x,m]=f.useState([]),[h,p]=f.useState(!1),[y,L]=f.useState(0),A=async()=>{p(!0),await new Promise(d=>setTimeout(d,50));try{const d=new ge,u=l==="NET_14"?Oe:De,b=new xe({color:"#1a1a1a",roughness:.8}),c={};u.forEach(R=>{const I=new ge;I.applyMatrix4(R.flatMatrix);const de=R.type==="square",ue=de?le:ce,fe=de?v/2:Z/3,Re=new Y(ue,{depth:.2,bevelEnabled:!1}),qe=new X(Re,b);I.add(qe);const Ge=new Y(ue,{depth:.4,bevelEnabled:!1}),H=new X(Ge,b);H.position.z=.2,H.position.y=fe,H.scale.set(.96,.96,1),H.position.y-=fe*.96,I.add(H),x.filter(k=>k.faceId===R.id).forEach(k=>{let O=k.points.map(W=>new M(W.x,W.y,0));if(O.length===1&&(O=[O[0],O[0].clone().add(new M(0,.001,0))]),O.length>=2){const W=new Ue(O,!1,"centripetal",.5),He=new Ce(W,Math.max(10,O.length*2),.4,8,!1);c[k.color]||(c[k.color]=new xe({color:k.color}));const pe=new X(He,c[k.color]);pe.position.z=.6,I.add(pe)}}),d.add(I)});const g=await Ye(d,{printer_name:"Bambu Lab"}),U=document.createElement("a");U.href=URL.createObjectURL(g),U.download=`Coal_Seal_${l}_${Date.now()}.3mf`,U.click()}catch(d){console.error("3MF 导出失败:",d)}finally{p(!1)}},j=f.useMemo(()=>t==="drag"?"cursor-grab":a==="paint"?"cursor-crosshair":"cursor-alias",[t,a]);return r.jsxs("div",{className:"w-full h-screen flex bg-[#0a0a0a] text-white font-sans overflow-hidden",children:[r.jsxs("div",{className:"w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl",children:[r.jsxs("div",{className:"p-6 border-b border-white/10",children:[r.jsx("span",{className:"px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest",children:"L1-16"}),r.jsx("h1",{className:"font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase",children:"煤精组印"})]}),r.jsxs("div",{className:"p-6 space-y-8 flex-1 overflow-y-auto",children:[r.jsxs("div",{className:"space-y-3",children:[r.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest",children:"拓扑底板结构"}),r.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[r.jsxs("button",{onClick:()=>{o("NET_14"),m([]),L(d=>d+1)},className:`py-4 rounded-xl text-xs font-black tracking-widest uppercase border transition-all ${l==="NET_14"?"bg-blue-600/20 border-blue-500 text-blue-400":"border-white/5 text-white/30"}`,children:[r.jsx(_e,{className:"w-4 h-4 mx-auto mb-2 opacity-50"})," 14面体"]}),r.jsxs("button",{onClick:()=>{o("NET_26"),m([]),L(d=>d+1)},className:`py-4 rounded-xl text-xs font-black tracking-widest uppercase border transition-all ${l==="NET_26"?"bg-purple-600/20 border-purple-500 text-purple-400":"border-white/5 text-white/30"}`,children:[r.jsx(_e,{className:"w-4 h-4 mx-auto mb-2 opacity-50"})," 26面体"]})]})]}),r.jsxs("div",{className:"space-y-3",children:[r.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest",children:"工坊阶段"}),r.jsxs("div",{className:"flex bg-black/40 rounded-xl p-1 border border-white/5",children:[r.jsxs("button",{onClick:()=>e("paint"),className:`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${a==="paint"?"bg-emerald-600 text-white shadow-lg":"text-white/40"}`,children:[r.jsx(xt,{className:"w-4 h-4"})," 1. 平铺作画"]}),r.jsxs("button",{onClick:()=>e("assemble"),className:`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${a==="assemble"?"bg-blue-600 text-white shadow-lg":"text-white/40"}`,children:[r.jsx(Ze,{className:"w-4 h-4"})," 2. 立体组装"]})]})]}),r.jsxs("div",{className:"space-y-4",children:[r.jsx("label",{className:"text-xs font-bold text-white/50 tracking-widest",children:"工具箱 (互斥操作)"}),r.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[r.jsx("button",{onClick:()=>n("drag"),className:`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${t==="drag"?"bg-amber-600 border-amber-500 shadow-xl":"bg-white/5 border-white/10 hover:bg-white/10"}`,children:r.jsx(mt,{className:"w-6 h-6"})}),r.jsx("button",{onClick:()=>n("pencil"),className:`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${t==="pencil"?"bg-emerald-600 border-emerald-500 shadow-xl":"bg-white/5 border-white/10 hover:bg-white/10"}`,children:r.jsx(bt,{className:"w-6 h-6"})}),t!=="drag"&&r.jsx("div",{className:"col-span-2 space-y-3 pt-3",children:r.jsxs("div",{className:"flex gap-2.5",children:[r.jsx("button",{onClick:()=>n("eraser"),className:`p-2 rounded flex-1 flex justify-center items-center border ${t==="eraser"?"bg-white text-black border-white":"bg-black text-white border-white/20"}`,children:r.jsx(Je,{className:"w-4 h-4"})}),Me.map(d=>r.jsx("button",{onClick:()=>{s(d),n("pencil")},className:`w-8 h-8 rounded-full border-2 transition-transform ${i===d&&t==="pencil"?"border-white scale-110":"border-transparent"}`,style:{backgroundColor:d}},d))]})})]})]}),r.jsx("div",{className:"flex gap-2 pt-4 border-t border-white/10",children:r.jsxs("button",{onClick:()=>{m([]),L(d=>d+1)},className:"flex-1 py-4 rounded-xl bg-white/5 text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-red-400 hover:border-red-500/50 border border-transparent transition-all",children:[r.jsx(Ke,{className:"w-4 h-4 mx-auto mb-1"})," 清理印面"]})})]}),r.jsx("div",{className:"p-6",children:r.jsxs("button",{onClick:A,disabled:h,className:"w-full py-4 rounded bg-amber-700 hover:bg-amber-600 transition-colors font-bold text-sm flex justify-center items-center gap-2 text-white disabled:opacity-50",children:[r.jsx(Qe,{className:"w-4 h-4"}),h?"生成物理切片中...":"导出 3MF 物理切片"]})})]}),r.jsx("div",{className:`flex-1 relative bg-[#f8f9fa] ${j}`,children:r.jsxs(Fe,{camera:{position:[0,0,320],fov:45},children:[r.jsx("color",{attach:"background",args:["#f8f9fa"]}),r.jsx("ambientLight",{intensity:.9}),r.jsx("directionalLight",{position:[50,100,100],intensity:1.5}),r.jsx(Ve,{preset:"city"}),r.jsx($e,{makeDefault:!0,enableRotate:a==="assemble"||t==="drag",mouseButtons:{LEFT:t==="drag"?K.ROTATE:null,MIDDLE:K.DOLLY,RIGHT:K.ROTATE}}),r.jsx(Ut,{tick:y}),r.jsx(et,{children:r.jsx(Tt,{activeTopology:l,viewMode:a,activeTool:t,activeColor:i,strokes:x,setStrokes:m})})]})})]})}export{Ft as default};
