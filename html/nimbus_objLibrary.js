/**
 *               Filename: nimbus_objLibrary.js
 * 
 *                 Author: Browning Keith Smith
 *           Date Created: July 14, 2021
 *          Date Modified: July 14, 2021
 * 
 *            Description: 
 * 
 * Execution Requirements: Google Chrome. Program not currently supported in other browsers.
 *                         Browser must support HTML5 <canvas> element and WebGL context.
 * 
 *                         HTML file must include 2 instances of the <canvas> element, one with the id "canvas",
 *                         and one with the id "hud"
 * 
 *           Dependencies: gl-matrix.js https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js
 * 
 * Copyright (c) 2021, Browning Keith Smith. All rights reserved.
 */

//View Matrices
const modelViewMatrix = mat4.create();
const worldViewMatrix = mat4.create();
const normalMatrix = mat4.create();

//Projection matrix
const projectionMatrix = mat4.create();

//Void color
//let voidColor = [128.0 / 256.0, 223.0 / 256.0, 224.0 / 256.0]; //sky blue
let voidColor = [0.0 / 256.0, 0.0 / 256.0, 0.0 / 256.0]; //dark purple

//Chunk dimensions
const chunkLength = 255.0; //With the way model is rendering currently, this is the maximum
const chunkWidth = 255.0; //With the way model is rendering currently, this is the maximum

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
 * Object: objects
 * 
 * Description: a collection of 3D objects for the program to render
 */

let interiorObjects = [

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
    
    {
    
        x: 0.0,
        y: 0.0,
        z: 0.0,

        roll: 0.0,
        pitch: 0.0,
        yaw: 0.0,

        rollSpeed: 0.0,
        pitchSpeed: 0.0,
        yawSpeed: 0.0,

        scale: 1.0,

        model: models.shipInterior,
    },
]

let exteriorObjects = [

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
];

/**
 * Object: camera
 * 
 * Description: Contains data on camera position and angle. Is a representation
 *              of the user's first-person location and perspective.
 * 
 * Attributes: Double x, y, z,
 *             vec3 rightVec, upVec, forwardVec,
 *             mat4 rotationMatrix,
 *             Double speed, rightSpeed, upSpeed, forwardSpeed
 */
let camera = {

    x: 0.0, //Camera initialized 6 units above origin
    y: 0.0,
    z: 0.0,

    lastx: 0.0,
    lastz: 0.0,

    yawAngle: 0.0, // Angle of rotation around y axis
    pitchAngle: 0.0, // Angle of rotation around x axis

    //Normal vectors representing right, left, and forward for the camera.
    //Camera is initialized facing negative Z
    rightVec: vec3.fromValues(1.0, 0.0, 0.0),
    forwardVec: vec3.fromValues(0.0, 0.0, -1.0),

    speed: 3.0,

    rightSpeed: 0.0,
    upSpeed: 0.0,
    forwardSpeed: 0.0,
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
let lastMousePosition = {

    inWindow: false,
    x: 0,
    y: 0,
};