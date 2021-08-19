let canvas = null;
let ctx = null;

let dimension = 16;

let shaderData = {

    vertexShaderCode: `
    
        attribute vec4 a_vertexPosition;

        void main(void)
        {
            gl_Position = a_vertexPosition;
        }
    `,

    fragmentShaderCode: `
    
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
    `,

    program: null,
    attributes: null,
    uniforms: null,

    tieLocations: function() {

        //Get location of attributes and uniforms, store in the ShaderData object
        this.attributes = {

            vertexPosition: ctx.getAttribLocation(this.program, "a_vertexPosition"),
        };
        this.uniforms = {

            resolution: ctx.getUniformLocation(this.program, "u_resolution"),
            time: ctx.getUniformLocation(this.program, "u_time"),
            sampler: ctx.getUniformLocation(this.program, "u_sampler"),
        }
        
    },
};

let planeObject = {

    vertexCoordinates: [

        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
    ],

    elementIndices: [

        0, 2, 3,
        0, 1, 2,
    ],

    elementCount: 6,
};

function main()
{
    //Get canvas element
    canvas = document.getElementById("canvas");

    //Get canvas context
    ctx = canvas.getContext("webgl");

    //If unable to get context, alert user and end program
    if (!ctx) {

        alert("Unable to initialize WebGL. It may not be supported by this browser.");
        return;
    }

    createShaderProgram(shaderData);

    loadModel(planeObject);

    let textureData = [];
    for (let i=0; i < (dimension * dimension * 4); i += 4)
    {
        let rand = Math.floor(Math.random() * 256.0);
        textureData[i    ] = rand;
        textureData[i + 1] = rand;
        textureData[i + 2] = rand;
        textureData[i + 3] = 255;
    }
    let texture = loadArrayToTexture(dimension, dimension, textureData);

    // Animation loop
    function newFrame(currentTime)
    {
        currentTime *= 0.001; // Convert to seconds
        
        renderFrame(currentTime, texture);

        requestAnimationFrame(newFrame);
    }

    requestAnimationFrame(newFrame);
}

/**
 * Function: createShaderProgram
 * 
 * Input: WebGLRenderingContext ctx
 * Output: WebGLProgram, prints error to console if there is an error linking the program
 * 
 * Description: This function handles finishing compiling a new shader program. It calls
 *              loadShader for the vertex shader and the fragment shader, whose source codes are declared
 *              at the top of this file, and attempts to link the resulting shaders together into
 *              a new WebGLProgram.
 */
 function createShaderProgram(shaderData) {

    //Compile shaders
    const vertexShader = loadShader(ctx.VERTEX_SHADER, shaderData.vertexShaderCode);
    const fragmentShader = loadShader(ctx.FRAGMENT_SHADER, shaderData.fragmentShaderCode);

    //Create pointer to new shader program
    let newShaderProgram = ctx.createProgram();

    //Attach shaders
    ctx.attachShader(newShaderProgram, vertexShader);
    ctx.attachShader(newShaderProgram, fragmentShader);

    //Link program to complete
    ctx.linkProgram(newShaderProgram);

    //If there was an error linking, print error to console and return null
    if (!ctx.getProgramParameter(newShaderProgram, ctx.LINK_STATUS)) {

        console.error("Error creating shader program: " + ctx.getProgramInfoLog(newShaderProgram));
        return null;
    }

    // Delete shaders now they are no longer needed
    ctx.deleteShader(vertexShader);
    ctx.deleteShader(fragmentShader);

    shaderData.program = newShaderProgram;

    // Pull out attribute and uniform locations based on custom tieLocations function
    shaderData.tieLocations();
}

/**
 * Function: loadShader
 * 
 * Input: WebGLRenderingContext ctx, (WebGLRenderingContext constant representing shader type) type, String code
 * Output: WebGLShader, prints error to console if there is an error compiling the shader
 * 
 * Description: This function compiles and returns a new shader of the type "type", using the source code
 *              "code". Prints an error to the console if it is unable to compile the shader, with a
 *              description of the compilation error.
 */
 function loadShader(type, code) {

    //Create pointer to a new shader
    const newShader = ctx.createShader(type);

    //Attach the code
    ctx.shaderSource(newShader, code);

    //Compile the shader
    ctx.compileShader(newShader);

    //If there was an error compiling, print error to console, delete shader, and return null
    if (!ctx.getShaderParameter(newShader, ctx.COMPILE_STATUS)) {

        console.error("Error compiling a shader: " + ctx.getShaderInfoLog(newShader));
        ctx.deleteShader(newShader);
        return null;
    }

    return newShader;
}

/**
 * Function: loadModel
 * 
 * Input: model model,
 * Output: None
 * 
 * Description: This function takes the given model, and creates buffers for them
 *              and places the appropriate data in these buffers. It creates a buffer
 *              for vertex position data, a buffer for vertex normals, a buffer for
 *              vertex colors, and a buffer for vertex indices.
 */
 function loadModel(model) {

    //Create pointer to a new buffer
    let vertexBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);

    //Pass in the vertex data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(model.vertexCoordinates), ctx.STATIC_DRAW);


    //Create pointer to a new buffer
    let elementIndicesBuffer = ctx.createBuffer();

    //Bind the buffer to element buffer
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, elementIndicesBuffer);

    //Pass in element index data
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.elementIndices), ctx.STATIC_DRAW);

    model.buffers = {

        vertex: vertexBuffer,
        elementIndices: elementIndicesBuffer,
    };
}

/**
 * Function: loadArrayToTexture
 * 
 * Input: int width, int height, int[] data
 * Output: 
 * 
 * Description: 
 */
function loadArrayToTexture(width, height, data)
{
    let texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, texture);

    ctx.texImage2D(
        ctx.TEXTURE_2D,
        0, // LOD
        ctx.RGBA, // internal format
        width, // Width
        height, // Height
        0, // Border
        ctx.RGBA, // source format
        ctx.UNSIGNED_BYTE, // source type
        new Uint8Array(data)
    );

    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.REPEAT);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.REPEAT);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);

    return texture;
}

function renderFrame(currentTime, texture)
{
    ctx.canvas.width = ctx.canvas.clientWidth;   //Resize canvas to fit CSS styling
    ctx.canvas.height = ctx.canvas.clientHeight;

    ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height); //Resize viewport

    //Clear the canvas
    ctx.clearColor(0.0, 0.0, 0.0, 1.0); //set clear color to black
    ctx.clearDepth(1.0); //set clear depth to 1.0
    ctx.clear(ctx.COLOR_BUFFER_BIT, ctx.DEPTH_BUFFER_BIT);

    //Tell WebGL to use the shader program
    ctx.useProgram(shaderData.program);

    //Instruct WebGL on which texture to use
    ctx.activeTexture(ctx.TEXTURE0);
    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.uniform1i(shaderData.uniforms.sampler, 0);

    // Set resolution uniform
    ctx.uniform2f(shaderData.uniforms.resolution, ctx.canvas.width, ctx.canvas.height);

    // Set time uniform
    ctx.uniform1f(shaderData.uniforms.time, currentTime);

    //Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, planeObject.buffers.vertex);
    ctx.vertexAttribPointer(shaderData.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderData.attributes.vertexPosition); //Enable the pointer to the buffer

    //Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, planeObject.buffers.elementIndices);

    //Draw triangles
    ctx.drawElements(ctx.TRIANGLES, planeObject.elementCount, ctx.UNSIGNED_SHORT, 0);
}

window.onload = main;