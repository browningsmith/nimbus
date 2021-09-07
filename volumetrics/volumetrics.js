let canvas = null;
let ctx = null;

let dimension = 256;
let animationDuration = 256;

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
        uniform float u_duration;
        uniform float u_dimension;
        uniform float u_tileLayoutDimension;

        uniform sampler2D u_sampler;

        vec4 vol3D(sampler2D sampler, vec3 coord, float tileDimension, float layoutDimension)
        {
            vec2 tileCoord = vec2(coord.z * tileDimension, 0.0);
            for (int i = 0; i < 40000; i++)
            {
                if (tileCoord.x > layoutDimension)
                {
                    tileCoord.x -= layoutDimension;
                    tileCoord.y += 1.0;
                }
                else
                {
                    break;
                }
            }
            tileCoord = floor(tileCoord);
            
            vec2 finalCoord = (tileCoord + fract(coord.xy)) / layoutDimension;

            return texture2D(sampler, finalCoord);
        }
        
        void main()
        {
            vec2 st = gl_FragCoord.xy/u_resolution;
            //vec3 color = vec3(0.0);

            float z = u_time / u_duration;
        
            //gl_FragColor = texture2D(u_sampler, st);
            gl_FragColor = vol3D(u_sampler, vec3(st, z), u_dimension, u_tileLayoutDimension);
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
            dimension: ctx.getUniformLocation(this.program, "u_dimension"),
            duration: ctx.getUniformLocation(this.program, "u_duration"),
            tileLayoutDimension: ctx.getUniformLocation(this.program, "u_tileLayoutDimension")
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

    let textureData = new Array(dimension * dimension * dimension * 4);

    let tileLayoutDimension = Math.floor(Math.sqrt(dimension));
    let textureDimension = Math.floor(Math.sqrt(dimension * dimension * dimension));
    //console.log(textureDimension);

    let colorIndex = 0; // 0 red, 1 green, 2 yellow, 3 blue
    for (let z = 0; z < dimension; z++)
    {
        // Unpack z index into tile x and y
        let tileX = z;
        let tileY = 0;
        while (tileX >= tileLayoutDimension)
        {
            tileX -= tileLayoutDimension;
            tileY++;
        }

        // Reset intensity
        let intensity = 255;
        let dropFactor = 255 / (dimension * dimension);

        for (let y = 0; y < dimension; y++)
        {
            for (let x = 0; x < dimension; x++)
            {
                // Construct texture index
                let xx = tileX * dimension + x;
                let yy = tileY * dimension + y;
                let i = (yy * textureDimension + xx) * 4;
                //console.log(i);

                switch (colorIndex)
                {
                    case 0:
                        textureData[i    ] = Math.floor(intensity);
                        textureData[i + 1] = 0;
                        textureData[i + 2] = 0;
                        break;

                    case 1:
                        textureData[i    ] = 0;
                        textureData[i + 1] = Math.floor(intensity);
                        textureData[i + 2] = 0;
                        break;

                    case 2:
                        textureData[i    ] = Math.floor(intensity);
                        textureData[i + 1] = Math.floor(intensity);
                        textureData[i + 2] = 0;
                        break;

                    default:
                        textureData[i    ] = 0;
                        textureData[i + 1] = 0;
                        textureData[i + 2] = Math.floor(intensity);
                }
                textureData[i + 3] = 255;

                intensity -= dropFactor;
            }
        }


        // Switch color index
        colorIndex++;
        if (colorIndex > 3)
        {
            colorIndex = 0;
        }
    }

    /*for (let i = 0; i < (textureDimension * textureDimension * 4); i += 4)
    {
        textureData[i] = Math.floor(Math.random() * 256.0);
        textureData[i + 1] = Math.floor(Math.random() * 256.0);
        textureData[i + 2] = Math.floor(Math.random() * 256.0);
        textureData[i + 3] = 255;
    }*/
    
    let texture = loadArrayToTexture(textureDimension, textureDimension, textureData);

    // Animation loop
    function newFrame(currentTime)
    {
        currentTime *= 0.001; // Convert to seconds
        currentTime = currentTime % animationDuration;
        
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

    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
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

    // Set dimension uniform
    ctx.uniform1f(shaderData.uniforms.dimension, dimension);

    // Set duration uniform
    ctx.uniform1f(shaderData.uniforms.duration, animationDuration);

    // Set tile layout dimension
    ctx.uniform1f(shaderData.uniforms.tileLayoutDimension, Math.sqrt(dimension));

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