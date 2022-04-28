precision highp float;
    
uniform vec2 u_resolution;
uniform float u_time;

vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
                dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}


float perlin (vec2 st)
{
    // Separate integer and fractional parts
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Compute smoothstep of fract part
    vec2 sst = smoothstep(vec2(0.0), vec2(1.0), f);
    //vec2 sst = f;

    /*return mix(
        mix(
            dot(
                random2(i + vec2(0.0,0.0) ),
                f - vec2(0.0,0.0)
            ),
            dot(
                random2(i + vec2(1.0,0.0) ),
                f - vec2(1.0,0.0)
            ),
            sst.x
        ),
        mix(
            dot(
                random2(i + vec2(0.0,1.0) ),
                f - vec2(0.0,1.0)
            ),
            dot(
                random2(i + vec2(1.0,1.0) ),
                f - vec2(1.0,1.0)
            ),
            sst.x),
        sst.y);*/

    // Compute 4 random unit vectors for each corner of this grid
    vec2 c00 = random2(i + vec2(0.0, 0.0));
    vec2 c01 = random2(i + vec2(0.0, 1.0));
    vec2 c10 = random2(i + vec2(1.0, 0.0));
    vec2 c11 = random2(i + vec2(1.0, 1.0));
    

    // Compute the 4 dot products
    float d00 = dot(c00, f - vec2(0.0, 0.0));
    float d01 = dot(c01, f - vec2(0.0, 1.0));
    float d10 = dot(c10, f - vec2(1.0, 0.0));
    float d11 = dot(c11, f - vec2(1.0, 1.0));

    // Mix the two bottom corners
    float mix0 = mix(d00, d10, sst.x);
    float mix1 = mix(d01, d11, sst.x);

    // Mix the rest
    return mix(mix0, mix1, sst.y);
}

void main()
{
    vec2 st = gl_FragCoord.xy/u_resolution;
    vec3 color = vec3(0.0);
    
    st = vec2(st * 10.0);

    color = vec3(perlin(st)*0.5 + 0.5);

    gl_FragColor = vec4(color,1.0);
}