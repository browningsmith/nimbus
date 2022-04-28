precision highp float;
    
uniform vec2 u_resolution;
uniform float u_time;

float rand(float x)
{
    return fract(sin(x)*100000.0);
}

void main()
{
    vec3 red = vec3(1.0, 0.0, 0.0);
    vec3 green = vec3(0.0, 1.0, 0.0);
    
    vec2 st = gl_FragCoord.xy/u_resolution;

    vec3 color = vec3(rand(st.y+sin(abs(u_time))));

    gl_FragColor = vec4(color, 1.0);
}