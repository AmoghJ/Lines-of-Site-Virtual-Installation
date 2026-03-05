uniform sampler2D videoTexture;
uniform float time;
uniform vec2 mouse_pos;
uniform vec2 u_resolution;

varying vec2 vUV;


  
const int octaves = 10;
const int octavesWarp = 3;
const float seed = 43758.5453123;
const float seed2 = 73156.8473192;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float random(float val) {
    return fract(sin(val) * seed);
}

vec2 random2(vec2 st, float seed){
    st = vec2( dot(st,vec2(127.1,311.7)),
                dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*seed);
}

float random2d(vec2 uv) {
    return fract(
            sin(
                dot( uv.xy, vec2(12.9898, 78.233) )
            ) * seed);
}

// Value Noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/lsf3WH
float noise(vec2 st, float seed) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0), seed ), f - vec2(0.0,0.0) ), 
                        dot( random2(i + vec2(1.0,0.0), seed ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0), seed ), f - vec2(0.0,1.0) ), 
                        dot( random2(i + vec2(1.0,1.0), seed ), f - vec2(1.0,1.0) ), u.x), u.y);
}

vec3 plotCircle(vec2 pos, vec2 uv, float size) {
    return vec3(smoothstep(size, size + 0.05, length(uv - pos)));
}

// FBM function courtesy of Patricio Vivo
float fbm (in vec2 st, float seed) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    // Loop of octaves
    for (int i = octaves; i > 0; i--) {
        value += amplitude * noise(st, seed);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

// FBM function courtesy of Patricio Vivo
float fbmWarp (in vec2 st, float seed) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    // Loop of octaves
    for (int i = octavesWarp; i > 0; i--) {
        value += amplitude * noise(st, seed);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

float fbm2 ( in vec2 _st, float seed) {
float v = 0.0;
float a = 0.5;
vec2 shift = vec2(100.0);
// Rotate to reduce axial bias
mat2 rot = mat2(cos(0.5), sin(0.5),
                -sin(0.5), cos(0.50));
for (int i = 0; i < octaves; ++i) {
    v += a * noise(_st, seed);
    _st = rot * _st * 2.0 + shift;
    a *= 0.5;
}
return v;
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),sin(_angle),
                -sin(_angle),cos(_angle));
}

vec2 getDistortedUV(float s) {
    return vec2(vUV.x + 0.1f*noise(vec2(vUV.x*s,time/8.0f), 1.0f), vUV.y + 0.1f*noise(vec2(vUV.y*s,time/8.0f),10.0f));
}

float distSquared( vec2 A, vec2 B )
{
    vec2 C = A - B;
    return dot( C, C );
}

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

float normalizeValue(float inMin, float inMax, float value) {
    return (value - inMin)/(inMax - inMin);
}

float squaredStep(float inMin, float inMax, float value) {
    float normalValue = normalizeValue(inMin, inMax, value);
    return normalValue * normalValue;
}

void main() {
    /*vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    uv *= 5.;
    
    uv.x += cos(time / 5000.) * 1000.;
    uv.y -= sin(time / 3000.) * 500.;
    
    uv /= 5.;
    
    vec2 noiseuv = uv;
    
    noiseuv.x -= time/100.;
    
    float offsetVal = fbmWarp(noiseuv, seed);
    vec2 direction = normalize(vec2(1.));
    direction = rotate2d(offsetVal * TAU) * direction;
    vec2 uvN = uv * 2. + direction * sin(time / 10.) * 1.;
    vec2 uvN2 = uv * 2. + direction * sin(1. + time / 10.) * 1.;
    float noiseVal = fbm2(uvN, seed2);
    float noiseVal2 = fbm2(uvN2, seed);
    
    vec3 colour = vec3(noiseVal + noiseVal2);
    colour.rg += noiseVal2;
    colour.r += .1;
    colour.gb += noiseVal;
    // colour.b += mix(noiseVal, noiseVal2, sin(u_time / 20.)) * 5.;
    colour += 0.1;
    // colour *= noiseVal * noiseVal;
    // colour.gb += uvN / 5.;*/
    
    vec2 mouseCoord = mouse_pos/u_resolution;
    mouseCoord.y = 1.0f - mouseCoord.y;
    vec2 clippedScreen = vec2((vUV.x*1920.0f-(1920.0f-u_resolution.x)/2.0f)/u_resolution.x, (vUV.y*1080.0f-(1080.0f-u_resolution.y)/2.0f)/u_resolution.y);
    float distSqu = distSquared(mouseCoord, clippedScreen);

    vec3 out_color;

    if(distSqu < 0.05f) {
        float factor =  map(0.05f - distSqu, 0.0f, 0.05f,0.0f,1.0f);
        vec2 mixUV = mix(vUV, getDistortedUV(5.0f), squaredStep(0.0f,1.0f,factor));
        out_color = texture2D(videoTexture, mixUV).rgb;
    } else {
        out_color = texture2D(videoTexture, vUV).rgb;
    }

    gl_FragColor = vec4(out_color,1.0f);
}
