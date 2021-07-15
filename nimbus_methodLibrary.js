/**
 *               Filename: gallidys_methodLibrary.js
 * 
 *                 Author: Browning Keith Smith
 *           Date Created: April 24, 2020
 *          Date Modified: July 31, 2020
 * 
 *            Description: Gallidys is an open world MMO war game, where you aid your faction in attempting to
 *                         conquer the alien world of Gallidys. The game blends aspects of RTS and FPS for a truly
 *                         unique gaming experience. Command your troops from the air, or join them on the ground!
 *
 *                         This file specifically contains various static methods that the main gallidys.js file depends on.
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
function createShaderProgram(ctx) {

    //Compile shaders
    const vertexShader = loadShader(ctx, ctx.VERTEX_SHADER, vertexShaderCode);
    const fragmentShader = loadShader(ctx, ctx.FRAGMENT_SHADER, fragmentShaderCode);

    //Create pointer to new shader program
    const newShaderProgram = ctx.createProgram();

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

    return newShaderProgram;
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
function loadShader(ctx, type, code) {

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
function initBuffers(ctx, model) {

    //Create pointer to a new buffer
    var vertexBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);

    //Pass in the vertex data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(models[model].vertexValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    var colorBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, colorBuffer);

    //Pass in color data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(models[model].colorValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    var normalBuffer = ctx.createBuffer();

    //Bind the buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, normalBuffer);

    //Pass in normals data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(models[model].normalValues), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    var drawPointBuffer = ctx.createBuffer();

    //Bind the buffer to element buffer
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, drawPointBuffer);

    //Pass in element index data
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(models[model].drawPointIndices), ctx.STATIC_DRAW);

    return {

        vertex: vertexBuffer,
        color: colorBuffer,
        normal: normalBuffer,
        drawPoint: drawPointBuffer,
    };
}

/**
 * Function: applyTerrainDefinition
 * 
 * Input: Float32 x,z
 * Output: Float32
 * 
 * Description: This function applies the correct height to the given
 *              coordinates based on the terrain definition
 */
 function applyTerrainDefinition(x,z) {
 
    var a = terrainDefinition;

    var y = Math.sin(x*a[0]*1.0/2.0)*a[1] + Math.sin(z*a[0]*1.0/2.0)*a[1];
    y += Math.sin(x*a[2]*1.0/7.0)*a[3] + Math.sin(z*a[2]*1.0/7.0)*a[3];
    y += Math.sin(x*a[4]*1.0/3.0)*a[5] + Math.sin(z*a[4]*1.0/3.0)*a[5];
    y += Math.sin(x*a[6]*1.0/12.0)*a[7] + Math.sin(z*a[6]*1.0/12.0)*a[7];
    
    return y;
 }

 /**
 * Function: initVoxelBuffers
 * 
 * Input: WebGLRenderingContext ctx, Float32Array voxels
 * Output: Collection of WebGLRenderingContext buffer data
 * 
 * Description: This function takes the given list of height voxels, and creates buffers
 *              that can be used to render this section of terrain. It creates a buffer
 *              for vertex position data, a buffer for vertex normals, and a buffer for
 *              vertex colors.
 */
 function initChunkBuffers(ctx, chunk) {

    //Create and fill buffers with default data

    //Create vertex and index buffer
    var vertexArray = [];
    var drawPointArray = [];

    for (zPos = 0.0; zPos < chunkLength + 1.0; zPos++) { //For each row of the chunk
    
        for (x = 0.0; x < chunkWidth + 1.0; x++) { //For each column of the chunk (positive value)

            //vertex positions
            chunks[chunk].voxelHeights.push(0.0); //Push default height onto voxelHeights
            vertexArray.push(x, 0.0, zPos * -1.0); //Push on individual x and z values for each voxel, but set height to default

            //vertex colors
            chunks[chunk].voxelColors.push(1.0, 1.0, 1.0, 1.0);  //Push on colors, default white

            //vertex normals
            chunks[chunk].voxelNormals.push(0.0, 1.0, 0.0); //Push on normals, default up

            //Calculate the index representing this voxel
            var currentIndex = zPos * (chunkWidth + 1.0) + x;

            //If this voxel has both a northern and an eastern neighbor, push on Indices
            if (zPos < chunkLength) {
            
                if (x < chunkWidth) {
                
                    drawPointArray.push(currentIndex); //Push on sw vertex
                    drawPointArray.push(currentIndex + 1); //Push on se vertex
                    drawPointArray.push(currentIndex + chunkWidth + 1); //Push on nw vertex
                    drawPointArray.push(currentIndex + chunkWidth + 1); //Push on nw vertex
                    drawPointArray.push(currentIndex + 1); //Push on se vertex
                    drawPointArray.push(currentIndex + chunkWidth + 2); //Push on ne vertex
				}
			}
        }
    }

    //Create pointer to a new buffer
    var vertexBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);

    //Pass in the vertex data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertexArray), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    var colorBuffer = ctx.createBuffer();

    //Bind buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, colorBuffer);

    //Pass in color data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(chunks[chunk].voxelColors), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    var normalBuffer = ctx.createBuffer();

    //Bind the buffer to array buffer
    ctx.bindBuffer(ctx.ARRAY_BUFFER, normalBuffer);

    //Pass in normals data
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(chunks[chunk].voxelNormals), ctx.STATIC_DRAW);

    //Create pointer to a new buffer
    var drawPointBuffer = ctx.createBuffer();

    //Bind the buffer to element array buffer
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, drawPointBuffer);

    //Pass in index data
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(drawPointArray), ctx.STATIC_DRAW);

    //Set vertexCount
    chunks[chunk].model.drawPointCount = (chunkLength) * (chunkWidth) * 6.0;

    //Set vertices, colors, normals, and indices
    chunks[chunk].model.vertex = vertexBuffer;
    chunks[chunk].model.color = colorBuffer;
    chunks[chunk].model.normal = normalBuffer;
    chunks[chunk].model.drawPoint = drawPointBuffer;
 }

 /**
 * Function: editVoxels
 * 
 * Input: WebGLRenderingContext ctx, Chunk chunk, Integer factor
 * 
 * Description: This function takes the given chunk, and applies a set number of
 *              height/normal computations to the chunk's model
 */

 function editVoxels(ctx, chunk, factor) {

    //console.log("Status: " + chunks[chunk].status);
    var status = chunks[chunk].status; //Get load status of chunk

    //Check if load status is less than fully loaded
    if (status < ((chunkWidth + 1.0) * (chunkLength + 1.0) * 2)) {
 
        //If not fully loaded, begin editing chunk for the given factor amount
        for (i=0; i<factor; i++) {
    
            //console.log("Status: " + chunks[chunk].status);
            status = chunks[chunk].status; //Get load status of chunk

            //Check if load status is less than fully loaded
            if (status < ((chunkWidth + 1.0) * (chunkLength + 1.0) * 2)) {

                //console.log("Status: " + status);
      
                //Interpret load status
                var x;
                var zPos;

                //If status is less than chunkWidth * chunkLength - 1, we are loading heights
                if (status < (chunkWidth + 1.0) * (chunkLength + 1.0)) {

                    x = status % (chunkWidth + 1.0);

                    zPos = Math.floor(status / (chunkWidth + 1.0));

                    editHeight(ctx, chunk, x, zPos);
			    }
            
                //Otherwise we are loading normals
                else {
            
                    status = status - (chunkWidth + 1.0) * (chunkLength + 1.0);

                    x = status % (chunkWidth + 1.0);

                    zPos = Math.floor(status / (chunkWidth + 1.0));

                    editNormal(ctx, chunk, x, zPos);
			    }
		    }
            else {
        
                //console.log("Chunk " + chunk + " is done loading, breaking out of loop");
                break;
            }
	    }
    }
 }

 /**
 * Function: editHeight
 * 
 * Input: WebGLRenderingContext ctx, Chunk chunk, Integer x, Integer zPos
 * 
 * Description: This function takes the given chunk and x and y coordinates,
 *              and applies the proper terrain definition to set the height,
 *              and applies on the default ground color.
 */
 function editHeight(ctx, chunk, x, zPos) {

    //Get height of this voxel based on terrain definition
    var y = applyTerrainDefinition(chunks[chunk].x + x, chunks[chunk].z * -1.0 + zPos);

    //Get index of this voxel height in the voxelHeights buffer
    var index = zPos * (chunkWidth + 1.0) + x;

    //Place this new height into the chunk's voxelHeights buffer
    chunks[chunk].voxelHeights[index] = y;

    //Calculate index that represents the y-coordinate within the correct spot in the buffer
    var heightIndex = index*3; //Three coordinate values per vertex
    heightIndex = heightIndex*4; //Four bytes per coordinate value
    heightIndex = heightIndex+4; //Add four more bytes to get to y value

    ctx.bindBuffer(ctx.ARRAY_BUFFER, chunks[chunk].model.vertex); //Bind the buffer we will be editing
    ctx.bufferSubData(ctx.ARRAY_BUFFER, heightIndex, new Float32Array([y])); //Edit the y coordinate data

    //Calculate index that represents the correct color in the colorArray
    var colorIndex = index*4; //Four color values per vertex

    //Place the rgba color values into this voxel's color array
    chunks[chunk].voxelColors[index] = groundColor[0];
    chunks[chunk].voxelColors[index+1] = groundColor[1];
    chunks[chunk].voxelColors[index+2] = groundColor[2];
    chunks[chunk].voxelColors[index+3] = 1.0;

    //Calculate index that represents the correct color in the buffer
    colorIndex = colorIndex*4; //Four bytes per color value

    ctx.bindBuffer(ctx.ARRAY_BUFFER, chunks[chunk].model.color); //Bind the buffer we will be editing
    ctx.bufferSubData(ctx.ARRAY_BUFFER, colorIndex, new Float32Array([groundColor[0], groundColor[1], groundColor[2], 1.0])); //Edit the color data

    //Update chunk status
    chunks[chunk].status += 1;
 }

 /**
 * Function: editNormal
 * 
 * Input: WebGLRenderingContext ctx, Chunk chunk, Integer x, Integer zPos
 * 
 * Description: This function takes the given chunk and x and y coordinates,
 *              and uses already computed heights to determine a vertex Normal
 *              for the given voxel.
 */
 function editNormal(ctx, chunk, x, zPos) {

    //Calculate the index representing this voxel
    var index = zPos * (chunkWidth + 1.0) + x;

    //Get height of this Vertex
    var thisVertex = chunks[chunk].voxelHeights[index];

    //Get height of northern vertex
    var northVertex;
    if (zPos < chunkLength) { //If however there is a northern neighbor
       
        northVertex = chunks[chunk].voxelHeights[index + chunkWidth + 1];
	}
    else { //If there is no northern neighbor in this chunk, calculate the height of the northern neighbor
    
        northVertex = applyTerrainDefinition(chunks[chunk].x + x, (chunks[chunk].z * -1.0) + zPos + 1.0);
        
	}

    //Get height of eastern vertex
    var eastVertex;
    if (x < chunkWidth) { //If however there is an eastern neighbor
       
        eastVertex = chunks[chunk].voxelHeights[index + 1];
	}
    else { //If there is no eastern neighbor in this chunk, calculate the height of the eastern neighbor
    
        eastVertex = applyTerrainDefinition(chunks[chunk].x + x + 1.0, (chunks[chunk].z * -1.0) + zPos);
        
	}

    //Get height of southern vertex
    var southVertex;
    if (zPos > 0.0) { //If however there is a southern neighbor
       
        southVertex = chunks[chunk].voxelHeights[index - chunkWidth - 1];
	}
    else { //If there is no southern neighbor in this chunk, calculate the height of the southern neighbor
    
        southVertex = applyTerrainDefinition(chunks[chunk].x + x, (chunks[chunk].z * -1.0) + zPos - 1.0);
        
	}

    //Get height of western vertex
    var westVertex;
    if (x > 0.0) { //If however there is an eastern neighbor
       
        westVertex = chunks[chunk].voxelHeights[index - 1];
	}
    else { //If there is no western neighbor in this chunk, calculate the height of the western neighbor
    
        westVertex = applyTerrainDefinition(chunks[chunk].x + x - 1.0, (chunks[chunk].z * -1.0) + zPos);
        
	}

    //Calculate vector representing center to north
    vec3.set(northVec, 0.0, northVertex - thisVertex, -1.0);

    //Calculate vector representing center to east
    vec3.set(eastVec, 1.0, eastVertex - thisVertex, 0.0);

    //Calculate vector representing center to south
    vec3.set(southVec, 0.0, southVertex - thisVertex, 1.0);

    //Calculate vector representing center to west
    vec3.set(westVec, -1.0, westVertex - thisVertex, 0.0);

    //Calculate north east normal
    vec3.cross(neVec, eastVec, northVec);

    //Calculate south east normal
    vec3.cross(seVec, southVec, eastVec);

    //Calculate south west normal
    vec3.cross(swVec, westVec, southVec);

    //Calculate north west normal
    vec3.cross(nwVec, northVec, westVec);

    //Add all the vectors together into finalNormal
    vec3.add(finalNormal, neVec, seVec);
    vec3.add(finalNormal, finalNormal, swVec);
    vec3.add(finalNormal, finalNormal, nwVec);

    //Normalize
    vec3.normalize(finalNormal, finalNormal);

    //Calculate index that represents the correct normal in the buffer
    var normalIndex = index*3; //Three coordinate values per normal
    normalIndex = normalIndex*4; //Four bytes per coordinate value

    ctx.bindBuffer(ctx.ARRAY_BUFFER, chunks[chunk].model.normal);
    ctx.bufferSubData(ctx.ARRAY_BUFFER, normalIndex, new Float32Array(finalNormal));

    chunks[chunk].status += 1;
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
function drawHUD(hudCtx) {

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
function drawScene(ctx, shaderProgramData) {

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

    //Tell WebGL to use the shader program
    ctx.useProgram(shaderProgramData.program);

    //Compute projection matrix based on new window size
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, ctx.canvas.width / ctx.canvas.height, 0.1, 1000.0);

    //Compute worldViewMatrix based on opposite coordinates of camera position and camera rotation
    mat4.copy(worldViewMatrix, camera.rotationMatrix); //Second transform, rotate whole world around camera (in the opposite direction the camera is facing)
    mat4.translate(worldViewMatrix, worldViewMatrix, [camera.x * -1.0, camera.y * -1.0, camera.z * -1.0]); //First transform, move whole world away from camera

    //Set worldview and projection uniforms
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.projectionMatrix, false, projectionMatrix);
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.worldViewMatrix, false, worldViewMatrix);

    //Render all chunks
    for (chunk in chunks) {
    
        drawChunk(ctx, shaderProgramData, chunk);
	}

    //Render all objects
    for (object in objects) {

        drawObject(ctx, shaderProgramData, object);
    }
}

