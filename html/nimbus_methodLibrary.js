/**
 *               Filename: nimbus_methodLibrary.js
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

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(textureData)
{
    /*function isPowerOf2(value)
    {
        return (value & (value - 1)) == 0;
    }*/
    
    let texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, texture);
  
    // Load a single pixel as texture until full texture loads
    const level = 0;
    const internalFormat = ctx.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = ctx.RGBA;
    const srcType = ctx.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    ctx.texImage2D(ctx.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);

    
  
    const image = new Image();
    image.onload = function() {
        ctx.bindTexture(ctx.TEXTURE_2D, texture);
        ctx.texImage2D(ctx.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
        
        
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
        
    };
    image.crossOrigin = "";
    image.src = textureData.url;
  
    textureData.texture = texture;
}

/**
 * Function: initBuffers
 * 
 * Input: WebGLRenderingContext ctx, model model,
 * Output: Collection of WebGLRenderingContext buffer data
 * 
 * Description: This function takes the given model, and creates buffers for them
 *              and places the appropriate data in these buffers. It creates a buffer
 *              for vertex position data, a buffer for vertex normals, a buffer for
 *              vertex colors, and a buffer for vertex indices.
 */
function initBuffers(model) {

    //Create pointer to a new buffer
    let vertexBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);

    //Pass in the vertex data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(model.vertexValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    let colorBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, colorBuffer);

    //Pass in color data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(model.colorValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    let normalBuffer = ctx.createBuffer();

    //Bind the buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, normalBuffer);

    //Pass in normals data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(model.normalValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    let drawPointBuffer = ctx.createBuffer();

    //Bind the buffer to element buffer
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, drawPointBuffer);

    //Pass in element index data
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.drawPointIndices), ctx.STATIC_DRAW);

    model.buffers = {

        vertex: vertexBuffer,
        color: colorBuffer,
        normal: normalBuffer,
        drawPoint: drawPointBuffer,
    };
}

/**
 * Function: initSkyBoxBuffers
 * 
 * Input: WebGLRenderingContext ctx, model model,
 * Output: Collection of WebGLRenderingContext buffer data
 * 
 * Description: This function takes the given model, and creates buffers for them
 *              and places the appropriate data in these buffers. It creates a buffer
 *              for vertex position data, a buffer for vertex normals, a buffer for
 *              vertex colors, and a buffer for vertex indices.
 */
 function initSkyBoxBuffers(model) {

    //Create pointer to a new buffer
    let vertexBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);

    //Pass in the vertex data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(model.vertexValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    let uvBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, uvBuffer);

    //Pass in the uv data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(model.uvValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    let drawPointBuffer = ctx.createBuffer();

    //Bind the buffer to element buffer
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, drawPointBuffer);

    //Pass in element index data
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.drawPointIndices), ctx.STATIC_DRAW);

    model.buffers = {

        vertex: vertexBuffer,
        uv: uvBuffer,
        drawPoint: drawPointBuffer,
    };
}

/**
 * Function: drawHUD
 * 
 * Input: CanvasRenderingContext2D hudCtx
 * Output: None
 * 
 * Description: Clears the canvas, then draws a horizontal and vertical white line on the 
 *              2D hud canvas at the center of the screen
 */
function drawHUD() {

    hudCtx.canvas.width = hudCtx.canvas.clientWidth;   //Resize canvas to fit CSS styling
    hudCtx.canvas.height = hudCtx.canvas.clientHeight;

    hudCtx.clearRect(0, 0, hudCtx.canvas.width, hudCtx.canvas.height); //Clear canvas

    //Create horizontal line
    hudCtx.beginPath();
    hudCtx.moveTo(hudCtx.canvas.width / 2 - 25, hudCtx.canvas.height / 2);
    hudCtx.lineTo(hudCtx.canvas.width / 2 + 25, hudCtx.canvas.height / 2);

    //Create vertical line
    hudCtx.moveTo(hudCtx.canvas.width / 2, hudCtx.canvas.height / 2 - 25);
    hudCtx.lineTo(hudCtx.canvas.width / 2, hudCtx.canvas.height / 2 + 25);

    //Draw the lines, white
    hudCtx.strokeStyle = 'white';
    hudCtx.stroke();
}

