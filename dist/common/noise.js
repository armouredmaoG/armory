(function(){const A=`
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `,_=`
    precision highp float;
    uniform float u_time;
    uniform float u_opacity;
    uniform vec2  u_res;

    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      float n = hash(uv + u_time);
      gl_FragColor = vec4(vec3(n), u_opacity);
    }
  `;function S(r){const o=document.createElement("canvas");o.style.cssText="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;",r.appendChild(o);const e=o.getContext("webgl")||o.getContext("experimental-webgl");if(!e)return console.warn("WebGL not supported \xE2\u20AC\u201D noise skipped for",r),null;function d(i,n){const a=e.createShader(i);return e.shaderSource(a,n),e.compileShader(a),e.getShaderParameter(a,e.COMPILE_STATUS)?a:(console.error("Shader compile error:",e.getShaderInfoLog(a)),e.deleteShader(a),null)}const m=d(e.VERTEX_SHADER,A),g=d(e.FRAGMENT_SHADER,_);if(!m||!g)return null;const t=e.createProgram();if(e.attachShader(t,m),e.attachShader(t,g),e.linkProgram(t),!e.getProgramParameter(t,e.LINK_STATUS))return console.error("Program link error:",e.getProgramInfoLog(t)),null;e.useProgram(t);const v=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,v),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW);const p=e.getAttribLocation(t,"a_pos");e.enableVertexAttribArray(p),e.vertexAttribPointer(p,2,e.FLOAT,!1,0,0);const P=e.getUniformLocation(t,"u_time"),R=e.getUniformLocation(t,"u_opacity"),L=e.getUniformLocation(t,"u_res");e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.uniform1f(R,.15);function h(){const i=r.clientWidth||window.innerWidth,n=r.clientHeight||window.innerHeight;o.width=i,o.height=n,e.viewport(0,0,i,n),e.uniform2f(L,i,n)}return window.addEventListener("resize",h),h(),function(n){e.uniform1f(P,n*.001*5),e.drawArrays(e.TRIANGLES,0,6)}}const s=document.querySelectorAll(".noise-bg");if(!s.length)return;const u=Array.from(s).map(S).filter(Boolean);if(!u.length)return;const E=160/5;let l=0,c=0;function f(r){const o=r-l;l=r,c+=o,c>=E&&(u.forEach(function(e){e(r)}),c=0),requestAnimationFrame(f)}requestAnimationFrame(f)})();