/**
 * Function: drawObject
 * 
 * Input: WebGLRenderingContext ctx, shaderProgramData, Object object
 * Output: None
 * 
 * Description: Handles drawing a specific object in the frame
 */

 function drawObject(ctx, shaderProgramData, object) {
 
    //Compute new model view matrix
    mat4.identity(modelViewMatrix);

    mat4.translate(modelViewMatrix, modelViewMatrix, [objects[object].x, objects[object].y, objects[object].z]);  //Fifth transform: move back from origin based on position
    mat4.rotate(modelViewMatrix, modelViewMatrix, objects[object].pitch, [1, 0, 0]); //Fourth transform: rotate around x based on object pitch
    mat4.rotate(modelViewMatrix, modelViewMatrix, objects[object].yaw, [0, 1, 0]);   //Third transform: rotate around y based on object yaw
    mat4.rotate(modelViewMatrix, modelViewMatrix, objects[object].roll, [0, 0, 1]);  //Second transform: rotate around z based on object roll

    //Compute new normals matrix
    //Do it before the scaling is applied, because otherwise the lighting doesn't work for some reason, not sure why yet :/
    mat4.identity(normalMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    mat4.scale(modelViewMatrix, modelViewMatrix, [objects[object].scale, objects[object].scale, objects[object].scale]); //First transform: scale object based on object scale

    //Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, objects[object].model.buffers.vertex);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexPosition); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out colors
    ctx.bindBuffer(ctx.ARRAY_BUFFER, objects[object].model.buffers.color);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexColor, 4, ctx.FLOAT, false, 0, 0); //Pull out 4 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexColor); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out normals
    ctx.bindBuffer(ctx.ARRAY_BUFFER, objects[object].model.buffers.normal);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexNormal, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexNormal); //Enable the pointer to the buffer

    //Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, objects[object].model.buffers.drawPoint);

    //Set the uniforms
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.modelViewMatrix, false, modelViewMatrix);
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.normalMatrix, false, normalMatrix);

    //Draw triangles
    ctx.drawElements(ctx.TRIANGLES, objects[object].model.drawPointCount, ctx.UNSIGNED_SHORT, 0);
 }

 /**
 * Function: drawChunk
 * 
 * Input: WebGLRenderingContext ctx, shaderProgramData, Chunk chunk
 * Output: None
 * 
 * Description: Handles drawing a specific chunk of terrain in the frame
 */
 function drawChunk(ctx, shaderProgramData, chunk) {
 
    //Compute new model view matrix
    mat4.identity(modelViewMatrix);

    mat4.translate(modelViewMatrix, modelViewMatrix, [chunks[chunk].x, 0.0, chunks[chunk].z]);  //Fifth transform: move back from origin based on position

    //Compute new normals matrix
    //Do it before the scaling is applied, because otherwise the lighting doesn't work for some reason, not sure why yet :/
    mat4.identity(normalMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    //Instruct WebGL how to pull out vertices
    ctx.bindBuffer(ctx.ARRAY_BUFFER, chunks[chunk].model.vertex);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexPosition, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexPosition); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out colors
    ctx.bindBuffer(ctx.ARRAY_BUFFER, chunks[chunk].model.color);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexColor, 4, ctx.FLOAT, false, 0, 0); //Pull out 4 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexColor); //Enable the pointer to the buffer

    //Instruct WebGL how to pull out normals
    ctx.bindBuffer(ctx.ARRAY_BUFFER, chunks[chunk].model.normal);
    ctx.vertexAttribPointer(shaderProgramData.attributes.vertexNormal, 3, ctx.FLOAT, false, 0, 0); //Pull out 3 values at a time, no offsets
    ctx.enableVertexAttribArray(shaderProgramData.attributes.vertexNormal); //Enable the pointer to the buffer

    //Give WebGL the element array
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, chunks[chunk].model.drawPoint);

    //Set the uniforms
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.modelViewMatrix, false, modelViewMatrix);
    ctx.uniformMatrix4fv(shaderProgramData.uniforms.normalMatrix, false, normalMatrix);

    //Draw triangles
    ctx.drawElements(ctx.TRIANGLES, chunks[chunk].model.drawPointCount, ctx.UNSIGNED_SHORT, 0);
 }

