// define a color palette
var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
};

var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, renderer, container;
var HEIGHT, WIDTH, mousePos = {
    x: 0,
    y: 0
};

var collidables = [];

function init() {
	// set up the scene, the camera and the renderer
	createScene();
	window.scene = scene;
	window.THREE = THREE;
	// add the lights
	createLights();
	// add the objects
	createSea();
	createSky();
	ship = createShip();
	scene.add(ship);
	createBullets();
	document.addEventListener('mousemove', handleMouseMove, false);
	document.addEventListener('click', handleClick, false);
	// start a loop that will update the objects' positions 
	// and render the scene on each frame
	loop();
}

function createScene() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	scene = new THREE.Scene();
	// Add a fog effect to the scene; same color as the background color used in the style sheet
	scene.fog = new THREE.Fog(0x000064, 200, 950);
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 60;
	nearPlane = 1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
	);
	camera.position.x = 0;
	camera.position.z = 200;
	camera.position.y = 100;
	renderer = new THREE.WebGLRenderer({ 
		// Allow transparency to show the gradient background
		alpha: true, 
		antialias: true 
	});
	renderer.setSize(WIDTH, HEIGHT);
	renderer.shadowMap.enabled = true;
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);
	window.addEventListener('resize', handleWindowResize, false);
}

var hemisphereLight, shadowLight;

function createLights() {
	// A hemisphere light is a gradient colored light; 
	// the first parameter is the sky color, the second parameter is the ground color, 
	// the third parameter is the intensity of the light
	hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
	// A directional light shines from a specific direction. 
	// It acts like the sun, that means that all the rays produced are parallel. 
	shadowLight = new THREE.DirectionalLight(0xffffff, .9);
	// Set the direction of the light  
	shadowLight.position.set(150, 350, 350);
	// Allow shadow casting 
	shadowLight.castShadow = true;
	// define the visible area of the projected shadow
	shadowLight.shadow.camera.left = -400;
	shadowLight.shadow.camera.right = 400;
	shadowLight.shadow.camera.top = 400;
	shadowLight.shadow.camera.bottom = -400;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;
	// define the resolution of the shadow; the higher the better, 
	// but also the more expensive and less performant
	shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;

	// an ambient light modifies the global color of a scene and makes the shadows softer
	// ambientLight = new THREE.AmbientLight(0xdc8874, .5);
	// scene.add(ambientLight);
	// to activate the lights, just add them to the scene
	scene.add(hemisphereLight);  
	scene.add(shadowLight);
}

var mousePos={x:0, y:0};

function handleClick(event) {
	bullets.fire();
}

// now handle the mousemove event

function handleMouseMove(event) {

	// here we are converting the mouse position value received 
	// to a normalized value varying between -1 and 1;
	// this is the formula for the horizontal axis:
	
	var tx = -1 + (event.clientX / WIDTH)*2;
	var ox = event.clientX - WIDTH/2;

	// for the vertical axis, we need to inverse the formula 
	// because the 2D y-axis goes the opposite direction of the 3D y-axis
	
	var ty = 1 - (event.clientY / HEIGHT)*2;
	var oy = - (event.clientY - HEIGHT);
	mousePos = {x:ox, y:oy/2};
}

var shipBounds = {
	maxx: 150, 
	minx: -150,
	maxy: 150,
	miny: 40
}

function updateShip(){
	var targetX = mousePos.x/2;
	var targetY = mousePos.y/2;

	if (targetX > shipBounds.maxx) targetX = shipBounds.maxx;
	else if (targetX < shipBounds.minx) targetX = shipBounds.minx;
	if (targetY > shipBounds.maxy) targetY = shipBounds.maxy;
	else if (targetY < shipBounds.miny) targetY = shipBounds.miny;

	ship.position.y += (targetY - ship.position.y)*0.2;
	ship.position.x += (targetX - ship.position.x)*0.2;

	ship.rotation.x = (targetY-ship.position.y)*0.0128;
	ship.rotation.z = (ship.position.x-targetX)*0.0064;
}

var ship,fire;

