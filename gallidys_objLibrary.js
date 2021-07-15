/**
 *               Filename: gallidys_objLibrary.js
 * 
 *                 Author: Browning Keith Smith
 *           Date Created: April 24, 2020
 *          Date Modified: July , 2020
 * 
 *            Description: Gallidys is an open world MMO war game, where you aid your faction in attempting to
 *                         conquer the alien world of Gallidys. The game blends aspects of RTS and FPS for a truly
 *                         unique gaming experience. Command your troops from the air, or join them on the ground!
 *
 *                         This file specifically contains global variables, and object definitions that gallidys.js depends on
 * 
 * Execution Requirements: Google Chrome. Program not currently supported in other browsers.
 *                         Browser must support HTML5 <canvas> element and WebGL context.
 * 
 *                         HTML file must include 2 instances of the <canvas> element, one with the id "canvas",
 *                         and one with the id "hud"
 * 
 *           Dependencies: gl-matrix.js https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js
 * 
 * Copyright (c) 2020, Browning Keith Smith. All rights reserved.
 */

 //Vertex Shader source code

const vertexShaderCode = `

    attribute vec4 a_vertexPosition;
    attribute vec3 a_vertexNormal;
    attribute vec4 a_vertexColor;
    
    uniform mat4 u_projectionMatrix;
    uniform mat4 u_modelViewMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_worldViewMatrix;

    varying lowp vec4 v_currentColor;
    varying highp vec3 v_currentLighting;

    void main(void) {

        gl_Position = u_projectionMatrix * u_worldViewMatrix * u_modelViewMatrix * a_vertexPosition; //Compute vertex position based on model, worldview, and projection
        v_currentColor = a_vertexColor; //Color to be passed to fragment shader
        
        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3); //Set ambientLight to 0.3 rgb
        highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0); //Set directional light color to white

        highp vec3 lightDirection = normalize(vec3(0.5, 1.0, 1.0)); //Set light direction vector

        highp vec4 transformedNormal = u_normalMatrix * vec4(a_vertexNormal, 1.0); //Compute new normals based on object rotation

        highp float directional = max(dot(transformedNormal.xyz, lightDirection),0.0); //Compute directional based on transformed normal and direction of light

        v_currentLighting = ambientLight + (directionalLightColor * directional); //Compute lighting of current vertex as ambient light plus directional light times the directional
    }
`;

//Fragment Shader source code

const fragmentShaderCode = `

    varying lowp vec4 v_currentColor;
    varying lowp vec3 v_currentLighting;

    void main(void) {

        gl_FragColor = vec4(v_currentColor.rgb * v_currentLighting, 1.0); //Each fragment is the color multiplied by the light level
    }
`;

//View Matrices
const modelViewMatrix = mat4.create();
const worldViewMatrix = mat4.create();
const normalMatrix = mat4.create();

//Projection matrix
const projectionMatrix = mat4.create();

//Void color
var voidColor = [102.0 / 256.0, 204.0 / 256.0, 255.0 / 256.0]; //sky blue

//Ground Color
var groundColor = [227.0 / 256.0, 208.0 / 256.0, 141.0 / 256.0]; //Tan

//Chunk dimensions
const chunkLength = 255.0; //With the way model is rendering currently, this is the maximum
const chunkWidth = 255.0; //With the way model is rendering currently, this is the maximum

//Terrain definition
const terrainDefinition = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];

//Allocate vectors to be used in rendering terrain normals
const northVec = vec3.create();
const eastVec = vec3.create();
const southVec = vec3.create();
const westVec = vec3.create();
const neVec = vec3.create();
const seVec = vec3.create();
const swVec = vec3.create();
const nwVec = vec3.create();
const finalNormal = vec3.create();

/**
 * Object: keys
 * 
 * Description: A collection of key objects, to be used when
 *              interpreting user input
 */

const keys = {

    /**
     * Object: key
     * 
     * Description: An object representing a key on the keyboard
     * 
     * Attributes: String code, boolean down
     */

    W: {

        code: "KeyW",
        down: false,
    },
    S: {

        code: "KeyS",
        down: false,
    },
    A: {

        code: "KeyA",
        down: false,
    },
    D: {

        code: "KeyD",
        down: false,
    },
    Q: {

        code: "KeyQ",
        down: false,
    },
    E: {

        code: "KeyE",
        down: false,
    },
    Space: {

        code: "Space",
        down: false,
    },
    ShiftLeft: {

        code: "ShiftLeft",
        down: false,
    },
};

/**
 * Object: models
 * 
 * Description: A collection of model objects
 */

var models = {

    /**
     * Object: model
     * 
     * Description: A collection of data representing a 3D model
     *              Contains data about the model's vertex locations,
     *              normal values of vertices, color values of vertices,
     *              and total count of vertices.
     * 
     * Attributes: Float32Array vertexValues,
     *             Float32Array normalValues,
     *             Float32Array colorValues,
     *             Integer vertexCount
     */

    cube: {

        vertexValues: [

            // Front face
            -1.0,  1.0, 1.0,
             1.0,  1.0, 1.0,
             1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Back face
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0,

            // Left face
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,

            // Right face
            1.0,  1.0,  1.0,
            1.0,  1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0,  1.0,

            // Top face
            -1.0, 1.0,  1.0,
             1.0, 1.0,  1.0,
             1.0, 1.0, -1.0,
            -1.0, 1.0, -1.0,

            // bottom face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0,

        ],

        normalValues: [

            // Front
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,

            // Back
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,

            // left
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,

            // right
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            // Bottom
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
        ],

        colorValues: [

            //Front white
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,

            //Back red
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,

            //Left green
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,

            //Right blue
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,

            //Top purple
            1.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 1.0, 1.0,

            //Bottom yellow
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,

        ],

        drawPointIndices: [
        
            //Front
            2, 1, 0,
            3, 2, 0,

            //Back
            4, 5, 6,
            4, 6, 7,

            //Left
            8, 9, 10,
            8, 10, 11,

            //right
            14, 13, 12,
            15, 14, 12,

            //Top
            16, 17, 18,
            16, 18, 19,

            //Bottom
            22, 21, 20,
            23, 22, 20,
		],

        drawPointCount: 36,
    },
};