/**
 * Function: drawScene
 * 
 * Input: WebGLRenderingContext ctx, shaderProgramData, Double deltaT
 * Output: None
 * 
 * Description: Handles a variety of functionality on rendering the 3D scene
 *              First, resets the canvas size and drawing area to match window size,
 *              Next clears the canvas with fully opaque black, and clears the depth buffer.
 *              Enables depth testing and obscuring farther away objects
 *              Computes a new FOV based on the new window size
 */
function drawScene() {

    ctx.canvas.width = ctx.canvas.clientWidth;   //Resize canvas to fit CSS styling
    ctx.canvas.height = ctx.canvas.clientHeight;

    ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height); //Resize viewport

    //Clear the canvas
    ctx.clearColor(voidColor[0], voidColor[1], voidColor[2], 1.0); //set clear color to voidColor
    ctx.clearDepth(1.0); //set clear depth to 1.0
    ctx.clear(ctx.COLOR_BUFFER_BIT, ctx.DEPTH_BUFFER_BIT);

    //Enable depth testing and have it obscure objects further back
    ctx.enable(ctx.DEPTH_TEST);
    ctx.depthFunc(ctx.LEQUAL);

    //Enable backface culling
    ctx.enable(ctx.CULL_FACE);
    ctx.cullFace(ctx.BACK);

    //Compute projection matrix based on new window size
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, ctx.canvas.width / ctx.canvas.height, 0.1, 1000.0);

    //Compute worldViewMatrix based on opposite coordinates of player position and player rotation
    mat4.identity(worldViewMatrix);
    mat4.rotate(worldViewMatrix, worldViewMatrix, player.pitchAngle * -1.0, XAXIS); // Third transform, rotate whole world around x axis (in the opposite direction the player is facing)
    mat4.rotate(worldViewMatrix, worldViewMatrix, player.yawAngle * -1.0, YAXIS); //Second transform, rotate whole world around y axis (in the opposite direction the player is facing)
    vec3.set(translation, player.x * -1.0, player.y * -1.0, player.z * -1.0);
    mat4.translate(worldViewMatrix, worldViewMatrix, translation); //First transform, move whole world away from player

    // Render the skybox
    for (panel in skyBoxModels)
    {
        drawSkyBoxPanel(skyBoxModels[panel]);
    }

    ctx.clear(ctx.DEPTH_BUFFER_BIT);

    //Render all exterior objects
    for (object in exteriorObjects) {

        drawExteriorObject(exteriorObjects[object]);
    }

    ctx.clear(ctx.DEPTH_BUFFER_BIT);

    //Render all interior objects
    for (object in interiorObjects) {

        drawInteriorObject(interiorObjects[object]);
    }
}

/**
 * Function: drawSkyboxPanel
 * 
 * Input: WebGLRenderingContext ctx, Object panel
 * Output: None
 * 
 * Description: Handles drawing a specific object in the frame
 */

 function drawSkyBoxPanel(panel) {
 
    //Tell WebGL to use the shader program
    ctx.useProgram(skyBoxShader.program);

    // Compute skyBoxRotationMatrix
    mat4.identity(skyBoxRotationMatrix);
    mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, player.pitchAngle * -1.0, XAXIS); // Third transform, rotate whole world around x axis (in the opposite direction the player is facing)
    mat4.rotate(skyBoxRotationMatrix, skyBoxRotationMatrix, player.yawAngle * -1.0, YAXIS); //Second transform, rotate whole world around y axis (in the opposite direction the player is facing)
    
    //Set worldview and projection uniforms
    ctx.uniformMatrix4fv(skyBoxShader.uniforms.projectionMatrix, false, projectionMatrix);
    ctx.uniformMatrix4fv(skyBoxShader.uniforms.worldViewMatrix, false, skyBoxRotationMatrix);

    //Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, panel.buffers.vertex);
    ctx.vertexAttribPointer(skyBoxShader.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(skyBoxShader.attributes.vertexPosition); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out texture coordinates
    ctx.bindBuffer(ctx.ARRAY_BUFFER, panel.buffers.uv);
    ctx.vertexAttribPointer(skyBoxShader.attributes.textureCoordinates, 2, ctx.FLOAT, false, 0, 0);
    ctx.enableVertexAttribArray(skyBoxShader.attributes.textureCoordinates);

    //Instruct WebGL on which texture to use
    ctx.activeTexture(ctx.TEXTURE0);
    ctx.bindTexture(ctx.TEXTURE_2D, panel.texture);
    ctx.uniform1i(skyBoxShader.uniforms.uSampler, 0);

    //Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, panel.buffers.drawPoint);

    //Draw triangles
    ctx.drawElements(ctx.TRIANGLES, panel.drawPointCount, ctx.UNSIGNED_SHORT, 0);
 }

