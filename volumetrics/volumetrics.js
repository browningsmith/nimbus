let canvas = null;
let ctx = null;
let frameBuffer = null;

let tminInput = null;
let densityFalloffInput = null;
let tmaxInput = null;
let stepSizeInput = null;
let skyColorInput = null;
let darkColorInput = null;
let lightColorInput = null;
let sunColorInput = null;
let sunIntensityInput = null;
let sunXInput = null;
let sunYInput = null;
let sunZInput = null;
let tsunMaxInput = null;
let sunStepSizeInput = null;
let lightAbsorptionInput = null;
let fogInput = null;

let resetNoiseInput = null;

let noiseScaleInput = null;
let noiseXInput = null;
let noiseYInput = null;
let noiseZInput = null;
let noiseSlopeInput = null;
let noiseOffsetInput = null;

let displayStageInput = null;

let lightning1MixtureInput = null;
let lightning1ColorInput = null;
let lightning1XInput = null;
let lightning1YInput = null;
let lightning1ZInput = null;
let lightning1Falloff = null;
let lightning1End = null;

// Dimensions representing the 16x16x16 pixel volume used as base for perlin noise
let noiseBase = null;
let noiseBaseDimension = 16; // 16x16 pixel tiles
let noiseBaseRowLength = 4; // Laid out in a 4x4 grid of 16x16 pixel tiles
let textureDimension = 64; //2D Dimension of full noiseBase texture (noiseBaseDimension * noiseBaseRowLength)

const piOver2 = Math.PI / 2.0;

// 3d vector of zeroes
const VEC3_ZERO = [0, 0, 0];

// Axis ids used by gl-matrix.js rotation functions
const XAXIS = [1, 0, 0];
const YAXIS = [0, 1, 0];
const ZAXIS = [0, 0, 1];

//Projection matrix
const projectionMatrix = mat4.create();

//Skybox rotation matrix
const skyBoxRotationMatrix = mat4.create();

//tmin falloff tmax and step size
const stepSettings = vec4.create();

//Colors
const skyColor = vec3.create();
const darkColor = vec3.create();
const lightColor = vec3.create();
const sunColor = vec3.create();

// sun intensity (inversed due to pow function)
let sunIntensity = 4.0;

// sun direction
const sunDir = vec3.create();

//sun tmax and step size
const sunStepSettings = vec2.create();

// Beers law light absorption factor
let lightAbsorption = 1.0;

// Fog
let fog = 1.0;

//noise scale and translation settings
const noiseInputSettings = vec4.create();

//noise slope and offset
const noiseOutputSettings = vec2.create();

// Flag whether this is a lightning render or regular sky render
let isLightningStage = -1.0;

let lightning1Mixture = 0.0;

//Lightning position and brightness uniforms
const lightningSettings = [

    {color: vec3.create(), source: vec3.create(), fallEnd: vec2.create(),},
    {color: vec3.create(), source: vec3.create(), fallEnd: vec2.create(),},
    {color: vec3.create(), source: vec3.create(), fallEnd: vec2.create(),},
    {color: vec3.create(), source: vec3.create(), fallEnd: vec2.create(),},
];

//tile coordinates uniform
const tileCoordinates = vec4.create();

// Maximums and defaults for skybox rendering stages
const SKYBOX_TILE_SIZE = 128;
const MAX_LIGHTNING_STAGES = 5;
const MAX_Y_TILES = 8;
const MAX_X_TILES = 8;

// Variables to keep track of which stage the skybox rendering is in
let skyboxRenderingStage = {

    newSkyboxRequested: false,
    lightning: MAX_LIGHTNING_STAGES,
    panel: 6,
    y: MAX_Y_TILES,
    x: MAX_X_TILES,
};

let displayStage = 0.0;

// Player (camera)
let player = {

    yawAngle: 0.0, // Angle of rotation around y axis
    pitchAngle: 0.0, // Angle of rotation around x axis

    //Normal vectors representing right, left, and forward for the player's view.
    //Player is initialized facing negative Z
    rightVec: vec3.fromValues(1.0, 0.0, 0.0),
    forwardVec: vec3.fromValues(0.0, 0.0, -1.0),
};

let skyboxRotation = 0.0; // Angle of rotation around y axis before camera angle is applied, to mimic clouds moving in a circle
let skyboxRotationSpeed = 0.02; // Angle skybox should rotate every frame/second/etc

/**
 * Object: lastMousePosition
 * 
 * Description: contains data on last mouse position relative to the canvas
 * 
 * Attributes: Boolean inWindow,
 *             Double x, y,
 * 
 */
 let lastMousePosition = {

    inWindow: false,
    x: 0,
    y: 0,
};

let skyBoxShader = {

    vertexShaderCode: `
    
        attribute vec4 a_vertexPosition;
        attribute vec2 a_textureCoordinates;

        uniform mat4 u_projectionMatrix;
        uniform mat4 u_worldViewMatrix;

        varying highp vec2 v_textureCoordinates;

        void main(void)
        {
            gl_Position = u_projectionMatrix * u_worldViewMatrix * a_vertexPosition; // Calculate vertex position in frame
            v_textureCoordinates = a_textureCoordinates;
        }
    `,

    fragmentShaderCode: `
    
        precision highp float;
    
        varying highp vec2 v_textureCoordinates;

        uniform sampler2D u_sampler0;
        uniform sampler2D u_sampler1;

        uniform highp float u_mixture1;

        void main(void)
        {
            vec3 finalColor = texture2D(u_sampler0, v_textureCoordinates).xyz; // Get sunlit clouds (stage 0)
            finalColor += clamp(texture2D(u_sampler1, v_textureCoordinates).xyz * u_mixture1, 0.0, 1.0);

            
            gl_FragColor = vec4(finalColor, 1.0); // The color of the texture mapped to the current point
        }
    `,

    program: null,
    attributes: null,
    uniforms: null,

    tieLocations: function() {

        //Get location of attributes and uniforms, store in the ShaderData object
        this.attributes = {

            vertexPosition: ctx.getAttribLocation(this.program, "a_vertexPosition"),
            textureCoordinates: ctx.getAttribLocation(this.program, "a_textureCoordinates"),
        };
        
        this.uniforms = {

            projectionMatrix: ctx.getUniformLocation(this.program, "u_projectionMatrix"),
            worldViewMatrix: ctx.getUniformLocation(this.program, "u_worldViewMatrix"),
            uSampler0: ctx.getUniformLocation(this.program, "u_sampler0"),
            uSampler1: ctx.getUniformLocation(this.program, "u_sampler1"),
            mixture1: ctx.getUniformLocation(this.program, "u_mixture1"),
        };
    },
};

