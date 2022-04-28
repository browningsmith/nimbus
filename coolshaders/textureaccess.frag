precision highp float;
    
uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_sampler;

void main()
{
    vec2 st = gl_FragCoord.xy/u_resolution;
    vec3 color = vec3(0.0);

    // Get texture data for this pixel
    vec4 texData = texture2D(u_sampler, st);

    float compressed_dimension = 2.0; // Size of one side of the texture sampler, as loaded

    vec2 st_expanded = st * compressed_dimension;
    vec2 st_expanded_f = fract(st_expanded);

    if ((st_expanded_f.x < 0.5) && (st_expanded_f.y < 0.5))
    {
        color = vec3(texData.x);
    }
    else if (st_expanded_f.y < 0.5)
    {
        color = vec3(texData.y);
    }
    else if (st_expanded_f.x < 0.5)
    {
        color = vec3(texData.z);
    }
    else
    {
        color = vec3(texData.w);
    }

    gl_FragColor = vec4(color.x, 0.0, color.x, 1.0);
}