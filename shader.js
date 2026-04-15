import * as THREE from 'https://esm.sh/three@0.171.0';
import { EffectComposer } from 'https://esm.sh/three@0.171.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.171.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.171.0/examples/jsm/postprocessing/ShaderPass.js';
// ─── Mobile Detection ───
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1025);


//   window.CloudShaderAPI = window.CloudShaderAPI || {
//   progress: 0.0,
// };

// ─── Config ───
const CONFIG = {
    waveSpeed: 0.015,
    waveFrequency: 3.0,
    waveAmplitude: 0.4,
    waveColor: [35 / 200, 35 / 200, 35 / 200],
    colorNum: 4.0,
    pixelSize: isMobile ? 4.0 : 3.0,
    mouseRadius: 0.25,
    enableMouse: !isMobile,
    patternPasses: isMobile ? 1 : 2, // Fewer passes on mobile for speed
    pixelRatio: isMobile ? 0.5 : Math.min(window.devicePixelRatio, 1.0), // 50% fillrate on mobile
};

// ─── Wave Fragment Shader (Perlin noise + FBM) ───
const waveFragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform vec2 invResolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec2 mousePos;
uniform int enableMouseInteraction;
uniform float mouseRadius;
uniform float aspect;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
Pi = mod289(Pi);
vec4 ix = Pi.xzxz;
vec4 iy = Pi.yyww;
vec4 fx = Pf.xzxz;
vec4 fy = Pf.yyww;
vec4 i = permute(permute(ix) + iy);
vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
vec4 gy = abs(gx) - 0.5;
vec4 tx = floor(gx + 0.5);
gx = gx - tx;
vec2 g00 = vec2(gx.x, gy.x);
vec2 g10 = vec2(gx.y, gy.y);
vec2 g01 = vec2(gx.z, gy.z);
vec2 g11 = vec2(gx.w, gy.w);
vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
float n00 = dot(g00, vec2(fx.x, fy.x));
float n10 = dot(g10, vec2(fx.y, fy.y));
float n01 = dot(g01, vec2(fx.z, fy.z));
float n11 = dot(g11, vec2(fx.w, fy.w));
vec2 fade_xy = fade(Pf.xy);
vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

#define OCTAVES ${isMobile ? 2 : 3}
float fbm(vec2 p) {
float value = 0.0;
float amp = 1.0;
float freq = waveFrequency;
for (int i = 0; i < OCTAVES; i++) {
value += amp * abs(cnoise(p));
p *= freq;
amp *= waveAmplitude;
}
return value;
}

float pattern(vec2 p) {
// Offset X & Y negatively over time so the wave structure moves diagonally upwards/right
vec2 p2 = p - vec2(time * waveSpeed * 0.5, time * waveSpeed);

${isMobile
        ? `
// MOBILE OPTIMIZATION: Use cheap sine waves to fake turbulence instead of nested heavy noise
p2.x += sin(p.y * 5.0 + time * 0.5) * 0.05;
p2.y += cos(p.x * 5.0 - time * 0.5) * 0.05;
return fbm(p2);
`
        : `
// DESKTOP: Triple nested noise for intricate cloud details
float baseNoise = fbm(p);
float distortedNoise = fbm(p + baseNoise * 0.5);
return fbm(p2 + distortedNoise * 0.1);
`
    }
}

void main() {
vec2 uv = gl_FragCoord.xy * invResolution;
uv -= 0.5;
uv.x *= aspect;
float f = pattern(uv);
if (enableMouseInteraction == 1) {
vec2 mouseNDC = (mousePos * invResolution - 0.5) * vec2(1.0, -1.0);
mouseNDC.x *= aspect;
float dist = length(uv - mouseNDC);
float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
f -= 0.5 * effect;
}
f = smoothstep(0.1, 0.9, f);
vec3 col = mix(vec3(0.02), waveColor * 2.0, f);
gl_FragColor = vec4(col, 1.0);
}
`;

// ─── Wave Vertex Shader ───
const waveVertexShader = `
precision mediump float;
varying vec2 vUv;
void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ─── Dither Post-Processing Shader (Bayer 8x8) ───
const DitherShader = {
    uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2() },
        colorNum: { value: CONFIG.colorNum },
        pixelSize: { value: CONFIG.pixelSize },
        introProgress: { value: 0.0 },
        time: { value: 0.0 },
    },
    vertexShader: `
varying vec2 vUv;
void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
    fragmentShader: `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float colorNum;
uniform float pixelSize;
uniform float introProgress;
uniform float time;
varying vec2 vUv;