let cloudShader = {

    vertexShaderCode: `
    
        attribute vec4 a_viewportVertexPosition; // Position to render to the viewport/framebuffer

        uniform vec4 u_tileCoordinates; // Uniform representing the pixel coordinates of the tile to be rendered
                                        // .x: lower x coordinate
                                        // .y: lower y coordinate
                                        // .z: upper x coordinate
                                        // .w: upper y coordinate
        uniform mat4 u_rotationMatrix; // Matrix rotate v_vertexPosition to point to the correct skybox panel

        varying highp vec4 v_vertexPosition;

        void main(void)
        {
            // Map x and y values of u_tileCoordinates to x and y values of a_viewportVertexPosition
            v_vertexPosition = vec4(0.0, 0.0, -1.0, 1.0);
            if (a_viewportVertexPosition.x < 0.0) { v_vertexPosition.x = u_tileCoordinates.x; }
            else { v_vertexPosition.x = u_tileCoordinates.z; }
            if (a_viewportVertexPosition.y < 0.0) { v_vertexPosition.y = u_tileCoordinates.y; }
            else { v_vertexPosition.y = u_tileCoordinates.w; }

            // Transform x and y coordinates to clip space
            v_vertexPosition.x = clamp((v_vertexPosition.x / 1024.0) * 2.0 - 1.0, -1.0, 1.0);
            v_vertexPosition.y = clamp((v_vertexPosition.y / 1024.0) * 2.0 - 1.0, -1.0, 1.0);

            // Rotate to face correct panel
            v_vertexPosition = u_rotationMatrix * v_vertexPosition;
            

            gl_Position = a_viewportVertexPosition;
        }
    `,

    fragmentShaderCode: `
    
        #define PI 3.1415926538
    
        precision highp float;
    
        varying highp vec4 v_vertexPosition;
        
        uniform float u_dimension;
        uniform float u_rowLength;
        uniform sampler2D u_sampler;

        // noise input settings
        uniform vec4 u_noiseInputSettings; // .x x translation, .y y translation, .z z translation, .w scale

        // noise output settings
        uniform vec2 u_noiseOutputSettings; // .x slope, .y offset

        uniform vec4 u_stepSettings; // .x tmin, .y densityFalloff, .z tmax, .w stepSize

        uniform vec3 u_skyColor;
        uniform vec3 u_darkColor;
        uniform vec3 u_lightColor;

        uniform vec3 u_sunColor;
        uniform float u_sunIntensityFactor;
        uniform vec3 u_sunDir;

        uniform vec2 u_sunStepSettings; // .x sun tmax, .y stepSize

        uniform float u_lightAbsorption;

        uniform float u_fog;

        uniform float u_isLightningStage; // Whether we are doing a lighting stage, > 0.0 for true, < 0.0 for false
        uniform vec3 u_lightningColor;
        uniform vec3 u_lightningSource;
        uniform vec2 u_lightningFallEnd; // .x lightning falloff start, .y lightning end

        vec4 vol3D(sampler2D sampler, vec3 coord, float tileDimension, float rowLength)
        { 
            float tileIndex = floor(coord.z * tileDimension) / rowLength;
            
            vec2 tileCoord;
            tileCoord.x = fract(tileIndex) * rowLength;
            tileCoord.y = floor(tileIndex);
            
            vec2 finalCoord = (tileCoord + coord.xy) / rowLength;

            return texture2D(sampler, finalCoord);
        }

        float noise3D(vec3 stu)
        {
            stu *= u_dimension;
            vec3 stu_i = floor(stu);
            vec3 stu_f = fract(stu);
            //vec2 smooth = smoothstep(0.0, 1.0, st_f);
            vec3 smooth = stu_f * stu_f * stu_f * (stu_f * (stu_f * 6.0 - 15.0) + 10.0);

            // Get the index of the eight corners of this grid square
            vec3 i000 = stu_i;
            vec3 i100 = stu_i + vec3(1.0, 0.0, 0.0); if (i100.x >= u_dimension) { i100.x -= u_dimension; }
            vec3 i010 = stu_i + vec3(0.0, 1.0, 0.0); if (i010.y >= u_dimension) { i010.y -= u_dimension; }
            vec3 i110 = stu_i + vec3(1.0, 1.0, 0.0); if (i110.x >= u_dimension) { i110.x -= u_dimension; } if (i110.y >= u_dimension) { i110.y -= u_dimension; }
            vec3 i001 = stu_i + vec3(0.0, 0.0, 1.0); if (i001.z >= u_dimension) { i001.z -= u_dimension; }
            vec3 i101 = stu_i + vec3(1.0, 0.0, 1.0); if (i101.x >= u_dimension) { i101.x -= u_dimension; } if (i101.z >= u_dimension) { i101.z -= u_dimension; }
            vec3 i011 = stu_i + vec3(0.0, 1.0, 1.0); if (i011.y >= u_dimension) { i011.y -= u_dimension; } if (i011.z >= u_dimension) { i011.z -= u_dimension; }
            vec3 i111 = stu_i + vec3(1.0, 1.0, 1.0); if (i111.x >= u_dimension) { i111.x -= u_dimension; } if (i111.y >= u_dimension) { i111.y -= u_dimension; } if (i111.z >= u_dimension) { i111.z -= u_dimension; }

            // Get the values of the eight corners
            i000 = vol3D(u_sampler, i000 / u_dimension, u_dimension, u_rowLength).xyz;
            i100 = vol3D(u_sampler, i100 / u_dimension, u_dimension, u_rowLength).xyz;
            i010 = vol3D(u_sampler, i010 / u_dimension, u_dimension, u_rowLength).xyz;
            i110 = vol3D(u_sampler, i110 / u_dimension, u_dimension, u_rowLength).xyz;
            i001 = vol3D(u_sampler, i001 / u_dimension, u_dimension, u_rowLength).xyz;
            i101 = vol3D(u_sampler, i101 / u_dimension, u_dimension, u_rowLength).xyz;
            i011 = vol3D(u_sampler, i011 / u_dimension, u_dimension, u_rowLength).xyz;
            i111 = vol3D(u_sampler, i111 / u_dimension, u_dimension, u_rowLength).xyz;

            // Calculate unit vectors
            i000 = normalize(i000 * 2.0 - 1.0);
            i100 = normalize(i100 * 2.0 - 1.0);
            i010 = normalize(i010 * 2.0 - 1.0);
            i110 = normalize(i110 * 2.0 - 1.0);
            i001 = normalize(i001 * 2.0 - 1.0);
            i101 = normalize(i101 * 2.0 - 1.0);
            i011 = normalize(i011 * 2.0 - 1.0);
            i111 = normalize(i111 * 2.0 - 1.0);

            // Calculate dot products
            float d000 = dot(i000, stu_f - vec3(0.0, 0.0, 0.0));
            float d100 = dot(i100, stu_f - vec3(1.0, 0.0, 0.0));
            float d010 = dot(i010, stu_f - vec3(0.0, 1.0, 0.0));
            float d110 = dot(i110, stu_f - vec3(1.0, 1.0, 0.0));
            float d001 = dot(i001, stu_f - vec3(0.0, 0.0, 1.0));
            float d101 = dot(i101, stu_f - vec3(1.0, 0.0, 1.0));
            float d011 = dot(i011, stu_f - vec3(0.0, 1.0, 1.0));
            float d111 = dot(i111, stu_f - vec3(1.0, 1.0, 1.0));

            // Mix it all together based on smoothstep
            return mix(
                    mix(
                        mix(
                            d000,
                            d100,
                            smooth.x
                        ),
                        mix(
                            d010,
                            d110,
                            smooth.x
                        ),
                        smooth.y
                    ),
                    mix(
                        mix(
                            d001,
                            d101,
                            smooth.x
                        ),
                        mix(
                            d011,
                            d111,
                            smooth.x
                        ),
                        smooth.y
                    ),
                    smooth.z
                );
        }

        vec3 wrapVolumeCoords(vec3 coord)
        {
            coord = fract(coord);

            if (coord.x < 0.0)
            {
                coord.x += 1.0;
            }
            if (coord.y < 0.0)
            {
                coord.y += 1.0;
            }
            if (coord.z < 0.0)
            {
                coord.z += 1.0;
            }

            return coord;
        }

        float sampleDensity(vec3 stu, float scale, vec3 translation, float slope)
        {
            return clamp(noise3D(wrapVolumeCoords(stu*scale + translation))*slope, 0.0, 1.0);
        }

        float sampleLayeredDensity(vec3 stu)
        {
            float density;

            // Sample layer 1
            density = sampleDensity(stu, 1.0, vec3(0.0), 1.0);

            // Sample layer 2
            density += sampleDensity(stu, 2.0, vec3(0.15), 0.5);

            // Sample layer 3
            density += sampleDensity(stu, 4.0, vec3(0.3), 0.25);

            // Sample layer 4
            density += sampleDensity(stu, 8.0, vec3(0.45), 0.125);

            // Sample layer 5
            density += sampleDensity(stu, 16.0, vec3(0.6), 0.0625);

            // Sample layer 6
            density += sampleDensity(stu, 32.0, vec3(0.22), 0.03125);

            return clamp(density, 0.0, 1.0);
        }

        vec4 raymarching(vec3 ro, vec3 rd, vec3 lightDir, vec3 skyColor)
        {
            float noiseScale = u_noiseInputSettings.w;
            vec3 noiseTranslation = u_noiseInputSettings.xyz;
            float noiseSlope = u_noiseOutputSettings.x;
            float noiseOffset = u_noiseOutputSettings.y;
            
            float tmin = u_stepSettings.x;
            float tdensityFalloff = u_stepSettings.y;
            float tmax = u_stepSettings.z;
            float stepSize = u_stepSettings.w;
            float tsunMax = u_sunStepSettings.x;
            float sunStepSize = u_sunStepSettings.y;
            float lightAbsorption = u_lightAbsorption;
            float fog = u_fog;
            
            vec4 cloudColor = vec4(0.0);
            float t = tmin;

            // Calculate length vectors between which sampled density begins disappearing
            float densityFalloffStart = length(ro + rd*tdensityFalloff);
            float densityFalloffEnd = length(ro + rd*tmin);
            float densityFalloffSize = densityFalloffStart - densityFalloffEnd;

            for (int i=0; i<200; i++)
            {
                vec3 currentPos = ro + rd*t;
                float sampleDistance = length(currentPos);
                
                
                float density = clamp(sampleLayeredDensity(currentPos*noiseScale + noiseTranslation)*noiseSlope + noiseOffset, 0.0, 1.0);
                // If within density falloff area
                if (sampleDistance < densityFalloffStart)
                {
                    density = mix(0.0, density, (sampleDistance - densityFalloffEnd) / densityFalloffSize);
                }

                // If inside a cloud
                if (density > 0.01)
                {
                    float tsun = 0.0;
                    float densityToSun = density;

                    // If doing lightning stage, recalculate light direction based on lightning source
                    if (u_isLightningStage > 0.0)
                    {
                        lightDir = normalize(currentPos - u_lightningSource);
                    }

                    for (int j=0; j<5; j++)
                    {
                        vec3 newPos = currentPos + -1.0*lightDir*tsun;
                        sampleDistance = length(newPos);
                        // If sample is further than falloff end, then there is a density
                        if (sampleDistance >= densityFalloffEnd)
                        {
                            float newDensity = clamp(sampleLayeredDensity(newPos*noiseScale + noiseTranslation)*noiseSlope + noiseOffset, 0.0, 1.0);
                            // If within density falloff area
                            if (sampleDistance < densityFalloffStart)
                            {
                                newDensity = mix(0.0, newDensity, (sampleDistance - densityFalloffEnd) / densityFalloffSize);
                            }
                            
                            densityToSun += newDensity;
                            densityToSun = clamp(densityToSun, 0.0, 1.0);
                        }

                        tsun += sunStepSize;

                        if (densityToSun >= 1.0)
                        {
                            densityToSun = 1.0;
                            break;
                        }

                        if (tsun > tsunMax)
                        {
                            break;
                        }
                    }

                    float brightness;
                    
                    if (u_isLightningStage > 0.0)
                    {
                        brightness = exp(-1.0 * lightAbsorption * densityToSun * 0.2);
                    }
                    else
                    {
                        brightness = exp(-1.0 * lightAbsorption * densityToSun);
                    }


                    // If doing a lightning stage, brightness needs to be mixed with lightning falloff
                    if (u_isLightningStage > 0.0)
                    {
                        float distanceFromSource = length(currentPos - u_lightningSource);
                        if (distanceFromSource >= u_lightningFallEnd.y)
                        {
                            brightness = 0.0;
                        }
                        else if (distanceFromSource >= u_lightningFallEnd.x)
                        {
                            brightness = mix(brightness, 0.0, (distanceFromSource - u_lightningFallEnd.x) / (u_lightningFallEnd.y - u_lightningFallEnd.x));
                        }
                    }
                    vec4 pointColor;
                    // If doing a lightning stage, pointColor is black mixed with lightning color
                    if (u_isLightningStage > 0.0)
                    {
                        pointColor = vec4(mix(vec3(0.0), u_lightningColor, brightness), density);
                    }
                    else
                    {
                        pointColor = vec4(mix(u_darkColor, u_lightColor, brightness), density);
                    }

                    // Fog
                    pointColor.rgb = mix(skyColor, pointColor.rgb, exp(-1.0*fog*t));

                    pointColor.rgb *= pointColor.a;
                    cloudColor += pointColor*(1.0 - cloudColor.a);
                    clamp(cloudColor, 0.0, 1.0);
                }

                t += stepSize;

                if (cloudColor.a >= 1.0)
                {
                    cloudColor.a = 1.0;
                    break;
                }
                
                if (t > tmax)
                {
                    break;
                }
            }

            return cloudColor;
        }
        
        void main()
        {   
            vec3 lightDir = normalize(u_sunDir); // Set lightDir as direction of the sunlight if not doing a lightning stage
            
            // Direction of ray is origin to vertex coordinates
            vec3 rd = normalize(v_vertexPosition.xyz);

            // This prevents a strange cross artifact forming in the center due to rounding error
            if ((rd.x > -0.0001) && (rd.x < 0.0001)) {rd.x = 0.0;}
            if ((rd.y > -0.0001) && (rd.y < 0.0001)) {rd.y = 0.0;}

            // Ray origin
            vec3 ro = vec3(0.0, 0.0, 0.0);

            vec3 finalColor = vec3(0.0);

            // If not doing a lightning stage, Compute overall background sky color by putting in the sun
            if (u_isLightningStage < 0.0)
            {
                float sunIntensityAtPoint = clamp(dot(lightDir * -1.0, rd), 0.0, 1.0);
                finalColor = u_skyColor + u_sunColor * pow(sunIntensityAtPoint, u_sunIntensityFactor);
            }

            vec4 cloudColoring = raymarching(ro, rd, lightDir, finalColor);

            finalColor = clamp(cloudColoring.rgb + finalColor*(1.0 - cloudColoring.a), 0.0, 1.0);
            

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,

    program: null,
    attributes: null,
    uniforms: null,

    tieLocations: function() {

        //Get location of attributes and uniforms, store in the ShaderData object
        this.attributes = {

            viewportVertexPosition: ctx.getAttribLocation(this.program, "a_viewportVertexPosition"),
        };
        this.uniforms = {

            tileCoordinates: ctx.getUniformLocation(this.program, "u_tileCoordinates"),
            rotationMatrix: ctx.getUniformLocation(this.program, "u_rotationMatrix"),
            dimension: ctx.getUniformLocation(this.program, "u_dimension"),
            rowLength: ctx.getUniformLocation(this.program, "u_rowLength"),
            sampler: ctx.getUniformLocation(this.program, "u_sampler"),
            noiseInputSettings: ctx.getUniformLocation(this.program, "u_noiseInputSettings"),
            noiseOutputSettings: ctx.getUniformLocation(this.program, "u_noiseOutputSettings"),
            stepSettings: ctx.getUniformLocation(this.program, "u_stepSettings"),
            skyColor: ctx.getUniformLocation(this.program, "u_skyColor"),
            darkColor: ctx.getUniformLocation(this.program, "u_darkColor"),
            lightColor: ctx.getUniformLocation(this.program, "u_lightColor"),
            sunColor: ctx.getUniformLocation(this.program, "u_sunColor"),
            sunIntensity: ctx.getUniformLocation(this.program, "u_sunIntensityFactor"),
            sunDir: ctx.getUniformLocation(this.program, "u_sunDir"),
            sunStepSettings: ctx.getUniformLocation(this.program, "u_sunStepSettings"),
            lightAbsorption: ctx.getUniformLocation(this.program, "u_lightAbsorption"),
            fog: ctx.getUniformLocation(this.program, "u_fog"),
            isLightningStage: ctx.getUniformLocation(this.program, "u_isLightningStage"),
            lightningColor: ctx.getUniformLocation(this.program, "u_lightningColor"),
            lightningSource: ctx.getUniformLocation(this.program, "u_lightningSource"),
            lightningFallEnd: ctx.getUniformLocation(this.program, "u_lightningFallEnd"),
        }
        
    },
};

let skyBoxModels = {
    nzPlane: {

        vertexCoordinates: [

            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            -1.0, 1.0, -1.0,
        ],

        uvValues: [

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ],

        elementIndices: [

            0, 2, 3,
            0, 1, 2,
        ],

        elementCount: 6,

        texture: null,
    },

    pxPlane: {

        vertexCoordinates: [

            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,
        ],

        uvValues: [

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ],

        elementIndices: [

            0, 2, 3,
            0, 1, 2,
        ],

        elementCount: 6,

        texture: null,
    },

    pzPlane: {

        vertexCoordinates: [

            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
        ],

        uvValues: [

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ],

        elementIndices: [

            0, 2, 3,
            0, 1, 2,
        ],

        elementCount: 6,

        texture: null,
    },

    nxPlane: {

        vertexCoordinates: [

            -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
        ],

        uvValues: [

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ],

        elementIndices: [

            0, 2, 3,
            0, 1, 2,
        ],

        elementCount: 6,

        texture: null,
    },

    pyPlane: {

        vertexCoordinates: [

            
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0
            
        ],

        uvValues: [
            
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ],

        elementIndices: [

            0, 2, 3,
            0, 1, 2,
        ],

        elementCount: 6,

        texture: null,
    },

    nyPlane: {

        vertexCoordinates: [

            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0,
        ],

        uvValues: [

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ],

        elementIndices: [

            0, 2, 3,
            0, 1, 2,
        ],

        elementCount: 6,

        texture: null,
    },
};

let skyBoxTextures = {

    nzPlane: [null],
    pxPlane: [null],
    pzPlane: [null],
    nxPlane: [null],
    pyPlane: [null],
    nyPlane: [null],
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

    //Add mouse event listeners
    canvas.addEventListener("mousemove", updateMouse);
    canvas.addEventListener("mouseleave", mouseLeave);

    //Get tmin densityfalloff tmax and step size inputs
    tminInput = document.getElementById("tminInput");
    densityFalloffInput = document.getElementById("densityFalloffInput");
    tmaxInput = document.getElementById("tmaxInput");
    stepSizeInput = document.getElementById("stepSizeInput");

    //Add event listeners for tmin densityfalloff tmax and step size
    tminInput.addEventListener("change", inputChangeHandler);
    densityFalloffInput.addEventListener("change", inputChangeHandler);
    tmaxInput.addEventListener("change", inputChangeHandler);
    stepSizeInput.addEventListener("change", inputChangeHandler);

    //Get color inputs
    skyColorInput = document.getElementById("skyColorInput");
    darkColorInput = document.getElementById("darkColorInput");
    lightColorInput = document.getElementById("lightColorInput");

    //Add event listeners for colors
    skyColorInput.addEventListener("change", inputChangeHandler);
    darkColorInput.addEventListener("change", inputChangeHandler);
    lightColorInput.addEventListener("change", inputChangeHandler);

    // Get sun settings inputs
    sunColorInput = document.getElementById("sunColorInput");
    sunIntensityInput = document.getElementById("sunIntensityInput");
    sunXInput = document.getElementById("sunXInput");
    sunYInput = document.getElementById("sunYInput");
    sunZInput = document.getElementById("sunZInput");
    
    // Add event listeners for sun settings
    sunColorInput.addEventListener("change", inputChangeHandler);
    sunIntensityInput.addEventListener("change", inputChangeHandler);
    sunXInput.addEventListener("change", inputChangeHandler);
    sunYInput.addEventListener("change", inputChangeHandler);
    sunZInput.addEventListener("change", inputChangeHandler);

    //Get sun tmax and step size inputs
    tsunMaxInput = document.getElementById("tsunMaxInput");
    sunStepSizeInput = document.getElementById("sunStepSizeInput");

    //Add event listeners to sun step settings
    tsunMaxInput.addEventListener("change", inputChangeHandler);
    sunStepSizeInput.addEventListener("change", inputChangeHandler);

    // Get light absorption input
    lightAbsorptionInput = document.getElementById("lightAbsorptionInput");

    // Add event listener to light absorption
    lightAbsorptionInput.addEventListener("change", inputChangeHandler);

    // Get fog input
    fogInput = document.getElementById("fogInput");

    // Add event listener for fog level
    fogInput.addEventListener("change", inputChangeHandler);

    //Get noise settings inputs
    resetNoiseInput = document.getElementById("resetNoiseInput");
    noiseScaleInput = document.getElementById("noiseScaleInput");
    noiseXInput = document.getElementById("noiseXInput");
    noiseYInput = document.getElementById("noiseYInput");
    noiseZInput = document.getElementById("noiseZInput");
    noiseSlopeInput = document.getElementById("noiseSlopeInput");
    noiseOffsetInput = document.getElementById("noiseOffsetInput");
    
    //Add event listeners for noise settings
    resetNoiseInput.addEventListener("click", resetNoiseHandler);
    noiseScaleInput.addEventListener("change", inputChangeHandler);
    noiseXInput.addEventListener("change", inputChangeHandler);
    noiseYInput.addEventListener("change", inputChangeHandler);
    noiseZInput.addEventListener("change", inputChangeHandler);
    noiseSlopeInput.addEventListener("change", inputChangeHandler);
    noiseOffsetInput.addEventListener("change", inputChangeHandler);

    // Get display stage input and add event listener
    displayStageInput = document.getElementById("displayStageInput");
    displayStageInput.addEventListener("change", switchDisplayStage);

    // Get lightning settings inputs
    lightning1MixtureInput = document.getElementById("lightning1MixtureInput");
    lightning1ColorInput = document.getElementById("lightning1ColorInput");
    lightning1XInput = document.getElementById("lightning1XInput");
    lightning1YInput = document.getElementById("lightning1YInput");
    lightning1ZInput = document.getElementById("lightning1ZInput");
    lightning1Falloff = document.getElementById("lightning1Falloff");
    lightning1End = document.getElementById("lightning1End");

    // Add event listeners for lightning settings
    lightning1MixtureInput.addEventListener("input", fetchLightningMixture);
    lightning1ColorInput.addEventListener("change", inputChangeHandler);
    lightning1XInput.addEventListener("change", inputChangeHandler);
    lightning1YInput.addEventListener("change", inputChangeHandler);
    lightning1ZInput.addEventListener("change", inputChangeHandler);
    lightning1Falloff.addEventListener("change", inputChangeHandler);
    lightning1End.addEventListener("change", inputChangeHandler);

    createShaderProgram(skyBoxShader);
    createShaderProgram(cloudShader);

    // Create the framebuffer
    frameBuffer = ctx.createFramebuffer();

    // Load skybox panels
    for (panel in skyBoxModels)
    {
        loadModel(skyBoxModels[panel]);
    }

    // Load space for skybox textures
    loadSkyboxTextures();

    // Attach textures to the proper models
    skyBoxModels.nzPlane.texture = skyBoxTextures.nzPlane;
    skyBoxModels.pxPlane.texture = skyBoxTextures.pxPlane;
    skyBoxModels.pzPlane.texture = skyBoxTextures.pzPlane;
    skyBoxModels.nxPlane.texture = skyBoxTextures.nxPlane;
    skyBoxModels.pyPlane.texture = skyBoxTextures.pyPlane;
    skyBoxModels.nyPlane.texture = skyBoxTextures.nyPlane;
    
    
    // Load the noiseBase texture
    loadNoiseTexture();
    
    // Fetch other settings from webpage
    fetchSettings();

    requestNewSkybox();

    let previousTimeStamp = 0.0;
    let deltaT = 0.0;

    // Whether or not we are on the first animation frame, see below
    //let firstFrame = true;

    // Animation loop
    function newFrame(now)
    {
        //Get change in time
        now *= 0.001; //Convert to seconds

        deltaT = now - previousTimeStamp;
        previousTimeStamp = now;

        // Update skybox rotation
        skyboxRotation += skyboxRotationSpeed * deltaT;
        
        renderFrame();

        // This bit of code is here because for some reason the clouds on the negative z skybox panel do not render on the very first frame, so I need to call requestNewSkybox again at least once in the animation loop. This is a temporary fix
        /*if (firstFrame)
        {
            requestNewSkybox();
            firstFrame = false;
        }*/

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

    // Create pointer to a new buffer
    let uvBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, uvBuffer);

    // Pass in uv data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(model.uvValues), ctx.STATIC_DRAW);


    //Create pointer to a new buffer
    let elementIndicesBuffer = ctx.createBuffer();

    //Bind the buffer to element buffer
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, elementIndicesBuffer);

    //Pass in element index data
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.elementIndices), ctx.STATIC_DRAW);

    model.buffers = {

        vertex: vertexBuffer,
        uv: uvBuffer,
        elementIndices: elementIndicesBuffer,
    };
}

/**
 * Function: loadNoiseTexture
 * 
 * Input: WebGLTexture texture
 * Output: None
 * 
 * Description: Creates a new texture to be used for generating perlin noise
 */
function loadNoiseTexture()
{
    noiseBase = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, noiseBase);

    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);

    // Load random noise into texture
    loadNewNoise();
}

/**
 * Function: loadNewNoise
 * 
 * Input: None
 * Output: None
 * 
 * Description: Resets the data in the noise base used to generate perlin noise
 */
function loadNewNoise()
{
    let textureData = new Array(textureDimension * textureDimension * 4);

    for (let i = 0; i < textureDimension * textureDimension * 4; i += 4)
    {
        textureData[i    ] = Math.floor(Math.random() * 256.0);
        textureData[i + 1] = Math.floor(Math.random() * 256.0);
        textureData[i + 2] = Math.floor(Math.random() * 256.0);
        textureData[i + 3] = 255;
    }

    ctx.bindTexture(ctx.TEXTURE_2D, noiseBase);

    ctx.texImage2D(
        ctx.TEXTURE_2D,
        0, // LOD
        ctx.RGBA, // internal format
        textureDimension, // Width
        textureDimension, // Height
        0, // Border
        ctx.RGBA, // source format
        ctx.UNSIGNED_BYTE, // source type
        new Uint8Array(textureData)
    );
}

/**
 * Function: loadSkyboxTextures
 * 
 * Input: None
 * Output: None
 * 
 * Description: allocates space on the GPU for the skybox panel textures
 */
function loadSkyboxTextures()
{
    //skyBoxTextures.nzPlane = loadSingleSkyboxTexture(255, 0, 0); // Forward red
    //skyBoxTextures.pxPlane = loadSingleSkyboxTexture(0, 255, 0); // right green
    //skyBoxTextures.pzPlane = loadSingleSkyboxTexture(0, 0, 255); // back blue
    //skyBoxTextures.nxPlane = loadSingleSkyboxTexture(255, 0, 255); // left purple
    //skyBoxTextures.pyPlane = loadSingleSkyboxTexture(255, 255, 0); // up yellow
    //skyBoxTextures.nyPlane = loadSingleSkyboxTexture(0, 255, 255); // down cyan

    for (let i=0; i<MAX_LIGHTNING_STAGES; i++)
    {
        skyBoxTextures.nzPlane[i] = loadSingleSkyboxTexture();
        skyBoxTextures.pxPlane[i] = loadSingleSkyboxTexture();
        skyBoxTextures.pzPlane[i] = loadSingleSkyboxTexture();
        skyBoxTextures.nxPlane[i] = loadSingleSkyboxTexture();
        skyBoxTextures.pyPlane[i] = loadSingleSkyboxTexture();
        skyBoxTextures.nyPlane[i] = loadSingleSkyboxTexture();
    }
}

/**
 * Function: loadSingleSkyboxTexture
 * 
 * Input: WebGLTexture texture, int red, int green, int blue
 * Output: None
 * 
 * Description: allocates space on the GPU for one skybox texture of the given color
 */
function loadSingleSkyboxTexture()
{
    let texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, texture);

    ctx.texImage2D(
        ctx.TEXTURE_2D,
        0, // LOD
        ctx.RGBA, // internal format
        1024, // Width
        1024, // Height
        0, // Border
        ctx.RGBA, // source format
        ctx.UNSIGNED_BYTE, // source type
        null
    );

    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);

    return texture;
}

/**
 * Function: requestNewSkybox
 * 
 * Input: None
 * Output: None
 * 
 * Description: Resets newSkyboxRequested to true so that the animation loop can begin
 * rendering a new skybox with presumably a new configuration of settings
 */

function requestNewSkybox()
{
    skyboxRenderingStage.newSkyboxRequested = true;
}

function renderFrame()
{   
    renderNewSkybox(); // This will render a portion of new clouds to the skybox if an update was requested
    
    ctx.canvas.width = ctx.canvas.clientWidth;   //Resize canvas to fit CSS styling
    ctx.canvas.height = ctx.canvas.clientHeight;

    ctx.bindFramebuffer(ctx.FRAMEBUFFER, null); // Bind rendering back to canvas

    ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height); //Resize viewport

    //Clear the canvas
    ctx.clearColor(1.0, 1.0, 1.0, 1.0); //set clear color to white
    ctx.clearDepth(1.0); //set clear depth to 1.0
    ctx.clear(ctx.COLOR_BUFFER_BIT, ctx.DEPTH_BUFFER_BIT);

    //Enable backface culling
    ctx.enable(ctx.CULL_FACE);
    ctx.cullFace(ctx.BACK);

    //Tell WebGL to use the shader program
    ctx.useProgram(skyBoxShader.program);

    //Compute projection matrix based on new window size
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, ctx.canvas.width / ctx.canvas.height, 0.1, 1000.0);

    //Set projection uniform
    ctx.uniformMatrix4fv(skyBoxShader.uniforms.projectionMatrix, false, projectionMatrix);

    // Compute skyBoxRotationMatrix
    mat4.identity(skyBoxRotationMatrix);
    mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, player.pitchAngle * -1.0, XAXIS); // Third transform, rotate the whole world around x axis (in the opposite direction the player is facing)
    mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, player.yawAngle * -1.0, YAXIS); // Second transform, rotate the whole world around y axis (in the opposite direction the player is facing)
    mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, skyboxRotation * -1.0, YAXIS); // First transform, rotate the skybox around y axis based on skyboxRotation

    // Set world view uniform
    ctx.uniformMatrix4fv(skyBoxShader.uniforms.worldViewMatrix, false, skyBoxRotationMatrix);

    // Get lightning1 mixture
    ctx.uniform1f(skyBoxShader.uniforms.mixture1, lightning1Mixture*(Math.random() - 0.01));

    // For each panel of the skybox
    for (panel in skyBoxModels)
    {
        //Instruct WebGL how to pull out vertices
        ctx.bindBuffer(ctx.ARRAY_BUFFER, skyBoxModels[panel].buffers.vertex);
        ctx.vertexAttribPointer(skyBoxShader.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
        ctx.enableVertexAttribArray(skyBoxShader.attributes.vertexPosition); //Enable the pointer to the buffer

        //Instruct WebGL how to pull out texture coordinates
        ctx.bindBuffer(ctx.ARRAY_BUFFER, skyBoxModels[panel].buffers.uv);
        ctx.vertexAttribPointer(skyBoxShader.attributes.textureCoordinates, 2, ctx.FLOAT, false, 0, 0);
        ctx.enableVertexAttribArray(skyBoxShader.attributes.textureCoordinates);

        //Get sunlit clouds texture unit
        ctx.activeTexture(ctx.TEXTURE0);
        ctx.bindTexture(ctx.TEXTURE_2D, skyBoxModels[panel].texture[displayStage]);
        ctx.uniform1i(skyBoxShader.uniforms.uSampler0, 0);

        //Get lighting1 clouds texture unit
        ctx.activeTexture(ctx.TEXTURE1);
        ctx.bindTexture(ctx.TEXTURE_2D, skyBoxModels[panel].texture[1]);
        ctx.uniform1i(skyBoxShader.uniforms.uSampler1, 1);

        //Give WebGL the element array
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, skyBoxModels[panel].buffers.elementIndices);

        //Draw triangles
        ctx.drawElements(ctx.TRIANGLES, skyBoxModels[panel].elementCount, ctx.UNSIGNED_SHORT, 0);
    }
}

function renderNewSkybox()
{
    // If new skybox was requested, reset all rendering stages to 0
    if (skyboxRenderingStage.newSkyboxRequested)
    {
        isLightningStage = -1.0;
        skyboxRenderingStage.lightning = 0;
        skyboxRenderingStage.panel = 0;
        skyboxRenderingStage.y = 0;
        skyboxRenderingStage.x = 0;
        skyboxRenderingStage.newSkyboxRequested = false;
    }

    // If last lightning stage was already rendered, early exit
    if (skyboxRenderingStage.lightning >= MAX_LIGHTNING_STAGES)
    {
        return;
    }

    // Error checking:

    // If x is below 0, reset to 0 and warn console
    if (skyboxRenderingStage.x < 0)
    {
        console.error("The x index in the current skybox rendering stage was found to be less than zero: " + skyboxRenderingStage.x);
        skyboxRenderingStage.x = 0;
        console.log("x index reset to 0");
    }
    if (skyboxRenderingStage.y < 0)
    {
        console.error("The y index in the current skybox rendering stage was found to be less than zero: " + skyboxRenderingStage.y);
        skyboxRenderingStage.y = 0;
        console.log("y index reset to 0");
    }
    if (skyboxRenderingStage.panel < 0)
    {
        console.error("The panel index in the current skybox rendering stage was found to be less than zero: " + skyboxRenderingStage.panel);
        skyboxRenderingStage.panel = 0;
        console.log("panel index reset to 0");
    }
    if (skyboxRenderingStage.lightning < 0)
    {
        console.error("The lightning index in the current skybox rendering stage was found to be less than zero: " + skyboxRenderingStage.lightning);
        skyboxRenderingStage.lightning = 0;
        console.log("lightning index reset to 0");
    }

    // Incrementing:

    // If x index is at maximum, reset to 0 and increment y index
    if (skyboxRenderingStage.x >= MAX_X_TILES)
    {
        skyboxRenderingStage.y++;
        skyboxRenderingStage.x = 0;
    }
    // If y index is at maximum, reset to 0 and increment panel index
    if (skyboxRenderingStage.y >= MAX_Y_TILES)
    {
        skyboxRenderingStage.panel++;
        skyboxRenderingStage.y = 0;
    }
    // If panel index is at maximum, reset to 0 and increment lightning index, also set isLightingStage to 1.0
    if (skyboxRenderingStage.panel >= 6)
    {
        skyboxRenderingStage.lightning++;
        isLightningStage = 1.0;
        skyboxRenderingStage.panel = 0;
    }
    // If lightning index is at maximum, exit the rendering function
    if (skyboxRenderingStage.lightning >= MAX_LIGHTNING_STAGES)
    {
        return;
    }

    
    // select skybox panel to render to and set rotation matrix
    let panelToRender = null;
    mat4.identity(skyBoxRotationMatrix);
    switch (skyboxRenderingStage.panel)
    {
        case 0:
            panelToRender = skyBoxModels.nzPlane;
            // No rotation
            break;
        case 1:
            panelToRender = skyBoxModels.nxPlane;
            mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, piOver2, YAXIS);
            break;
        case 2:
            panelToRender = skyBoxModels.pzPlane;
            mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, Math.PI, YAXIS);
            break;
        case 3:
            panelToRender = skyBoxModels.pxPlane;
            mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, piOver2 * -1.0, YAXIS);
            break;
        case 4:
            panelToRender = skyBoxModels.pyPlane;
            mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, piOver2, XAXIS);
            break;
        case 5:
            panelToRender = skyBoxModels.nyPlane;
            mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, piOver2 * -1.0, XAXIS);
            break;
        default:      //Any other number, exit the function
            return;
    }
    
    
    //Tell WebGL to use the cloud shader program
    ctx.useProgram(cloudShader.program);

    //Instruct WebGL on which texture to use for noise base
    ctx.activeTexture(ctx.TEXTURE0);
    ctx.bindTexture(ctx.TEXTURE_2D, noiseBase);
    ctx.uniform1i(cloudShader.uniforms.sampler, 0);

    // Set rotation uniform
    ctx.uniformMatrix4fv(cloudShader.uniforms.rotationMatrix, false, skyBoxRotationMatrix);

    // Set dimension uniform
    ctx.uniform1f(cloudShader.uniforms.dimension, noiseBaseDimension);

    // Set tile layout dimension
    ctx.uniform1f(cloudShader.uniforms.rowLength, noiseBaseRowLength);

    // Set noise inputs uniform
    ctx.uniform4fv(cloudShader.uniforms.noiseInputSettings, noiseInputSettings);

    // Set noise outputs uniform
    ctx.uniform2fv(cloudShader.uniforms.noiseOutputSettings, noiseOutputSettings);

    // Set step settings uniform
    ctx.uniform4fv(cloudShader.uniforms.stepSettings, stepSettings);

    // Set color uniforms
    ctx.uniform3fv(cloudShader.uniforms.skyColor, skyColor);
    ctx.uniform3fv(cloudShader.uniforms.darkColor, darkColor);
    ctx.uniform3fv(cloudShader.uniforms.lightColor, lightColor);
    ctx.uniform3fv(cloudShader.uniforms.sunColor, sunColor);

    // Set sun intensity uniform
    ctx.uniform1f(cloudShader.uniforms.sunIntensity, sunIntensity);

    // Set sun direction uniform
    ctx.uniform3fv(cloudShader.uniforms.sunDir, sunDir);

    // Set sun step settings uniform
    ctx.uniform2fv(cloudShader.uniforms.sunStepSettings, sunStepSettings);

    // Set light absorption uniform
    ctx.uniform1f(cloudShader.uniforms.lightAbsorption, lightAbsorption);

    // Set fog level uniform
    ctx.uniform1f(cloudShader.uniforms.fog, fog);

    // Set isLightningStage uniform
    ctx.uniform1f(cloudShader.uniforms.isLightningStage, isLightningStage);

    // If doing a lightning stage, Set lightning uniforms
    if (isLightningStage > 0.0)
    {
        ctx.uniform3fv(cloudShader.uniforms.lightningColor, lightningSettings[skyboxRenderingStage.lightning - 1].color);
        ctx.uniform3fv(cloudShader.uniforms.lightningSource, lightningSettings[skyboxRenderingStage.lightning - 1].source);
        ctx.uniform2fv(cloudShader.uniforms.lightningFallEnd, lightningSettings[skyboxRenderingStage.lightning - 1].fallEnd);
    }

    ctx.bindFramebuffer(ctx.FRAMEBUFFER, frameBuffer);

    // Render the selected panel
    renderPanelTexture(skyboxRenderingStage.x, skyboxRenderingStage.y, panelToRender, skyboxRenderingStage.lightning);
    skyboxRenderingStage.x++;
}

function renderPanelTexture(xIndex, yIndex, panel, lightningIndex)
{
    // Attach correct texture to frame buffer
    ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0, ctx.TEXTURE_2D, panel.texture[lightningIndex], 0);

    // Resize viewport to the current tile we are rendering to
    ctx.viewport(xIndex * SKYBOX_TILE_SIZE, yIndex * SKYBOX_TILE_SIZE, SKYBOX_TILE_SIZE, SKYBOX_TILE_SIZE);

    // Set tileCoordinates uniform
    tileCoordinates[0] = xIndex * SKYBOX_TILE_SIZE;
    tileCoordinates[1] = yIndex * SKYBOX_TILE_SIZE;
    tileCoordinates[2] = (xIndex + 1.0) * SKYBOX_TILE_SIZE;
    tileCoordinates[3] = (yIndex + 1.0) * SKYBOX_TILE_SIZE;
    ctx.uniform4fv(cloudShader.uniforms.tileCoordinates, tileCoordinates);
    

    // Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, skyBoxModels.nzPlane.buffers.vertex);
    ctx.vertexAttribPointer(cloudShader.attributes.viewportVertexPosition, 3, ctx.FLOAT, false, 0, 0);
    ctx.enableVertexAttribArray(cloudShader.attributes.viewportVertexPosition);

    // Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, skyBoxModels.nzPlane.buffers.elementIndices);

    // Draw triangles
    ctx.drawElements(ctx.TRIANGLES, skyBoxModels.nzPlane.elementCount, ctx.UNSIGNED_SHORT, 0);
}

/**
 * Function: updateMouse
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: Updates lastMousePosition, and uses the change in mouse position to
 *              update the direction that the player is facing by calling pithcUp
 *              and yawRight
 */
 function updateMouse(event) {

    //If the mouse is not in the window, record coordinates, set that it is in window, and return
    if (!lastMousePosition.inWindow) {
     
        lastMousePosition.x = event.offsetX; //record x
        lastMousePosition.y = event.offsetY; //record y
        lastMousePosition.inWindow = true; //Set that mouse is in window

        return;
	}

    //Record change in x and y
    let deltaX = event.offsetX - lastMousePosition.x;
    let deltaY = event.offsetY - lastMousePosition.y;

    //Update mouse position
    lastMousePosition.x = event.offsetX;
    lastMousePosition.y = event.offsetY;

    //console.log("deltaX: " + deltaX + " deltaY: " + deltaY);

    //Yaw and pitch based on change in x and y
    pitchUp(deltaY * -0.01);
    yawRight(deltaX * -0.01);
}

/**
 * Function: mouseLeave
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: Sets lastMousePosition to false. This function should be called
 *              in the event the mouse leaves the window.
 */
function mouseLeave(event) {

    lastMousePosition.inWindow = false;
}

/**
 * Function: pitchUp
 * 
 * Input: Double angle
 * Output: None
 * 
 * Description: Pitches the player's view around it's local x vector by the given angle
 */
//Function to pitch the player's view around it's local x vector
function pitchUp(angle) {

    // Update player's view pitchAngle
    player.pitchAngle += angle;

    if (player.pitchAngle > piOver2)
    {
        player.pitchAngle = piOver2;
    }

    if (player.pitchAngle < piOver2 * -1.0)
    {
        player.pitchAngle = piOver2 * -1.0;
    }
}

/**
 * Function: yawRight
 * 
 * Input: Double angle
 * Output: None
 * 
 * Description: Rotates the player around it's local y vector by the given angle
 */
//Function to yaw the player around it's local y vector
function yawRight(angle) {

    // Update player yawAngle
    player.yawAngle += angle
    
    // Reset player rightVec and forwardVec
    vec3.set(player.rightVec, 1.0, 0.0, 0.0);
    vec3.set(player.forwardVec, 0.0, 0.0, -1.0);

    // Rotate rightVec and forwardVec based on new yawAngle
    vec3.rotateY(player.rightVec, player.rightVec, VEC3_ZERO, player.yawAngle);
    vec3.rotateY(player.forwardVec, player.forwardVec, VEC3_ZERO, player.yawAngle);
    
}

/**
 * Function: hexToColor
 * 
 * Input: String hex, vec3 colorVec
 * Output: None
 * 
 * Description: Converts hex value (as returned by color input for instance)
 * and converts it to decimal RGB values, between 0.0 and 1.0, and places the
 * resulting values into colorVec attribute
 */
function hexToColor(hex, colorVec) {

    let charIndex = 1; // Skip first character [0] which is just '#'
    let rgbIndex = 0;

    for ( ; rgbIndex < 3; rgbIndex++)
    {
        let value = 0.0;
        
        for (let i=0; i < 2; i++)
        {
            value *= 16.0;

            switch (hex.charAt(charIndex))
            {
                case '0':
                    value += 0.0;
                    break;
                case '1':
                    value += 1.0;
                    break;
                case '2':
                    value += 2.0;
                    break;
                case '3':
                    value += 3.0;
                    break;
                case '4':
                    value += 4.0;
                    break;
                case '5':
                    value += 5.0;
                    break;
                case '6':
                    value += 6.0;
                    break;
                case '7':
                    value += 7.0;
                    break;
                case '8':
                    value += 8.0;
                    break;
                case '9':
                    value += 9.0;
                    break;
                case 'a':
                    value += 10.0;
                    break;
                case 'b':
                    value += 11.0;
                    break;
                case 'c':
                    value += 12.0;
                    break;
                case 'd':
                    value += 13.0;
                    break;
                case 'e':
                    value += 14.0;
                    break;
                case 'f':
                    value += 15.0;
                    break;
                default:
                    value += 0.0;
            }

            charIndex++;
        }

        // Clamp between 0.0 and 256.0
        if (value < 0.0) value = 0.0;
        if (value > 256.0) value = 256.0;

        // Convert to between 0.0 and 1.0
        value /= 256.0;

        colorVec[rgbIndex] = value;
    }
}

function inputChangeHandler(event)
{
    //console.clear();
    fetchSettings();
    requestNewSkybox();
}

function resetNoiseHandler(event)
{
    //console.clear();
    loadNewNoise();
    fetchSettings();
    requestNewSkybox();
}

function switchDisplayStage(event)
{
    displayStage = Number(displayStageInput.value);
    console.log("Displaying lighting stage: " + displayStage);
}

function fetchLightningMixture(event)
{
    lightning1Mixture = Number(lightning1MixtureInput.value);
    console.log("Lightning 1 mixture: " + lightning1Mixture);
}

/**
 * Function: fetchSettings
 * 
 * Input: None
 * Output: None
 * 
 * Description: Fetches the values of all input tags and puts them in to
 * their respective variable locations, to be passed to the shader
 */
function fetchSettings()
{
    // tmin densityfalloff tmax and step size
    stepSettings[0] = Number(tminInput.value);
    stepSettings[1] = Number(densityFalloffInput.value);
    stepSettings[2] = Number(tmaxInput.value);
    stepSettings[3] = Number(stepSizeInput.value);
    console.log("Step Settings:");
    console.log(stepSettings);

    // colors
    hexToColor(skyColorInput.value, skyColor);
    hexToColor(darkColorInput.value, darkColor);
    hexToColor(lightColorInput.value, lightColor);
    hexToColor(sunColorInput.value, sunColor);
    console.log("Color Settings:");
    console.log(skyColor);
    console.log(darkColor);
    console.log(lightColor);
    console.log(sunColor);

    // Sun intensity
    sunIntensity = Number(sunIntensityInput.value);
    console.log("Sun Intensity Factor:");
    console.log(sunIntensity);

    // Sun direction
    sunDir[0] = Number(sunXInput.value);
    sunDir[1] = Number(sunYInput.value);
    sunDir[2] = Number(sunZInput.value);
    console.log("Sun Direction:");
    console.log(sunDir);

    // sun tmax and step size
    sunStepSettings[0] = Number(tsunMaxInput.value);
    sunStepSettings[1] = Number(sunStepSizeInput.value);
    console.log("Sun Step Settings:");
    console.log(sunStepSettings);

    // light absorption
    lightAbsorption = Number(lightAbsorptionInput.value);
    console.log("Light Absorption Factor:");
    console.log(lightAbsorption);

    // fog
    fog = Number(fogInput.value);
    console.log("Fog:");
    console.log(fog);

    // Noise input settings
    noiseInputSettings[0] = Number(noiseXInput.value);
    noiseInputSettings[1] = Number(noiseYInput.value);
    noiseInputSettings[2] = Number(noiseZInput.value);
    noiseInputSettings[3] = Number(noiseScaleInput.value);
    console.log("Noise Input Settings:");
    console.log(noiseInputSettings);
    
    // Noise output settings
    noiseOutputSettings[0] = Number(noiseSlopeInput.value);
    noiseOutputSettings[1] = Number(noiseOffsetInput.value);
    console.log("Noise Output Settings:");
    console.log(noiseOutputSettings);

    /*let lightning1ColorInput = null;
    let lightning1XInput = null;
    let lightning1YInput = null;
    let lightning1ZInput = null;
    let lightning1Falloff = null;
    let lightning1End = null;*/

    // Lightning 1 settings
    hexToColor(lightning1ColorInput.value, lightningSettings[0].color);
    console.log("Lightning 1 color:");
    console.log(lightningSettings[0].color);
    lightningSettings[0].source[0] = Number(lightning1XInput.value);
    lightningSettings[0].source[1] = Number(lightning1YInput.value);
    lightningSettings[0].source[2] = Number(lightning1ZInput.value);
    console.log("Lightning 1 Source:");
    console.log(lightningSettings[0].source);
    lightningSettings[0].fallEnd[0] = Number(lightning1Falloff.value);
    console.log("Lightning 1 Falloff Start:");
    console.log(lightningSettings[0].fallEnd[0]);
    lightningSettings[0].fallEnd[1] = Number(lightning1End.value);
    console.log("Lightning 1 End:");
    console.log(lightningSettings[0].fallEnd[1]);
}

window.onload = main;