/**
 * Object: objects
 * 
 * Description: a collection of 3D objects for the program to render
 */

var objects = {

    /**
     * Object: object
     * 
     * Description: A 3D object for the program to render, not to be confused with a JavaScript "Object"
     * 
     * Attributes: Double x, y, z
     *             Double roll, pitch, yaw,
     *             Double scale,
     *             model model
     */

    cube1: {
    
        x: 0.0,
        y: 6.0,
        z: -6.0,

        roll: 0.0,
        pitch: 0.9,
        yaw: 0.3,

        scale: 1.0,

        model: models.cube,
    },

    cube2: {
    
        x: 0.0,
        y: 3.0,
        z: -12.0,

        roll: 0.0,
        pitch: 0.0,
        yaw: 0.0,

        scale: 1.0,

        model: models.cube,
    },

    cube3: {
    
        x: 0.0,
        y: 6.0,
        z: -18.0,

        roll: 0.0,
        pitch: 0.0,
        yaw: 0.0,

        scale: 1.0,

        model: models.cube,
    },

    cube4: {
    
        x: 0.0,
        y: 6.0,
        z: -24.0,

        roll: 0.0,
        pitch: 0.0,
        yaw: 0.0,

        scale: 1.0,

        model: models.cube,
    },
};

/**
 * Object: chunks
 * 
 * Description: a collection of voxel chunks
 */
 var chunks = {
 
    cx0z0: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: 0.0,
        z: 0.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn1zn1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -1.0,
        z: chunkLength * -1.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx0zn1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: 0.0,
        z: chunkLength * -1.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx1zn1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth,
        z: chunkLength * -1.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn1z0: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -1.0,
        z: 0.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx1z0: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth,
        z: 0.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn1z1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -1.0,
        z: chunkLength,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx0z1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: 0.0,
        z: chunkLength,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx1z1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth,
        z: chunkLength,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn2zn2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -2.0,
        z: chunkLength * -2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn1zn2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -1.0,
        z: chunkLength * -2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx0zn2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: 0.0,
        z: chunkLength * -2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx1zn2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth,
        z: chunkLength * -2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx2zn2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * 2.0,
        z: chunkLength * -2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn2zn1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -2.0,
        z: chunkLength * -1.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx2zn1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * 2.0,
        z: chunkLength * -1.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn2z0: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -2.0,
        z: 0.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx2z0: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * 2.0,
        z: 0.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn2z1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -2.0,
        z: chunkLength,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx2z1: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * 2.0,
        z: chunkLength,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn2z2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -2.0,
        z: chunkLength * 2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cxn1z2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * -1.0,
        z: chunkLength * 2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx0z2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: 0.0,
        z: chunkLength * 2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx1z2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth,
        z: chunkLength * 2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },

    cx2z2: {
    
        //Coordinates of southwest-most vertex of this chunk
        x: chunkWidth * 2.0,
        z: chunkLength * 2.0,

        voxelHeights: [],
        voxelNormals: [],
        voxelColors: [],

        status: 0,

        model: {
        
            drawPointCount: 0,
        },
    },
 };

/**
 * Object: camera
 * 
 * Description: Contains data on camera position and angle. Is a representation
 *              of the user's first-person location and perspective.
 * 
 * Attributes: Double x, y, z,
 *             vec3 rightVec, upVec, forwardVec,
 *             mat4 rotationMatrix,
 *             Double speed, rightSpeed, upSpeed, forwardSpeed, rollSpeed
 */
var camera = {

    x: 0.0, //Camera initialized 6 units above origin
    y: 6.0,
    z: 0.0,

    lastx: 0.0,
    lastz: chunkLength * 1.0 + 1.0, //Set the last z to be at least a chunk behind

    //Normal vectors representing right, left, and forward for the camera.
    //Camera is initialized facing negative Z
    rightVec: vec3.fromValues(1.0, 0.0, 0.0),
    upVec: vec3.fromValues(0.0, 1.0, 0.0),
    forwardVec: vec3.fromValues(0.0, 0.0, -1.0),

    //Camera rotation matrix, needs to be recomputed on each roll, pitch, or yaw update
    rotationMatrix: mat4.create(),

    speed: 50.0,

    rightSpeed: 0.0,
    upSpeed: 0.0,
    forwardSpeed: 0.0,
    rollSpeed: 0.0,
};

/**
 * Object: lastMousePosition
 * 
 * Description: contains data on last mouse position relative to the canvas
 * 
 * Attributes: Boolean inWindow,
 *             Double x, y,
 * 
 */
var lastMousePosition = {

    inWindow: false,
    x: 0,
    y: 0,
};