// Pseudo-random noise for scattered intro
float random(vec2 st) {
return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

const float bayerMatrix8x8[64] = float[64](
 0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
32.0/64.0, 16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0, 19.0/64.0, 47.0/64.0, 31.0/64.0,
 8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0, 59.0/64.0,  7.0/64.0, 55.0/64.0,
40.0/64.0, 24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0, 27.0/64.0, 39.0/64.0, 23.0/64.0,
 2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0, 49.0/64.0, 13.0/64.0, 61.0/64.0,
34.0/64.0, 18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0, 17.0/64.0, 45.0/64.0, 29.0/64.0,
10.0/64.0, 58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0, 57.0/64.0,  5.0/64.0, 53.0/64.0,
42.0/64.0, 26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0, 25.0/64.0, 37.0/64.0, 21.0/64.0
);

vec3 dither(vec2 uv, vec3 color) {
vec2 scaledCoord = floor(uv * resolution / pixelSize);
int x = int(mod(scaledCoord.x, 8.0));
int y = int(mod(scaledCoord.y, 8.0));
float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
float step = 1.0 / (colorNum - 1.0);
color += threshold * step;
float bias = 0.2;
color = clamp(color - bias, 0.0, 1.0);
return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void main() {
vec2 normalizedPixelSize = pixelSize / resolution;
vec2 uvPixel = normalizedPixelSize * floor(vUv / normalizedPixelSize);

// Calculate layout mask for random appearance
float rnd = random(uvPixel);
float mask = step(rnd, introProgress);

vec4 color = texture2D(tDiffuse, uvPixel);
color.rgb = dither(vUv, color.rgb);



color.rgb *= mask; // Keep pure black until threshold is hit

gl_FragColor = color;
}
`,
};

// ─── Setup ───
const canvas = document.getElementById('source');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    stencil: false,
    depth: false,
    powerPreference: 'low-power',
});
renderer.setPixelRatio(CONFIG.pixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
camera.position.z = 6;

// ─── Wave Mesh ───
const waveUniforms = {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() },
    invResolution: { value: new THREE.Vector2() },
    waveSpeed: { value: CONFIG.waveSpeed },
    waveFrequency: { value: CONFIG.waveFrequency },
    waveAmplitude: { value: CONFIG.waveAmplitude },
    waveColor: { value: new THREE.Color(...CONFIG.waveColor) },
    mousePos: { value: new THREE.Vector2(-9999, -9999) },
    enableMouseInteraction: { value: CONFIG.enableMouse ? 1 : 0 },
    mouseRadius: { value: CONFIG.mouseRadius },
    aspect: { value: 1 },
};

const waveMaterial = new THREE.ShaderMaterial({
    vertexShader: waveVertexShader,
    fragmentShader: waveFragmentShader,
    uniforms: waveUniforms,
});

const planeGeo = new THREE.PlaneGeometry(1, 1);
const mesh = new THREE.Mesh(planeGeo, waveMaterial);
scene.add(mesh);

// ─── Post-Processing ───
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const ditherPass = new ShaderPass(DitherShader);
composer.addPass(ditherPass);

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const dist = camera.position.z;
    const vFov = (camera.fov * Math.PI) / 180;
    const planeH = 2 * Math.tan(vFov / 2) * dist;
    const planeW = planeH * camera.aspect;
    mesh.scale.set(planeW, planeH, 1);

    waveUniforms.resolution.value.set(w, h);
    waveUniforms.invResolution.value.set(1 / w, 1 / h);
    waveUniforms.aspect.value = w / h;
    ditherPass.uniforms.resolution.value.set(w, h);
}
window.addEventListener('resize', resize);
resize();

// ─── Mouse ───
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const targetMousePos = new THREE.Vector2(-9999, -9999);

canvas.addEventListener('pointermove', (e) => {
    if (!CONFIG.enableMouse) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(mesh);
    if (hits.length > 0) {
        const uv = hits[0].uv;
        targetMousePos.set(uv.x * rect.width, (1 - uv.y) * rect.height);
    }
});

// ─── Animation Loop ───
let lastTime = 0;

function animate(now) {
    requestAnimationFrame(animate);
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    // Wrap time every 10000 units to prevent floating point precision overflow in the shader
    const wrappedTime = (now / 1000) % 10000.0;
    waveUniforms.time.value = wrappedTime;
    ditherPass.uniforms.time.value = wrappedTime;

    // Sync GSAP progress to shader
    ditherPass.uniforms.introProgress.value = window.CloudShaderAPI.progress;

    // Smooth, framerate-independent easing for the hover effect
    waveUniforms.mousePos.value.lerp(targetMousePos, 1.0 - Math.exp(-5.0 * delta));

    composer.render();
}
requestAnimationFrame(animate);