function createShip() {
	var container = new THREE.Object3D();
	var fireMaterial = new THREE.SpriteMaterial( { map: generateSprite(), fog: true } );
	var sprite = new THREE.Sprite( fireMaterial );
	sprite.position.set( 0, 10.5, 40 );
	sprite.scale.set( 64, 64, 1.0 ); // imageWidth, imageHeight
	container.add( sprite );


	function generateSprite() {
        var canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;

        var context = canvas.getContext('2d');
        var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,0,1)');
        gradient.addColorStop(0.4, 'rgba(155,55,0,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;

    }


	var onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round(percentComplete, 2) + '% downloaded' );
		}
	};
	var onError = function ( xhr ) { };

	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setPath( './' );
	mtlLoader.load('shape_cube.mtl', function( materials ) {

		materials.preload();

		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials( materials );
		objLoader.setPath( './' );
		objLoader.load( 'shape_cube.obj', function ( object ) {
			scene.add( object );
			object.rotation.y = Math.PI;
			object.rotation.z = Math.PI/2;
			object.rotation.x = Math.PI/2;
			var s = 0.5;
			object.scale.z = s;
			object.scale.y = s;
			object.scale.x = s;
			for (var i = object.children.length - 1; i >= 0; i--) {
				object.children[i].castShadow = true;
			}
			container.add(object);

		}, onProgress, onError );
	});

	return container;
}

// First let's define a Sea object :
Sea = function(){
	var geom = new THREE.SphereGeometry(700,30,30);
	// rotate the geometry on the x axis
	// geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

	// important: by merging vertices we ensure the continuity of the waves
	geom.mergeVertices();

	this.waves = [];
	for (var i=0; i<geom.vertices.length; i++){
		// get each vertex
		var v = geom.vertices[i];

		// store some data associated to it
		this.waves.push({y:v.y,
						 x:v.x,
						 z:v.z,
						 // a random angle
						 ang:Math.random()*Math.PI*2,
						 // a random distance
						 amp:5 + Math.random()*15,
						 // a random speed between 0.016 and 0.048 radians / frame
						 speed:0.016 + Math.random()*0.032
						});
	};

	var mat = new THREE.MeshPhongMaterial({
		color:Colors.blue,
		transparent:true,
		opacity:.8,
		shading:THREE.FlatShading,
	});
	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.receiveShadow = true; 
}

Sea.prototype.moveWaves = function (){
	// get the vertices
	var verts = this.mesh.geometry.vertices;
	
	for (var i=0; i<verts.length; i++){
		var v = verts[i];
		// get the data associated to it
		var vprops = this.waves[i];
		// update the position of the vertex
		v.x = vprops.x + Math.cos(vprops.ang)*vprops.amp;
		v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
		// increment the angle for the next frame
		vprops.ang += vprops.speed;
	}

	// Tell the renderer that the geometry of the sea has changed.
	// In fact, in order to maintain the best level of performance, 
	// three.js caches the geometries and ignores any changes
	// unless we add this line
	this.mesh.geometry.verticesNeedUpdate=true;
	sea.mesh.rotation.x += .005;
}

// Instantiate the sea and add it to the scene:

var sea;

function createSea(){
	sea = new Sea();
	sea.name = "sea";
	// push it a little bit at the bottom of the scene
	sea.mesh.position.y = -650;
	sea.mesh.rotation.z = Math.PI/2;
	// add the mesh of the sea to the scene
	scene.add(sea.mesh);
}

Cloud = function(){
	// Create an empty container that will hold the different parts of the cloud
	this.mesh = new THREE.Object3D();
	// create a cube geometry;
	// this shape will be duplicated to create the cloud
	var geom = new THREE.BoxGeometry(20,20,20);
	// create a material; a simple white material will do the trick
	var mat = new THREE.MeshPhongMaterial({
		color:Colors.white,  
	});
	// duplicate the geometry a random number of times
	var nBlocs = 3+Math.floor(Math.random()*3);
	for (var i=0; i<nBlocs; i++ ){	
		// create the mesh by cloning the geometry
		var m = new THREE.Mesh(geom, mat); 
		collidables.push(m);
		// set the position and the rotation of each cube randomly
		m.position.x = i*15;
		m.position.y = Math.random()*10;
		m.position.z = Math.random()*10;
		m.rotation.z = Math.random()*Math.PI*2;
		m.rotation.y = Math.random()*Math.PI*2;
		// set the size of the cube randomly
		var s = .1 + Math.random()*.9;
		m.scale.set(s,s,s);
		// allow each cube to cast and to receive shadows
		m.castShadow = true;
		m.receiveShadow = true;
		// add the cube to the container we first created
		this.mesh.add(m);
	} 
}

