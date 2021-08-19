 #define PI 3.1415926538
    
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_sampler;

void main()
{
    vec2 st = gl_FragCoord.xy/u_resolution;
    vec3 color = vec3(0.0);

    vec3 color1 = vec3(0.0, 0.0, 0.0);
    vec3 color2 = vec3(1.0, 1.0, 1.0);

    float dimension = 16.0;

    st *= dimension;
    vec2 st_i = floor(st);
    vec2 st_f = fract(st);
    //vec2 smooth = smoothstep(0.0, 1.0, st_f);
    vec2 smooth = st_f * st_f * st_f * (st_f * (st_f * 6.0 - 15.0) + 10.0);

    // Get the values of the four corners
    float f00 = texture2D(u_sampler, (st_i + vec2(0.0, 0.0)) / dimension).x;
    float f10 = texture2D(u_sampler, (st_i + vec2(1.0, 0.0)) / dimension).x;
    float f01 = texture2D(u_sampler, (st_i + vec2(0.0, 1.0)) / dimension).x;
    float f11 = texture2D(u_sampler, (st_i + vec2(1.0, 1.0)) / dimension).x;

    // Calculate unit vectors
    vec2 c00 = vec2(sin(f00 * PI * 2.0 + u_time * f00 * 2.0), cos(f00 * PI * 2.0 + u_time * f00 * 2.0));
    vec2 c10 = vec2(sin(f10 * PI * 2.0 + u_time * f10 * 2.0), cos(f10 * PI * 2.0 + u_time * f10 * 2.0));
    vec2 c01 = vec2(sin(f01 * PI * 2.0 + u_time * f01 * 2.0), cos(f01 * PI * 2.0 + u_time * f01 * 2.0));
    vec2 c11 = vec2(sin(f11 * PI * 2.0 + u_time * f11 * 2.0), cos(f11 * PI * 2.0 + u_time * f11 * 2.0));

    // Calculate unit vectors
    //vec2 c00 = vec2(sin(f00 * PI * 2.0), cos(f00 * PI * 2.0));
    //vec2 c10 = vec2(sin(f10 * PI * 2.0), cos(f10 * PI * 2.0));
    //vec2 c01 = vec2(sin(f01 * PI * 2.0), cos(f01 * PI * 2.0));
    //vec2 c11 = vec2(sin(f11 * PI * 2.0), cos(f11 * PI * 2.0));

    // Calculate dot products
    float d00 = dot(c00, st_f - vec2(0.0, 0.0));
    float d10 = dot(c10, st_f - vec2(1.0, 0.0));
    float d01 = dot(c01, st_f - vec2(0.0, 1.0));
    float d11 = dot(c11, st_f - vec2(1.0, 1.0));

    // Mix it all together based on smoothstep
    float noise = mix(
            mix(
                d00,
                d10,
                smooth.x
            ),
            mix(
                d01,
                d11,
                smooth.x
            ),
            smooth.y
        );

    noise = clamp(noise*100.0, 0.0, 1.0);

    color = mix(color1, color2, noise);

    gl_FragColor = vec4(color, 1.0);
    //gl_FragColor = texture2D(u_sampler, (st_i + vec2(1.0, 0.0)) / dimension);
}