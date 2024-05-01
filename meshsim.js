// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	var mX = [
		1, 0, 						0, 						0,
		0, Math.cos(rotationX), 	Math.sin(rotationX), 	0,
		0, -Math.sin(rotationX), 	Math.cos(rotationX), 	0,
		0, 0,	 					0, 						1
	];

	var mY = [
		Math.cos(rotationY), 	0, 		-Math.sin(rotationY), 	0,
		0, 						1, 		0, 						0,
		Math.sin(rotationY), 	0, 		Math.cos(rotationY), 	0,
		0, 						0, 		0, 						1
	];

	var t = [
		1, 				0, 				0, 				0,
		0, 				1, 				0, 				0,
		0, 				0, 				1, 				0,
		translationX, 	translationY, 	translationZ, 	1
	];
	
	var mv = MatrixMult (mX, mY);
	mv = MatrixMult (t, mv);
	return mv;
}

class MeshDrawer
{
	COLOR_NORMAL = 0;
	COLOR_HEIGHT = 1;
	COLOR_ISOSURFACE = 2;
	COLOR_SUPERLEVEL = 3;
	COLOR_SUBLEVEL = 4;
	COLOR_COMBINED = 5;

	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// Compile program
		this.prog = InitShaderProgram( modelVS, modelFS );

		// Get all attributes and uniforms
		this.vertAttrib = gl.getAttribLocation(this.prog, 'vert');
		this.texAttrib = gl.getAttribLocation(this.prog, 'tex');
		this.normAttrib = gl.getAttribLocation(this.prog, 'normal');
		this.heightAttrib = gl.getAttribLocation(this.prog, 'height');

		this.textureUnif = gl.getUniformLocation(this.prog, 'texture');
		this.mvpUnif = gl.getUniformLocation(this.prog, 'mvp');
		this.mvUnif = gl.getUniformLocation(this.prog, 'mv');
		this.mvNormalUnif = gl.getUniformLocation(this.prog, 'mvNormal');
		this.swapUnif = gl.getUniformLocation(this.prog, 'swap');
		this.showTexUnif = gl.getUniformLocation(this.prog, 'showTexture');
		this.lightIntensityUnif = gl.getUniformLocation(this.prog, 'lightIntensity');
		this.lightVecUnif = gl.getUniformLocation(this.prog, "lightVec");
		this.shinyUnif = gl.getUniformLocation(this.prog, 'shiny');
		this.ambientStrengthUnif = gl.getUniformLocation(this.prog, 'ambientStrength');

		this.maxHeightUnif = gl.getUniformLocation(this.prog, 'maxHeight');
		this.minHeightUnif = gl.getUniformLocation(this.prog, 'minHeight');
		this.isoValueUnif = gl.getUniformLocation(this.prog, 'isoValue');
		this.colorModeUnif = gl.getUniformLocation(this.prog, 'colorMode');
		this.toleranceUnif = gl.getUniformLocation(this.prog, 'tolerance');


		// Generate buffers
		this.vertBuf = gl.createBuffer();
		this.texBuf = gl.createBuffer();
		this.normalBuf = gl.createBuffer();
		this.heightBuf = gl.createBuffer();

		gl.useProgram(this.prog);

		// Default do not swap
		gl.uniform1i(this.swapUnif, false);

		// Set light intensity
		gl.uniform3f(this.lightIntensityUnif, 1, 1, 1);
		gl.uniform1f(this.shinyUnif, 100.0);
		gl.uniform1f(this.ambientStrengthUnif, 0.2);

		// Do not show texture at start (as none is loaded in yet)
		gl.uniform1i(this.showTexUnif, false);

		// Default to showing height coloring
		gl.uniform1i(this.colorModeUnif, this.COLOR_HEIGHT);

		// Default 0.001 tolerance
		this.tolerance = 0.001;
		gl.uniform1f(this.toleranceUnif, this.tolerance);

		// Create texture
		this.texture = gl.createTexture();

