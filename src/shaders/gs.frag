
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)


varying vec2 vUv;
uniform float screenWidth;
uniform float screenHeight;
uniform sampler2D tSource;
uniform float delta;
uniform float feed;
uniform float kill;
uniform vec2 brush;
uniform float diffRateA;
uniform float diffRateB;
uniform float uTime;
// uniform float brushSize;

// shearing:  https://www.shadertoy.com/view/3st3D8
// #define T(U) texture2D( tSource, U -.1/120.* vec2(.05*sin(6.28*((U).y-.05)),.05*cos(6.28*((U).x-.05))), 0.)
#define T(U) texture2D( tSource, U -.1/120.* vec2(sin(uTime * 0.00005) * 0.15 *sin(6.28*((U).y-.05)),.05*cos(6.28*((U).x-.05))), 0.)



vec2 texel = vec2(1.0/screenWidth, 1.0/screenHeight);
float step_x = 1.0/screenWidth;
float step_y = 1.0/screenHeight;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main()
{
    if(brush.x < -5.0)
    {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        return;
    }
    
    //float feed = vUv.y * 0.083;
    //float kill = vUv.x * 0.073;

    float brushSize = map(snoise2(vec2(uTime * 0.00005)), -1.0, 1.0, 5.0, 2000.0);
    
    // vec2 uv = texture2D(tSource, vUv).rg;
    // vec2 uv0 = texture2D(tSource, vUv+vec2(-step_x, 0.0)).rg;
    // vec2 uv1 = texture2D(tSource, vUv+vec2(step_x, 0.0)).rg;
    // vec2 uv2 = texture2D(tSource, vUv+vec2(0.0, -step_y)).rg;
    // vec2 uv3 = texture2D(tSource, vUv+vec2(0.0, step_y)).rg;

    vec2 uv = T(vUv).rg;
    vec2 uv0 = T(vUv+vec2(-step_x, 0.0)).rg;
    vec2 uv1 = T(vUv+vec2(step_x, 0.0)).rg;
    vec2 uv2 = T(vUv+vec2(0.0, -step_y)).rg;
    vec2 uv3 = T(vUv+vec2(0.0, step_y)).rg;
    
    vec2 lapl = (uv0 + uv1 + uv2 + uv3 - 4.0*uv);
    // float du = /*0.00002*/0.2097*lapl.r - uv.r*uv.g*uv.g + feed*(1.0 - uv.r);
    // float dv = /*0.00001*/0.105*lapl.g + uv.r*uv.g*uv.g - (feed+kill)*uv.g;
    float du = diffRateA*lapl.r - uv.r*uv.g*uv.g + feed*(1.0 - uv.r);
    float dv = diffRateB*lapl.g + uv.r*uv.g*uv.g - (feed+kill)*uv.g;
    vec2 dst = uv + delta*vec2(du, dv);
    
    if(brush.x > 0.0)
    {
        vec2 diff = (vUv - brush)/texel;
        float dist = dot(diff, diff);
        if(dist < brushSize)
            dst.g = 0.9;
    }
    
    gl_FragColor = vec4(dst.r, dst.g, 0.0, 1.0);
}