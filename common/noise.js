// /*** ANIMATED NOISE â€” applies to all .noise-bg elements ***/
// (function () {
//   const OPACITY = 10; // 0â€“100 â€” grain transparency
//   const SPEED = 4; // higher = faster flickering

//   const containers = document.querySelectorAll(".noise-bg");
//   if (!containers.length) return;

//   // Each .noise-bg gets its own canvas + ctx, stored here
//   const canvases = [];

//   containers.forEach((container) => {
//     const canvas = document.createElement("canvas");
//     canvas.style.cssText =
//       "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;";

//     container.appendChild(canvas);

//     // Safari & Firefox compatible: don't pass options object to getContext â€”
//     // just use standard "2d" (options object is ignored by older Safari anyway)
//     const ctx = canvas.getContext("2d");

//     let W = 0,
//       H = 0;

//     function resize() {
//       W = canvas.width = container.clientWidth || window.innerWidth;
//       H = canvas.height = container.clientHeight || window.innerHeight;
//     }

//     window.addEventListener("resize", resize);
//     resize();

//     const a = Math.round(OPACITY * 2.55);

//     function draw() {
//       if (!W || !H) return;
//       const img = ctx.createImageData(W, H);
//       const data = img.data;

//       for (let i = 0; i < data.length; i += 4) {
//         const v = (Math.random() * 255) | 0;
//         data[i] = data[i + 1] = data[i + 2] = v;
//         data[i + 3] = a;
//       }
//       ctx.putImageData(img, 0, 0);
//     }

//     canvases.push(draw);
//   });

//   // ---- Single shared rAF loop â€” one tick drives ALL instances ----
//   const interval = 160 / SPEED;
//   let lastTime = 0,
//     accumulator = 0;

//   function loop(ts) {
//     const delta = ts - lastTime;
//     lastTime = ts;
//     accumulator += delta;

//     if (accumulator >= interval) {
//       canvases.forEach((draw) => draw()); // draw all at once
//       accumulator = 0;
//     }

//     requestAnimationFrame(loop);
//   }

//   requestAnimationFrame(loop);
// })();
/*** ANIMATED NOISE â€“ WebGL version for .noise-bg elements ***/
(function () {
    const OPACITY = 0.15; // 0.0â€“1.0 â€” grain transparency
    const SPEED = 5; // higher = faster flickering

    const VERT = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

    const FRAG = `
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
  `;

    function createRenderer(container) {
        const canvas = document.createElement("canvas");
        canvas.style.cssText =
            "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;";
        container.appendChild(canvas);

        const gl =
            canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
            console.warn("WebGL not supported â€” noise skipped for", container);
            return null;
        }

        function compileShader(type, src) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader compile error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vert = compileShader(gl.VERTEX_SHADER, VERT);
        const frag = compileShader(gl.FRAGMENT_SHADER, FRAG);
        if (!vert || !frag) return null;

        const prog = gl.createProgram();
        gl.attachShader(prog, vert);
        gl.attachShader(prog, frag);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(prog));
            return null;
        }

        gl.useProgram(prog);

        // Full-screen quad (two triangles covering clip space)
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        );

        const posLoc = gl.getAttribLocation(prog, "a_pos");
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(prog, "u_time");
        const uOpacity = gl.getUniformLocation(prog, "u_opacity");
        const uRes = gl.getUniformLocation(prog, "u_res");

        // Alpha blending so noise sits on top of existing content
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.uniform1f(uOpacity, OPACITY);

        function resize() {
            const W = container.clientWidth || window.innerWidth;
            const H = container.clientHeight || window.innerHeight;
            canvas.width = W;
            canvas.height = H;
            gl.viewport(0, 0, W, H);
            gl.uniform2f(uRes, W, H);
        }

        window.addEventListener("resize", resize);
        resize();

        return function draw(time) {
            gl.uniform1f(uTime, time * 0.001 * SPEED);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        };
    }

    const containers = document.querySelectorAll(".noise-bg");
    if (!containers.length) return;

    const renderers = Array.from(containers).map(createRenderer).filter(Boolean);

    if (!renderers.length) return;

    const interval = 160 / SPEED;
    let lastTime = 0;
    let accumulator = 0;

    function loop(ts) {
        const delta = ts - lastTime;
        lastTime = ts;
        accumulator += delta;

        if (accumulator >= interval) {
            renderers.forEach(function (draw) {
                draw(ts);
            });
            accumulator = 0;
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
})();