/**
 * Function: updateMouse
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: Updates lastMousePosition, and uses the change in mouse position to
 *              update the direction that the camera is facing by calling pithcUp
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
    var deltaX = event.offsetX - lastMousePosition.x;
    var deltaY = event.offsetY - lastMousePosition.y;

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
 *              then calls updateCameraSpeed to update the speed and
 *              direction in which the camera is moving.
 */
function parseDownKey(event) {

    var code = event.code;  //Edge does not recognize this apparently

    //console.log("Key Down: " + code);

    //Find which key was pressed down
    for (key in keys) {

        //If the code of the key pressed matches
        if (code == keys[key].code) {

            //If key was not already down
            if (!(keys[key].down)) {

                //Update that key is down
                keys[key].down = true;

                //Update camera speeds
                updateCameraSpeed();
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
 *              then calls updateCameraSpeed to update the speed and
 *              direction in which the camera is moving.
 */
function parseUpKey(event) {

    var code = event.code; //Edge does not recognize this apparently

    //console.log("Key Up: " + code);

    //Find which key was released
    for (key in keys) {

        //If the code of the key released matches
        if (code == keys[key].code) {

            //If key was already down
            if (keys[key].down) {

                //Update that key is up
                keys[key].down = false;

                //Update camera speeds
                updateCameraSpeed();
            }
            else {

                return;
            }
        } 
    }
}

/**
 * Function: updateCameraSpeed
 * 
 * Input: KeyboardEvent event
 * Output: None
 * 
 * Description: This function takes a look at the state of pressed keys, and
 *              sets the speed of the camera based on that.
 */
function updateCameraSpeed() {

    //If both W and S are down, or if neither of them are down
    if ((keys.W.down && keys.S.down) || !(keys.W.down || keys.S.down)) {

        //Set forward speed to 0.0
        camera.forwardSpeed = 0.0;

        //console.log("Camera forward speed set to " + camera.forwardSpeed);
    }
    else {

        //If W is the key that is down
        if (keys.W.down) {

            //Set forward speed to camera.speed
            camera.forwardSpeed = camera.speed;

            //console.log("Camera forward speed set to " + camera.forwardSpeed);
        }
        else {

            //Set forward speed to reverse camera.speed
            camera.forwardSpeed = camera.speed * -1.0;

            //console.log("Camera forward speed set to " + camera.forwardSpeed);
        }
    }

    //If both A and D are down, or if neither of them are down
    if ((keys.A.down && keys.D.down) || !(keys.A.down || keys.D.down)) {

        //Set right speed to 0.0
        camera.rightSpeed = 0.0;

        //console.log("Camera right speed set to " + camera.rightSpeed);
    }
    else {

        //If A is the key that is down
        if (keys.A.down) {

            //Set right speed to reverse camera.speed
            camera.rightSpeed = camera.speed * -1.0;

            //console.log("Camera right speed set to " + camera.rightSpeed);
        }
        else {

            //Set right speed to camera.speed
            camera.rightSpeed = camera.speed;

            //console.log("Camera right speed set to " + camera.rightSpeed);
        }
    }

    //If both Space and ShiftLeft are down, or if neither of them are down
    if ((keys.Space.down && keys.ShiftLeft.down) || !(keys.Space.down || keys.ShiftLeft.down)) {

        //Set up speed to 0.0
        camera.upSpeed = 0.0;

        //console.log("Camera up speed set to " + camera.upSpeed);
    }
    else {

        //If A is the key that is down
        if (keys.Space.down) {

            //Set up speed to camera.speed
            camera.upSpeed = camera.speed;

            //console.log("Camera up speed set to " + camera.upSpeed);
        }
        else {

            //Set up speed to reverse camera.speed
            camera.upSpeed = camera.speed * -1.0;

            //console.log("Camera up speed set to " + camera.upSpeed);
        }
    }

    //If both Q and E are down, or if neither of them are down
    if ((keys.Q.down && keys.E.down) || !(keys.Q.down || keys.E.down)) {

        //Set roll speed to 0.0
        camera.rollSpeed = 0.0;

        //console.log("Camera roll speed set to " + camera.rollSpeed);
    }
    else {

        //If Q is the key that is down
        if (keys.Q.down) {

            //Set roll speed
            camera.rollSpeed = -2.0;

            //console.log("Camera roll speed set to " + camera.rollSpeed);
        }
        else {

            //Set roll speed
            camera.rollSpeed = 2.0;

            //console.log("Camera roll speed set to " + camera.rollSpeed);
        }
    }
}

/**
 * Function: updateRoll
 * 
 * Input: Double deltaT
 * Output: None
 * 
 * Description: Updates the camera roll by camera.rollSpeed and deltaT
 *              as long as the rollSpeed is greater than zero
 */
function updateRoll(deltaT) {

    //If roll speed is not zero
    if (!(camera.rollSpeed == 0.0)) {

        rollRight(camera.rollSpeed * deltaT); //Roll the camera by speed * change in time from last frame
    }
}

/**
 * Function: updatePosition
 * 
 * Input: Double deltaT, WebGLRenderingContext ctx
 * Output: None
 * 
 * Description: Updates the camera position based on camera directional speeds 
 *              and deltaT as long as the given directional speed is greater than zero.
 *              Records what the last x and z position of the camera were, and initializes
 *              checkForStrides method to see if terrain data needs to be swapped between
 *              chunks
 */
//Function to update the camera position based on camera speeds
function updatePosition(deltaT,ctx) {

    //Record the cameras last position
    camera.lastx = camera.x;
    camera.lastz = camera.z;

    //Move camera forward/backward
    //If forward speed is not zero
    if (!(camera.forwardSpeed == 0.0)) {

        moveForward(camera.forwardSpeed * deltaT); //Move camera forward by forwardSpeed * change in time from last frame
    }

    //Move camera up/down
    //If up speed is not zero
    if (!(camera.upSpeed == 0.0)) {

        moveUp(camera.upSpeed * deltaT); //Move camera forward by forwardSpeed * change in time from last frame
    }

    //Move camera left/right
    //If right speed is not zero
    if (!(camera.rightSpeed == 0.0)) {

        moveRight(camera.rightSpeed * deltaT); //Move camera forward by rightSpeed * change in time from last frame
    }

    //Check for strides
    checkForStrides(ctx);
}

/**
 * Function: rollRight
 * 
 * Input: Double angle
 * Output: None
 * 
 * Description: Rotates the camera around it's local z vector by the given angle
 */
//Function to roll the camera around it's local z vector
function rollRight(angle) {

    //Create a quaternion representing rotation around forwardVec by negative angle
    const rollQuat = quat.create();
    quat.setAxisAngle(rollQuat, camera.forwardVec, angle * -1.0);

    //Create a new rotation matrix with roll quaternion and no translation
    const rollMatrix = mat4.create();
    mat4.fromRotationTranslation(rollMatrix, rollQuat, [0.0, 0.0, 0.0]);

    //Apply this matrix to the camera's view matrix
    mat4.multiply(camera.rotationMatrix, camera.rotationMatrix, rollMatrix);

    //Now set the quaternion using the positive angle
    quat.setAxisAngle(rollQuat, camera.forwardVec, angle);

    //Apply this rotation to camera's rightVec and upVec
    vec3.transformQuat(camera.rightVec, camera.rightVec, rollQuat);
    vec3.transformQuat(camera.upVec, camera.upVec, rollQuat);

    //Normalize camera's rightVec and upVec
    vec3.normalize(camera.rightVec, camera.rightVec);
    vec3.normalize(camera.upVec, camera.upVec);
}

/**
 * Function: pitchUp
 * 
 * Input: Double angle
 * Output: None
 * 
 * Description: Pitches the camera around it's local x vector by the given angle
 */
//Function to pitch the camera around it's local x vector
function pitchUp(angle) {

    //Create a quaternion representing rotation around rightVec by negative angle
    const pitchQuat = quat.create();
    quat.setAxisAngle(pitchQuat, camera.rightVec, angle * -1.0);

    //Create a new rotation matrix with roll quaternion and no translation
    const pitchMatrix = mat4.create();
    mat4.fromRotationTranslation(pitchMatrix, pitchQuat, [0.0, 0.0, 0.0]);

    //Apply this matrix to the camera's view matrix
    mat4.multiply(camera.rotationMatrix, camera.rotationMatrix, pitchMatrix);

    //Now set the quaternion using the positive angle
    quat.setAxisAngle(pitchQuat, camera.rightVec, angle);

    //Apply this rotation to camera's upVec and forwardVec
    vec3.transformQuat(camera.upVec, camera.upVec, pitchQuat);
    vec3.transformQuat(camera.forwardVec, camera.forwardVec, pitchQuat);

    //Normalize camera's upVec and forwardVec
    vec3.normalize(camera.upVec, camera.upVec);
    vec3.normalize(camera.forwardVec, camera.forwardVec);
}

/**
 * Function: yawRight
 * 
 * Input: Double angle
 * Output: None
 * 
 * Description: Rotates the camera around it's local y vector by the given angle
 */
//Function to yaw the camera around it's local y vector
function yawRight(angle) {

    //Create a quaternion representing rotation around upVec by negative angle
    const yawQuat = quat.create();
    quat.setAxisAngle(yawQuat, camera.upVec, angle * -1.0);

    //Create a new rotation matrix with roll quaternion and no translation
    const yawMatrix = mat4.create();
    mat4.fromRotationTranslation(yawMatrix, yawQuat, [0.0, 0.0, 0.0]);

    //Apply this matrix to the camera's view matrix
    mat4.multiply(camera.rotationMatrix, camera.rotationMatrix, yawMatrix);

    //Now set the quaternion using the positive angle
    quat.setAxisAngle(yawQuat, camera.upVec, angle);

    //Apply this rotation to camera's rightVec and forwardVec
    vec3.transformQuat(camera.rightVec, camera.rightVec, yawQuat);
    vec3.transformQuat(camera.forwardVec, camera.forwardVec, yawQuat);

    //Normalize camera's rightVec and forwardVec
    vec3.normalize(camera.rightVec, camera.rightVec);
    vec3.normalize(camera.forwardVec, camera.forwardVec);
}

/**
 * Function: moveForward
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the camera forward by given amount. Moves
 *              backward if given amount is negative
 */
function moveForward(amount) {

    camera.x += camera.forwardVec[0] * amount;
    camera.y += camera.forwardVec[1] * amount;
    camera.z += camera.forwardVec[2] * amount;
}

/**
 * Function: moveRight
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the camera right by given amount. Moves
 *              left if given amount is negative
 */
function moveRight(amount) {

    camera.x += camera.rightVec[0] * amount;
    camera.y += camera.rightVec[1] * amount;
    camera.z += camera.rightVec[2] * amount;
}

/**
 * Function: moveUp
 * 
 * Input: Double amount
 * Output: None
 * 
 * Description: Moves the camera up by given amount. Moves
 *              down if given amount is negative
 */
//Function to move up based on camera directional vectors
function moveUp(amount) {

    camera.x += camera.upVec[0] * amount;
    camera.y += camera.upVec[1] * amount;
    camera.z += camera.upVec[2] * amount;
}

/**
 * Function: checkForStrides
 * 
 * Input: WebGLRenderingContext ctx
 * Output: None
 * 
 * Description: Checks for strides. My definition of a strides
 *              is when the camera moves across a chunk boundary.
 *              if this happens, terrain data needs to be swapped
 *              between chunks, and the chunks positions need to be
 *              altered
 */

 function checkForStrides(ctx) {
 
    //If camera ventured north past cx0z0, report that camera strided
    if (camera.z < (chunks.cx0z0.z - chunkLength)) {
    
        console.log("Camera strided forward by 1");
        strideForward(ctx);
	}

    //If camera ventured south past cx0z0, report that camera strided backward
    if (camera.z > chunks.cx0z0.z) {
    
        console.log("Camera strided backward by 1");
        strideBackward(ctx);
	}

    //If camera ventured left past cx0z0, report that camera strided left
    if (camera.x < chunks.cx0z0.x) {
    
        console.log("Camera strided left by 1");
        strideLeft(ctx);
	}

    //If camera ventured right past cx0z0, report that camera strided right
    if (camera.x > chunks.cx0z0.x + chunkWidth) {
    
        console.log("Camera strided right by 1");
        strideRight(ctx);
	}

    //Load central chunks all the way
    editVoxels(ctx, "cx0z0", 140000);
    editVoxels(ctx, "cxn1zn1", 140000);
    editVoxels(ctx, "cx0zn1", 140000);
    editVoxels(ctx, "cx1zn1", 140000);
    editVoxels(ctx, "cxn1z0", 140000);
    editVoxels(ctx, "cx1z0", 140000);
    editVoxels(ctx, "cxn1z1", 140000);
    editVoxels(ctx, "cx0z1", 140000);
    editVoxels(ctx, "cx1z1", 140000);
 }

 /**
 * Function: strideForward
 * 
 * Input: WebGLRenderingContext ctx
 * Output: None
 * 
 * Description: This function is called if the camera strides forward by 1
                Most importantly it moves all chunks forward by chunkLength,
                and moves the data of cx0zn1 with cx0z0, then loads cx0z0 all
                the way
 */
 function strideForward(ctx) {
 
    //Move all chunks forward by chunkLength
    for (chunk in chunks) {
    
        chunks[chunk].z -= chunkLength;
	}

    //swap (-2 2)(-2 1),(-2 1)(-2 0),(-2 0)(-2 -1),(-2 -1)(-2 -2)
    swapChunkData("cxn2z2","cxn2z1");
    swapChunkData("cxn2z1","cxn2z0");
    swapChunkData("cxn2z0","cxn2zn1");
    swapChunkData("cxn2zn1","cxn2zn2");

    //swap (-1 2)(-1 1),(-1 1)(-1 0),(-1 0)(-1 -1),(-1 -1)(-1 -2)
    swapChunkData("cxn1z2","cxn1z1");
    swapChunkData("cxn1z1","cxn1z0");
    swapChunkData("cxn1z0","cxn1zn1");
    swapChunkData("cxn1zn1","cxn1zn2");

    //swap (0 2)(0 1),(0 1)(0 0),(0 0)(0 -1),(0 -1)(0 -2)
    swapChunkData("cx0z2","cx0z1");
    swapChunkData("cx0z1","cx0z0");
    swapChunkData("cx0z0","cx0zn1");
    swapChunkData("cx0zn1","cx0zn2");

    //swap (1 2)(1 1),(1 1)(1 0),(1 0)(1 -1),(1 -1)(1 -2)
    swapChunkData("cx1z2","cx1z1");
    swapChunkData("cx1z1","cx1z0");
    swapChunkData("cx1z0","cx1zn1");
    swapChunkData("cx1zn1","cx1zn2");

    //swap (2 2)(2 1),(2 1)(2 0),(2 0)(2 -1),(2 -1)(2 -2)
    swapChunkData("cx2z2","cx2z1");
    swapChunkData("cx2z1","cx2z0");
    swapChunkData("cx2z0","cx2zn1");
    swapChunkData("cx2zn1","cx2zn2");

    //Reset (-2 -2),(-1 -2),(0 -2),(1 -2),(2 -2)
    chunks.cxn2zn2.status = 0;
    chunks.cxn1zn2.status = 0;
    chunks.cx0zn2.status = 0;
    chunks.cx1zn2.status = 0;
    chunks.cx2zn2.status = 0;
 }

 /**
 * Function: strideForward
 * 
 * Input: WebGLRenderingContext ctx
 * Output: None
 * 
 * Description: This function is called if the camera strides backward by 1
                Most importantly it moves all chunks backward by chunkLength,
                and moves the data of cx0z1 with cx0z0, then loads cx0z0 all
                the way
 */
 function strideBackward(ctx) {
 
    //Move all chunks backward by chunkLength
    for (chunk in chunks) {
    
        chunks[chunk].z += chunkLength;
	}

    //swap (-2 -1)(-2 -2),(-2 0)(-2 -1),(-2 1)(-2 0),(-2 2)(-2 1)
    swapChunkData("cxn2zn1","cxn2zn2");
    swapChunkData("cxn2z0","cxn2zn1");
    swapChunkData("cxn2z1","cxn2z0");
    swapChunkData("cxn2z2","cxn2z1");

    //swap (-1 -1)(-1 -2),(-1 0)(-1 -1),(-1 1)(-1 0),(-1 2)(-1 1)
    swapChunkData("cxn1zn1","cxn1zn2");
    swapChunkData("cxn1z0","cxn1zn1");
    swapChunkData("cxn1z1","cxn1z0");
    swapChunkData("cxn1z2","cxn1z1");

    //swap (0 -1)(0 -2),(0 0)(0 -1),(0 1)(0 0),(0 2)(0 1)
    swapChunkData("cx0zn1","cx0zn2");
    swapChunkData("cx0z0","cx0zn1");
    swapChunkData("cx0z1","cx0z0");
    swapChunkData("cx0z2","cx0z1");

    //swap (1 -1)(1 -2),(1 0)(1 -1),(1 1)(1 0),(1 2)(1 1)
    swapChunkData("cx1zn1","cx1zn2");
    swapChunkData("cx1z0","cx1zn1");
    swapChunkData("cx1z1","cx1z0");
    swapChunkData("cx1z2","cx1z1");

    //swap (2 -1)(2 -2),(2 0)(2 -1),(2 1)(2 0),(2 2)(2 1)
    swapChunkData("cx2zn1","cx2zn2");
    swapChunkData("cx2z0","cx2zn1");
    swapChunkData("cx2z1","cx2z0");
    swapChunkData("cx2z2","cx2z1");

    //Reset (-2 2),(-1 2),(0 2),(1 2),(2 2)
    chunks.cxn2z2.status = 0;
    chunks.cxn1z2.status = 0;
    chunks.cx0z2.status = 0;
    chunks.cx1z2.status = 0;
    chunks.cx2z2.status = 0;
 }

 /**
 * Function: strideLeft
 * 
 * Input: WebGLRenderingContext ctx
 * Output: None
 * 
 * Description: This function is called if the camera strides left by 1
                Most importantly it moves all chunks to the left by chunkWidth,
                and moves the data of cxn1z0 with cx0z0, then loads cx0z0 all
                the way
 */
 function strideLeft(ctx) {
 
    //Move all chunks left by chunkWidth
    for (chunk in chunks) {
    
        chunks[chunk].x -= chunkWidth;
	}

    //swap (2 -2)(1 -2),(1 -2)(0 -2),(0 -2)(-1 -2),(-1 -2)(-2 -2)
    swapChunkData("cx2zn2","cx1zn2");
    swapChunkData("cx1zn2","cx0zn2");
    swapChunkData("cx0zn2","cxn1zn2");
    swapChunkData("cxn1zn2","cxn2zn2");

    //swap (2 -1)(1 -1),(1 -1)(0 -1),(0 -1)(-1 -1),(-1 -1)(-2 -1)
    swapChunkData("cx2zn1","cx1zn1");
    swapChunkData("cx1zn1","cx0zn1");
    swapChunkData("cx0zn1","cxn1zn1");
    swapChunkData("cxn1zn1","cxn2zn1");

    //swap (2 0)(1 0),(1 0)(0 0),(0 0)(-1 0),(-1 0)(-2 0)
    swapChunkData("cx2z0","cx1z0");
    swapChunkData("cx1z0","cx0z0");
    swapChunkData("cx0z0","cxn1z0");
    swapChunkData("cxn1z0","cxn2z0");

    //swap (2 1)(1 1),(1 1)(0 1),(0 1)(-1 1),(-1 1)(-2 1)
    swapChunkData("cx2z1","cx1z1");
    swapChunkData("cx1z1","cx0z1");
    swapChunkData("cx0z1","cxn1z1");
    swapChunkData("cxn1z1","cxn2z1");

    //swap (2 2)(1 2),(1 2)(0 2),(0 2)(-1 2),(-1 2)(-2 2)
    swapChunkData("cx2z2","cx1z2");
    swapChunkData("cx1z2","cx0z2");
    swapChunkData("cx0z2","cxn1z2");
    swapChunkData("cxn1z2","cxn2z2");

    //reset (-2 -2),(-2 -1),(-2 0),(-2 1),(-2 2)
    chunks.cxn2zn2.status = 0;
    chunks.cxn2zn1.status = 0;
    chunks.cxn2z0.status = 0;
    chunks.cxn2z1.status = 0;
    chunks.cxn2z2.status = 0;
 }

 /**
 * Function: strideRight
 * 
 * Input: WebGLRenderingContext ctx
 * Output: None
 * 
 * Description: This function is called if the camera strides right by 1
                Most importantly it moves all chunks to the right by chunkWidth,
                and moves the data of cx1z0 with cx0z0, then loads cx0z0 all
                the way
 */
 function strideRight(ctx) {
 
    //Move all chunks right by chunkWidth
    for (chunk in chunks) {
    
        chunks[chunk].x += chunkWidth;
	}

    //swap (-1 -2)(-2 -2),(0 -2)(-1 -2),(1 -2)(0 -2),(2 -2)(1 -2)
    swapChunkData("cxn1zn2","cxn2zn2");
    swapChunkData("cx0zn2","cxn1zn2");
    swapChunkData("cx1zn2","cx0zn2");
    swapChunkData("cx2zn2","cx1zn2");

    //swap (-1 -1)(-2 -1),(0 -1)(-1 -1),(1 -1)(0 -1),(2 -1)(1 -1)
    swapChunkData("cxn1zn1","cxn2zn1");
    swapChunkData("cx0zn1","cxn1zn1");
    swapChunkData("cx1zn1","cx0zn1");
    swapChunkData("cx2zn1","cx1zn1");

    //swap (-1 0)(-2 0),(0 0)(-1 0),(1 0)(0 0),(2 0)(1 0)
    swapChunkData("cxn1z0","cxn2z0");
    swapChunkData("cx0z0","cxn1z0");
    swapChunkData("cx1z0","cx0z0");
    swapChunkData("cx2z0","cx1z0");

    //swap (-1 1)(-2 1),(0 1)(-1 1),(1 1)(0 1),(2 1)(1 1)
    swapChunkData("cxn1z1","cxn2z1");
    swapChunkData("cx0z1","cxn1z1");
    swapChunkData("cx1z1","cx0z1");
    swapChunkData("cx2z1","cx1z1");

    //swap (-1 2)(-2 2),(0 2)(-1 2),(1 2)(0 2),(2 2)(1 2)
    swapChunkData("cxn1z2","cxn2z2");
    swapChunkData("cx0z2","cxn1z2");
    swapChunkData("cx1z2","cx0z2");
    swapChunkData("cx2z2","cx1z2");

    //reset (2 -2),(2 -1),(2 0),(2 1),(2 2)
    chunks.cx2zn2.status = 0;
    chunks.cx2zn1.status = 0;
    chunks.cx2z0.status = 0;
    chunks.cx2z1.status = 0;
    chunks.cx2z2.status = 0;
 }

 /**
 * Function: swapChunkData
 * 
 * Input: Chunk chunk1, Chunk chunk2
 * Output: None
 * 
 * Description: This function swaps the terrain definition and model buffers
 *              of two chunks. Does not alter coordinates of chunk
 */

 function swapChunkData(chunk1, chunk2) {
 
    //Store status of chunk1 into a temporary variables
    var status = chunks[chunk1].status;

    //Store local chunk data of chunk1 into temporary variables
    var voxelHeights = chunks[chunk1].voxelHeights;
    var voxelColors = chunks[chunk1].voxelColors;
    var voxelNormals = chunks[chunk1].voxelNormals;

    //Store chunk1 buffer data into temporary variables. No need to store drawPointBuffer
    var vertexBuffer = chunks[chunk1].model.vertex;
    var colorBuffer = chunks[chunk1].model.color;
    var normalBuffer = chunks[chunk1].model.normal;

    //Store status of chunk2 into chunk1
    chunks[chunk1].status = chunks[chunk2].status;

    //Copy local chunk data of chunk2 into chunk1
    chunks[chunk1].voxelHeights = chunks[chunk2].voxelHeights;
    chunks[chunk1].voxelColors = chunks[chunk2].voxelColors;
    chunks[chunk1].voxelNormals = chunks[chunk2].voxelNormals;

    //Copy buffer data of chunk2 into chunk1
    chunks[chunk1].model.vertex = chunks[chunk2].model.vertex;
    chunks[chunk1].model.color = chunks[chunk2].model.color;
    chunks[chunk1].model.normal = chunks[chunk2].model.normal;

    //Store temporary status into chunk2
    chunks[chunk2].status = status;

    //Copy temporary local chunk data into chunk2
    chunks[chunk2].voxelHeights = voxelHeights;
    chunks[chunk2].voxelColors = voxelColors;
    chunks[chunk2].voxelNormals = voxelNormals;

    //Copy temporary buffer data into chunk2
    chunks[chunk2].model.vertex = vertexBuffer;
    chunks[chunk2].model.color = colorBuffer;
    chunks[chunk2].model.normal = normalBuffer;
 }