// Define a Sky Object
Sky = function(){
	this.mesh = new THREE.Object3D();
	// choose a number of clouds to be scattered in the sky
	this.nClouds = 30;
	// To distribute the clouds consistently,
	// we need to place them according to a uniform angle
	var stepAngle = Math.PI*2 / this.nClouds;
	// create the clouds
	for(var i=0; i<this.nClouds; i++){
		var c = new Cloud();
		// set the rotation and the position of each cloud;
		// for that we use a bit of trigonometry
		var a = stepAngle*i; // this is the final angle of the cloud
		var h = 600 + Math.random()*200; // this is the distance between the center of the axis and the cloud itself
		// we are converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
		c.mesh.position.y = Math.sin(a)*h;
		//c.mesh.position.x = Math.cos(a)*h;
		c.mesh.position.z = Math.cos(a)*h;
		// rotate the cloud according to its position
		c.mesh.rotation.z = a + Math.PI/2;
		c.mesh.position.x = -200 + Math.random()*400;
		// we also set a random scale for each cloud
		var s = 1+Math.random()*2;
		c.mesh.scale.set(s,s,s);
		this.mesh.add(c.mesh);  
	}  
}

// Now we instantiate the sky and push its center a bit
// towards the bottom of the screen
var sky;

function createSky(){
	sky = new Sky();
	sky.mesh.position.y = -550;
	scene.add(sky.mesh);
}

var Bullets = function() {
    var geom = new THREE.Geometry();   
    var material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 50,
        transparent: true,
        blending: THREE.AdditiveBlending,
        //visible: false,
        map: generateSprite()
    });

    this.caster = new THREE.Raycaster();
    this.movingBullets = []; // store data about each bullet (a vertex)
    this.data = [];
    this.num_bullets = 20;
    this.ttl = 200;
    this.available = this.num_bullets;
    this.nextBullet = 0; // which bullet to fire next
    for (var i = 0; i < this.num_bullets; i++) {
        var particle = new THREE.Vector3(0, -2110, -9000);
        geom.vertices.push(particle);
        var color = new THREE.Color(0x00ff00);
        color.setHSL(color.getHSL().h, color.getHSL().s, Math.random() * color.getHSL().l);
        geom.colors.push(color);
        this.data.push({ttl:this.ttl});
    }
    
    this.points = new THREE.Points(geom, material);
    this.points.name = "particles";

    function generateSprite() {

        var canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;

        var context = canvas.getContext('2d');
        var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,0,0,1)');
        gradient.addColorStop(0.4, 'rgba(155,0,0,0.8)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;

    }
}
var collisions;
Bullets.prototype.update = function() {
	var verts = this.points.geometry.vertices;
	var newMovingBullets = [];
	for (var i = this.movingBullets.length - 1; i >= 0; i--) {
		var id = this.movingBullets[i];
		verts[id].z -= 10;
		this.data[id].ttl -= 1;

		// detect collisions
		this.caster.set(verts[id], new THREE.Vector3(0, 0, -1));
		collisions = this.caster.intersectObjects(collidables);
		if (collisions.length > 0 && collisions[0].distance <= 11) {
			console.log(collisions[0]);

			//	remove the obstacle
			var obj = collisions[0].object;
			if (obj.parent != null) obj.parent.remove(obj);

			this.available += 1;
			verts[id].z = -9000;
			verts[id].y = -2110;
		}
		else if (this.data[id].ttl >= 0)
			newMovingBullets.push(id);
		else {
			this.available += 1;
			verts[id].z = -9000;
			verts[id].y = -2110;
		}
	}
	this.movingBullets = newMovingBullets;
	this.points.geometry.verticesNeedUpdate = true;
}

Bullets.prototype.fire = function() {
	if (this.available > 0) {
		var verts = this.points.geometry.vertices;
		// fire nextBullet
		verts[this.nextBullet].x = ship.position.x;
		verts[this.nextBullet].y = ship.position.y + 10.5;
		verts[this.nextBullet].z = ship.position.z;
		this.data[this.nextBullet].ttl = this.ttl; 
		this.movingBullets.push(this.nextBullet);
		this.nextBullet = (this.nextBullet + 1) % this.num_bullets;
		this.available -= 1;
	}
	this.points.geometry.verticesNeedUpdate = true;
}

Bullets.prototype.collision = function() {

}
 
var bullets; 

function createBullets() {
	bullets = new Bullets();
	scene.add(bullets.points);
}

function loop() {
    // updatePlane();
    sea.moveWaves();
    sky.mesh.rotation.z += .001;
    sky.mesh.rotation.x += .005;
    updateShip();
    bullets.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}


function handleWindowResize() {
	// update height and width of the renderer and the camera
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}

window.addEventListener('load', init, false);