		// Show texture ticked by default, so must init to true
		this.textureExists = false;
		this.showTex = true;
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals, heights )
	{
		this.numTriangles = vertPos.length / 3;

		// console.log(vertPos, heights)

		// Populate vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// Populate texture coord buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		// Populate normal buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		// Populate height buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.heightBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(heights), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		this.swap = swap;
		
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapUnif, this.swap);
	}

	set_recomputed_ct_unifs(max_height, min_height){
		gl.useProgram(this.prog);
		gl.uniform1f(this.maxHeightUnif, max_height);
		gl.uniform1f(this.minHeightUnif, min_height);
	}

	set_colormode(new_mode){
		gl.useProgram(this.prog);
		gl.uniform1i(this.colorModeUnif, new_mode);
	}

	set_isovalue(new_isoval){
		// console.log(new_isoval);
		gl.useProgram(this.prog);
		gl.uniform1f(this.isoValueUnif, new_isoval);
	}

	set_tolerance(new_tolerance){
		this.tolerance = new_tolerance;

		gl.useProgram(this.prog);
		gl.uniform1f(this.toleranceUnif, new_tolerance);
	}

	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram(this.prog);
		// Set new uniform value for transformation matrix
		gl.uniformMatrix4fv(this.mvpUnif, false, matrixMVP);
		gl.uniformMatrix4fv(this.mvUnif, false, matrixMV);
		gl.uniformMatrix3fv(this.mvNormalUnif, false, matrixNormal);

		// Enable vertex buffer to draw model
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
		gl.vertexAttribPointer( this.vertAttrib, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertAttrib );

		// Enable texture coord buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
		gl.vertexAttribPointer(this.texAttrib, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texAttrib);

		// Enable norm val buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuf);
		gl.vertexAttribPointer(this.normAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normAttrib);

		// Enable height buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.heightBuf);
		gl.vertexAttribPointer(this.heightAttrib, 1, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.heightAttrib);

		// Redraw
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// Now have a texture to apply
		this.textureExists = true;
		this.showTexture(this.showTex);

		// Bind to texture unit
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		gl.generateMipmap(gl.TEXTURE_2D);

		// Push data to the texture unit
		gl.useProgram(this.prog);
		gl.uniform1i(this.textureUnif, 0);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		this.showTex = show;
		
		gl.useProgram(this.prog);
		// Always false if texture does not exist
		gl.uniform1i(this.showTexUnif, this.showTex && this.textureExists);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		this.lightDir = [x,y,z];
		// console.log(this.lightDir);
			
		gl.useProgram(this.prog);
		
		// "If you perform shading in the camera space, you do not need to transform the light direction"
		gl.uniform3f(this.lightVecUnif, this.lightDir[0], this.lightDir[1], this.lightDir[2]);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		this.shininess = shininess;

		gl.useProgram(this.prog);
		gl.uniform1f(this.shinyUnif, this.shininess);
	}
}

// Vertex Shader
var modelVS = `
	attribute vec3 vert;
	attribute vec2 tex;
	attribute vec3 normal;
	attribute float height;

	uniform bool swap;
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 mvNormal;

	uniform float maxHeight;
	uniform float minHeight;

	varying vec2 texCoord;
	varying vec3 normal_interp;
	varying vec3 fragPos;

	varying float heightOut;

	void main()
	{
		vec3 pos = vert;
		vec3 norm = normal;
		// Swap x and y if selected
		if(swap){
			pos = vec3(pos.x, pos.z, pos.y);
			// must also invert normals otherwise light will reflect off the prior angle
			norm = vec3(norm.x, norm.z, norm.y);
		}

		// Transform the vertex in homogenous coords and set it as position
		gl_Position = mvp * vec4(pos, 1.0);
		texCoord = tex;
		normal_interp = mvNormal * normal;


		// Interpolate into frag shader
		heightOut = height;
		// heightOut = (height - minHeight) / (maxHeight - minHeight);


		// Interpolate the position for use in the fragment shader
		fragPos = vec3(mv * vec4(pos, 1.0));

	}
`;