/**
 * Function: drawObject
 * 
 * Input: WebGLRenderingContext ctx, shaderProgramData, Object object
 * Output: None
 * 
 * Description: Handles drawing a specific object in the frame
 */

 function drawExteriorObject(object) {
 
    //Tell WebGL to use the shader program
    ctx.useProgram(shipExteriorShader.program);
    
    //Set worldview and projection uniforms
    ctx.uniformMatrix4fv(shipExteriorShader.uniforms.projectionMatrix, false, projectionMatrix);
    ctx.uniformMatrix4fv(shipExteriorShader.uniforms.worldViewMatrix, false, worldViewMatrix);
    
    //Compute new model view matrix
    mat4.identity(modelViewMatrix);

    vec3.set(translation, object.x, object.y, object.z);
    mat4.translate(modelViewMatrix, modelViewMatrix, translation);  //Fifth transform: move back from origin based on position
    mat4.rotate(modelViewMatrix, modelViewMatrix, object.pitch, XAXIS); //Fourth transform: rotate around x based on object pitch
    mat4.rotate(modelViewMatrix, modelViewMatrix, object.yaw, YAXIS);   //Third transform: rotate around y based on object yaw
    mat4.rotate(modelViewMatrix, modelViewMatrix, object.roll, ZAXIS);  //Second transform: rotate around z based on object roll

    //Compute new normals matrix
    //Do it before the scaling is applied, because otherwise the lighting doesn't work for some reason, not sure why yet :/
    mat4.identity(normalMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    vec3.set(scaling, object.scale, object.scale, object.scale);
    mat4.scale(modelViewMatrix, modelViewMatrix, scaling); //First transform: scale object based on object scale

    //Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, object.model.buffers.vertex);
    ctx.vertexAttribPointer(shipExteriorShader.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shipExteriorShader.attributes.vertexPosition); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out colors
    ctx.bindBuffer(ctx.ARRAY_BUFFER, object.model.buffers.color);
    ctx.vertexAttribPointer(shipExteriorShader.attributes.vertexColor, 4, ctx.FLOAT, false, 0, 0); //Pull out 4 values at a time, no offsets
    ctx.enableVertexAttribArray(shipExteriorShader.attributes.vertexColor); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out normals
    ctx.bindBuffer(ctx.ARRAY_BUFFER, object.model.buffers.normal);
    ctx.vertexAttribPointer(shipExteriorShader.attributes.vertexNormal, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shipExteriorShader.attributes.vertexNormal); //Enable the pointer to the buffer

    //Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, object.model.buffers.drawPoint);

    //Set the uniforms
    ctx.uniformMatrix4fv(shipExteriorShader.uniforms.modelViewMatrix, false, modelViewMatrix);
    ctx.uniformMatrix4fv(shipExteriorShader.uniforms.normalMatrix, false, normalMatrix);

    //Draw triangles
    ctx.drawElements(ctx.TRIANGLES, object.model.drawPointCount, ctx.UNSIGNED_SHORT, 0);
 }

 function drawInteriorObject(object) {
 
    //Tell WebGL to use the shader program
    ctx.useProgram(shipInteriorShader.program);
    
    //Set worldview and projection uniforms
    ctx.uniformMatrix4fv(shipInteriorShader.uniforms.projectionMatrix, false, projectionMatrix);
    ctx.uniformMatrix4fv(shipInteriorShader.uniforms.worldViewMatrix, false, worldViewMatrix);
    
    //Compute new model view matrix
    mat4.identity(modelViewMatrix);

    vec3.set(translation, object.x, object.y, object.z);
    mat4.translate(modelViewMatrix, modelViewMatrix, translation);  //Fifth transform: move back from origin based on position
    mat4.rotate(modelViewMatrix, modelViewMatrix, object.pitch, XAXIS); //Fourth transform: rotate around x based on object pitch
    mat4.rotate(modelViewMatrix, modelViewMatrix, object.yaw, YAXIS);   //Third transform: rotate around y based on object yaw
    mat4.rotate(modelViewMatrix, modelViewMatrix, object.roll, ZAXIS);  //Second transform: rotate around z based on object roll

    //Compute new normals matrix
    //Do it before the scaling is applied, because otherwise the lighting doesn't work for some reason, not sure why yet :/
    mat4.identity(normalMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    vec3.set(scaling, object.scale, object.scale, object.scale);
    mat4.scale(modelViewMatrix, modelViewMatrix, scaling); //First transform: scale object based on object scale

    //Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, object.model.buffers.vertex);
    ctx.vertexAttribPointer(shipInteriorShader.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shipInteriorShader.attributes.vertexPosition); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out colors
    ctx.bindBuffer(ctx.ARRAY_BUFFER, object.model.buffers.color);
    ctx.vertexAttribPointer(shipInteriorShader.attributes.vertexColor, 4, ctx.FLOAT, false, 0, 0); //Pull out 4 values at a time, no offsets
    ctx.enableVertexAttribArray(shipInteriorShader.attributes.vertexColor); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out normals
    ctx.bindBuffer(ctx.ARRAY_BUFFER, object.model.buffers.normal);
    ctx.vertexAttribPointer(shipInteriorShader.attributes.vertexNormal, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shipInteriorShader.attributes.vertexNormal); //Enable the pointer to the buffer

    //Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, object.model.buffers.drawPoint);

    //Set the uniforms
    ctx.uniformMatrix4fv(shipInteriorShader.uniforms.modelViewMatrix, false, modelViewMatrix);
    ctx.uniformMatrix4fv(shipInteriorShader.uniforms.normalMatrix, false, normalMatrix);

    //Draw triangles
    ctx.drawElements(ctx.TRIANGLES, object.model.drawPointCount, ctx.UNSIGNED_SHORT, 0);
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
 * Function: parseDownKey
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: This function parses which key triggered the event,
 *              and whether the key had already been pressed. If the
 *              key was not already pressed, it sets that key to pressed,
 *              then calls updatePlayerSpeed to update the speed and
 *              direction in which the player is moving.
 */
function parseDownKey(event) {

    let code = event.code;  //Edge does not recognize this apparently

    //console.log("Key Down: " + code);

    //Find which key was pressed down
    for (key in keys) {

        //If the code of the key pressed matches
        if (code == keys[key].code) {

            //If key was not already down
            if (!(keys[key].down)) {

                //Update that key is down
                keys[key].down = true;

                //Update player speeds
                updatePlayerSpeed();
            }
            else {

                return;
            }
        } 
    }
}

/**
 * Function: parseUpKey
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: This function parses which key triggered the up event,
 *              and whether the key had already been let go. If the
 *              key was not already let go, it sets that key to not pressed,
 *              then calls updatePlayerSpeed to update the speed and
 *              direction in which the player is moving.
 */
function parseUpKey(event) {

    let code = event.code; //Edge does not recognize this apparently

    //console.log("Key Up: " + code);

    //Find which key was released
    for (key in keys) {

        //If the code of the key released matches
        if (code == keys[key].code) {

            //If key was already down
            if (keys[key].down) {

                //Update that key is up
                keys[key].down = false;

                //Update player speeds
                updatePlayerSpeed();
            }
            else {

                return;
            }
        } 
    }
}

/**
 * Function: updatePlayerSpeed
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: This function takes a look at the state of pressed keys, and
 *              sets the speed of the player based on that.
 */
function updatePlayerSpeed() {

    //If both W and S are down, or if neither of them are down
    if ((keys.W.down && keys.S.down) || !(keys.W.down || keys.S.down)) {

        //Set forward speed to 0.0
        player.forwardSpeed = 0.0;

        //console.log("Player forward speed set to " + player.forwardSpeed);
    }
    else {

        //If W is the key that is down
        if (keys.W.down) {

            //Set forward speed to player.speed
            player.forwardSpeed = player.speed;

            //console.log("Player forward speed set to " + player.forwardSpeed);
        }
        else {

            //Set forward speed to reverse player.speed
            player.forwardSpeed = player.speed * -1.0;

            //console.log("Player forward speed set to " + player.forwardSpeed);
        }
    }

    //If both A and D are down, or if neither of them are down
    if ((keys.A.down && keys.D.down) || !(keys.A.down || keys.D.down)) {

        //Set right speed to 0.0
        player.rightSpeed = 0.0;

        //console.log("Player right speed set to " + player.rightSpeed);
    }
    else {

        //If A is the key that is down
        if (keys.A.down) {

            //Set right speed to reverse player.speed
            player.rightSpeed = player.speed * -1.0;

            //console.log("Player right speed set to " + player.rightSpeed);
        }
        else {

            //Set right speed to player.speed
            player.rightSpeed = player.speed;

            //console.log("Player right speed set to " + player.rightSpeed);
        }
    }

    //If both Space and ShiftLeft are down, or if neither of them are down
    if ((keys.Space.down && keys.ShiftLeft.down) || !(keys.Space.down || keys.ShiftLeft.down)) {

        //Set up speed to 0.0
        player.upSpeed = 0.0;

        //console.log("Player up speed set to " + player.upSpeed);
    }
    else {

        //If A is the key that is down
        if (keys.Space.down) {

            //Set up speed to player.speed
            player.upSpeed = player.speed;

            //console.log("Player up speed set to " + player.upSpeed);
        }
        else {

            //Set up speed to reverse player.speed
            player.upSpeed = player.speed * -1.0;

            //console.log("Player up speed set to " + player.upSpeed);
        }
    }
}

/**
 * Function: updatePlayerPosition
 * 
 * Input: Double deltaT, WebGLRenderingContext ctx
 * Output: None
 * 
 * Description: Updates the player position based on player directional speeds 
 *              and deltaT as long as the given directional speed is greater than zero.
 */
//Function to update the player position based on player speeds
function updatePlayerPosition(deltaT) {

    //Move player forward/backward
    //If forward speed is not zero
    if (!(player.forwardSpeed == 0.0)) {

        moveForward(player.forwardSpeed * deltaT); //Move player forward by forwardSpeed * change in time from last frame
    }

    //Move player up/down
    //If up speed is not zero
    if (!(player.upSpeed == 0.0)) {

        moveUp(player.upSpeed * deltaT); //Move player forward by forwardSpeed * change in time from last frame
    }

    //Move player left/right
    //If right speed is not zero
    if (!(player.rightSpeed == 0.0)) {

        moveRight(player.rightSpeed * deltaT); //Move player forward by rightSpeed * change in time from last frame
    }
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
 * Function: moveForward
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the player forward by given amount. Moves
 *              backward if given amount is negative
 */
function moveForward(amount) {

    player.x += player.forwardVec[0] * amount;
    player.z += player.forwardVec[2] * amount;
}

/**
 * Function: moveRight
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the player right by given amount. Moves
 *              left if given amount is negative
 */
function moveRight(amount) {

    player.x += player.rightVec[0] * amount;
    player.z += player.rightVec[2] * amount;
}

/**
 * Function: moveUp
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the player up by given amount. Moves
 *              down if given amount is negative
 */
//Function to move up based on player directional vectors
function moveUp(amount) {

    player.y += amount;

    /*if (player.y < 0.0)
    {
        player.y = 0.0;
    }*/
}

/**
 * Function: updateObjectRotation
 * 
 * Input: object, deltaT
 * Output: None
 * 
 * Description: Updates the roll pitch and yaw of
 * an object based on it's speeds and deltaT
 */
function updateObjectRotation(object, deltaT) {

    exteriorObjects[object].roll += exteriorObjects[object].rollSpeed * deltaT;
    exteriorObjects[object].pitch += exteriorObjects[object].pitchSpeed * deltaT;
    exteriorObjects[object].yaw += exteriorObjects[object].yawSpeed * deltaT;
}

/**
 * Function: randomizeRotations
 * 
 * Input: objects
 * Output: None
 * 
 * Description: Sets a random rotation speed for each object
 * in objects
 */
function randomizeRotations(objects)
{
    for (object in objects)
    {
        objects[object].rollSpeed = Math.random() * 5.0;
        objects[object].pitchSpeed = Math.random() * 5.0;
        objects[object].yawSpeed = Math.random() * 5.0;
    }
}