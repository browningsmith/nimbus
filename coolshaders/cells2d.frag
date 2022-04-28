precision highp float;
    
uniform vec2 u_resolution;
uniform float u_time;

vec2 random2( vec2 p )
{
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main()
{
    vec2 st = gl_FragCoord.xy/u_resolution;
    vec3 color = vec3(0.0);

    // Scale
    st *= 25.0;

    // Separate into tiles
    vec2 i = floor(st);
    vec2 f = fract(st);

    float min_dist = 9.0;

    // Generate points in this and surrounding tiles
    for (int x = -1; x < 2; x++)
    {
        for (int y = -1; y < 2; y++)
        {
            vec2 ll_corner = i + vec2(float(x), float(y));

            vec2 point = random2(ll_corner);

            point = 0.5 + 0.5*sin(u_time + 6.2831*point);

            point += ll_corner;

            float dist = distance(st, point);

            min_dist = min(min_dist, dist);
        }
    }

    color = vec3(0.0, 0.8 - min_dist*0.5, 0.0);

    gl_FragColor = vec4(color, 1.0);
}