// Fragment Shader
var modelFS = `
	#define COLOR_NORMAL 0
	#define COLOR_HEIGHT 1
	#define COLOR_ISOSURFACE 2
	#define COLOR_SUPERLEVEL 3
	#define COLOR_SUBLEVEL 4
	#define COLOR_COMBINED 5

	precision mediump float;
	
	uniform sampler2D texture;
	uniform bool showTexture;

	uniform vec3 lightVec;
	uniform vec3 lightIntensity;
	uniform float shiny;
	uniform float ambientStrength;

	uniform float maxHeight;
	uniform float minHeight;
	uniform float isoValue;
	uniform float tolerance;

	uniform int colorMode;

	varying vec2 texCoord;
	varying vec3 normal_interp;
	varying vec3 fragPos;

	varying float heightOut;

	void main()
	{	
		// Must normalize all vectors to get accurate dot products
		vec3 norm = normalize(normal_interp);
		vec3 lightDir = normalize(lightVec);

		// Inverse of position vec is the view direction in View space
		vec3 viewDir = normalize(-1.0 * fragPos);
		vec3 halfDir = normalize(lightDir + viewDir);

		// Color back side same way
		float phongTerm = abs(dot(norm, halfDir));
		float geomTerm = abs(dot(norm, lightDir));
		// float phongTerm = max(dot(norm, halfDir), 0.0);
		// float geomTerm = max(dot(norm, lightDir), 0.0);

		// Default swhite diffuse/specular
		vec3 diffuseColor = vec3(1.0,1.0,1.0);
		vec3 specularColor = vec3(1.0, 1.0, 1.0);
		vec3 isoColor = vec3(1.0, 0.0, 1.0);

		//TODO: rewrite these as separate shader programs instead with no branching
		// Will need to make sure to set uniforms across all programs wherever happens, or have some struct with each unif, and
		// then set them in each draw call; OR, set them for every single program whenever it happens, just iterate progs and set for all

		float LOW = isoValue - tolerance; //0.001;
		float HIGH = isoValue + tolerance; //0.001;
		
		if(colorMode == COLOR_NORMAL){
			vec3 normAbs = abs(norm);
			diffuseColor = normAbs;
		}
		else if(colorMode == COLOR_HEIGHT){
			// Set color based on height
			float heightProportion = (heightOut - minHeight) / (maxHeight - minHeight);
			diffuseColor = heightProportion * vec3(0.96, 0.7, 0.05); //TODO: mix with white/gray? as alpha blend
			if (heightOut > LOW && heightOut < HIGH){
				diffuseColor = isoColor;
			}
		}
		else if(colorMode == COLOR_ISOSURFACE){
			// float CENTER = (HIGH + LOW) / 2.0;
			// float RANGE = (HIGH - LOW) / 2.0;
			diffuseColor = isoColor;
			if (heightOut < LOW || heightOut > HIGH){
				discard;
			}
		}
		else if(colorMode == COLOR_SUPERLEVEL){
			diffuseColor = vec3(0.0, 1.0, 0.0);
			if (heightOut < isoValue){
				discard;
			}
		}
		else if(colorMode == COLOR_SUBLEVEL){
			diffuseColor = vec3(1.0, 0.0, 0.0);
			if (heightOut > isoValue){
				discard;
			}
		}
		else if(colorMode == COLOR_COMBINED){
			if (heightOut > isoValue){
				// Superlevel
				diffuseColor = vec3(0.0, 1.0, 0.0);
			} else {
				// Sublevel
				diffuseColor = vec3(1.0, 0.0, 0.0);
			}
			// Isosurface
			if (heightOut > LOW && heightOut < HIGH){
				diffuseColor = isoColor;
			}
		}

		//temp - this is neat, make it a toggle
		// float LOW = (maxHeight + minHeight) / 2.0 - 0.05;
		// float HIGH = LOW + 0.10;
		// float CENTER = (HIGH + LOW) / 2.0;
		// float RANGE = (HIGH - LOW) / 2.0;
		// if (heightOut < LOW || heightOut > HIGH){
		// 	discard;
		// }
		//endtemp

		
		// If texture, replace the diffuseColor
		if(showTexture){
			diffuseColor = vec3(texture2D(texture, texCoord));
		}

		// Blinn-Phong reflection model
		vec3 color = lightIntensity * (geomTerm * diffuseColor + specularColor*pow(phongTerm, shiny) + ambientStrength * diffuseColor);

		gl_FragColor = vec4(color, 1.0);
	}
`;

// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle

	// Add force due to gravity
	forces.fill(gravity.mul(particleMass));

	// Compute spring and damping forces
	for(let i = 0; i < springs.length; i++){
		var spring = springs[i];
		// Spring
		// F_s=k(l-l_r)d
		// l=|x_1-x_0|
		// d=(x_1-x_0)/l
		// F_1s = - F_0s
		var pos0 = positions[spring.p0];
		var pos1 = positions[spring.p1];
		var lRest = spring.rest;

		var posDif = pos1.sub(pos0);
		var l = posDif.len();
		var dHat = posDif.div(l);
		var lDif = l - lRest;

		var springForce = dHat.mul(lDif).mul(stiffness);

		// Damping
		// F_d=k(dl/dt)d
		// dl/dt=(v_1-v_0).d
		// d = (x_1-x_0)/l
		
		var velDif = velocities[spring.p0].sub(velocities[spring.p1]);
		var lDot = velDif.dot(dHat);

		// Damp force in opposite direction
		var dampForce = dHat.mul(lDot).mul(damping).mul(-1);

		// Apply forces
		var f0 = springForce.add(dampForce);
		var f1 = f0.mul(-1);

		// not sure why this doesn't work
		// forces[spring.p0].inc(f0);
		// forces[spring.p1].inc(f1);
		forces[spring.p0] = forces[spring.p0].add(f0);
		forces[spring.p1] = forces[spring.p1].add(f1);
	}

	// Update positions and velocities with new forces
	// Using implicit Euler
	// a_t=F_t/m
	// v_t+dt=v_t + dt*a_t
	// x_t+dt = x_t + dt*v_t+dt

	for(let i = 0; i < forces.length; i++){
		var accel = forces[i].div(particleMass);

		velocities[i].inc(accel.mul(dt));
		positions[i].inc(velocities[i].mul(dt));
	}
	
	// Handle collisions

	// Check each face for intersections on each particle
	for(let i = 0; i < positions.length; i++){
		var pos = positions[i];
		var vel = velocities[i];
	

		var xIntercept = pos.x < -1 ? -1 : (pos.x > 1 ? 1 : 0);
		// var yIntercept = pos.y < -1 ? -1 : (pos.y > 1 ? 1 : 0);
		var yIntercept = pos.y < -0.6 ? -0.6 : (pos.y > 1 ? 1 : 0);
		var zIntercept = pos.z < -1 ? -1 : (pos.z > 1 ? 1 : 0);

		// p_x'=plane-h'
		// h'=rh
		// h=p_x-z

		// x-bounds
		if(xIntercept != 0){
			
			var h = pos.x-xIntercept;
			var hPrime = restitution * h;
			pos.x = xIntercept-hPrime;
			vel.x = -restitution * vel.x;
		}

		// y-bounds
		if(yIntercept != 0){
			var h = pos.y-yIntercept;
			var hPrime = restitution * h;
			pos.y = yIntercept-hPrime;
			vel.y = -restitution * vel.y;
		}

		// z-bounds
		if(zIntercept != 0){
			var h = pos.z-zIntercept;
			var hPrime = restitution * h;
			pos.z = zIntercept-hPrime;
			vel.z = -restitution * vel.z;
		}
	}


}

