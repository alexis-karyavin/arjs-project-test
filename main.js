import "./style.css";

//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////

const width = window.innerWidth;
const height = window.innerHeight;

const cameraParam = "./camera_para.dat";
const patternUrl = "./pattern-marker.patt";
const modelGltf = "./model/scene.gltf";

// array of functions for the rendering loop
var onRenderFcts = [];
var arToolkitContext, artoolkitMarker, markerRoot, arToolkitSource;

// init renderer
// init renderer
var renderer = new THREE.WebGLRenderer({
  // antialias	: true,
  alpha: true,
});
renderer.setClearColor(new THREE.Color("lightgrey"), 0);
// renderer.setPixelRatio( 1/2 );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0px";
renderer.domElement.style.left = "0px";
document.body.appendChild(renderer.domElement);

// init scene and camera
var scene = new THREE.Scene();

//////////////////////////////////////////////////////////////////////////////////
//		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
var camera = new THREE.Camera();
scene.add(camera);

var light = new THREE.AmbientLight(0xffffff);
scene.add(light);

markerRoot = new THREE.Group();
scene.add(markerRoot);

////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

arToolkitSource = new THREEx.ArToolkitSource({
  // to read from the webcam
  sourceType: "webcam",
  // sourceWidth: width,
  // sourceHeight: height,
  // displayWidth: width,
  // displayHeight: height,
});

arToolkitSource.init(() => {
  arToolkitSource.domElement.addEventListener("canplay", () => {
    console.log(
      "canplay",
      "actual source dimensions",
      arToolkitSource.domElement.videoWidth,
      arToolkitSource.domElement.videoHeight
    );

    initARContext();
    onResize();
  });

  window.arToolkitSource = arToolkitSource;
});
////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////
function initARContext() {
  // CONTEXT
  console.log("initARContext()");

  arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: cameraParam,
    detectionMode: "mono",
    maxDetectionRate: 30,
    canvasWidth: 80 * 3,
    canvasHeight: 60 * 3,
  });
  // initialize it
  arToolkitContext.init(function onCompleted() {
    // copy projection matrix to camera
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    arToolkitContext.arController.orientation = getSourceOrientation();
    arToolkitContext.arController.options.orientation = getSourceOrientation();

    console.log("arToolkitContext", arToolkitContext);
    window.arToolkitContext = arToolkitContext;
  });
  artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: "pattern",
    patternUrl,
    // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji'
  });
}

function getSourceOrientation() {
  if (!arToolkitSource) {
    return null;
  }

  console.log(
    "actual source dimensions",
    arToolkitSource.domElement.videoWidth,
    arToolkitSource.domElement.videoHeight
  );

  if (
    arToolkitSource.domElement.videoWidth >
    arToolkitSource.domElement.videoHeight
  ) {
    console.log("source orientation", "landscape");
    return "landscape";
  } else {
    console.log("source orientation", "portrait");
    return "portrait";
  }
}

function disposeARSource() {
  console.log("disposeARSource()");

  const video = document.querySelector("#arjs-video");

  if (video) {
    video?.srcObject?.getTracks().map((track) => track.stop());
    video.remove();
  }

  arToolkitSource = null;
}

function disposeARContext() {
  console.log("disposeARContext()");

  if (arToolkitContext?.arController?.cameraParam?.dispose) {
    arToolkitContext.arController.cameraParam.dispose();
  }

  if (arToolkitContext?.arController?.dispose) {
    arToolkitContext.arController.dispose();
  }

  arToolkitContext = null;
}

// handle resize
window.addEventListener("resize", function () {
  onResize();
});

function onResize() {
  arToolkitSource.onResizeElement();
  arToolkitSource.copyElementSizeTo(renderer.domElement);
  if (arToolkitContext.arController !== null) {
    arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
  }
}

window.close = function () {
  disposeARContext();
  disposeARSource();
};

// update artoolkit on every frame
onRenderFcts.push(function () {
  if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
    return;
  }

  arToolkitContext.update(arToolkitSource.domElement);

  // update scene.visible if the marker is seen
  scene.visible = camera.visible;
});

// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false;

////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

// var markerRoot = new THREE.Group();
// scene.add(markerRoot);

// build a smoothedControls
var smoothedRoot = new THREE.Group();
scene.add(smoothedRoot);
var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
  lerpPosition: 0.4,
  lerpQuaternion: 0.3,
  lerpScale: 1,
});
onRenderFcts.push(function (delta) {
  smoothedControls.update(markerRoot);
});

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

var arWorldRoot = smoothedRoot;

const loader = new THREE.GLTFLoader();

const gltf = await loader.loadAsync(modelGltf);
const model3D = gltf.scene.children[0].children[0];

const mesh = [...model3D.children];
mesh.forEach((item) => {
  item.rotation.z = 0;
  item.rotation.y = 0;
  item.rotation.x = 30;

  item.scale.set(0.25, 0.25, 0.25);
});

arWorldRoot.add(...model3D.children);

// add a torus knot
// var geometry = new THREE.BoxGeometry(1, 1, 1);
// var material = new THREE.MeshNormalMaterial({
//   transparent: true,
//   opacity: 0.5,
//   side: THREE.DoubleSide,
// });
// var mesh = new THREE.Mesh(geometry, material);
// mesh.position.y = geometry.parameters.height / 2;
// arWorldRoot.add(mesh);

// var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
// var material = new THREE.MeshNormalMaterial();
// var mesh = new THREE.Mesh(geometry, material);
// mesh.position.y = 0.5;
// arWorldRoot.add(mesh);

// onRenderFcts.push(function () {
//   mesh.rotation.x += 0.1;
// });

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// var stats = new Stats();
// document.body.appendChild(stats.dom);
// // render the scene
onRenderFcts.push(function () {
  renderer.render(scene, camera);
  // stats.update();
});

// run the rendering loop
var lastTimeMsec = null;
requestAnimationFrame(function animate(nowMsec) {
  // keep looping
  requestAnimationFrame(animate);
  // measure time
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
  var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
  lastTimeMsec = nowMsec;
  // call each update function
  onRenderFcts.forEach(function (onRenderFct) {
    onRenderFct(deltaMsec / 1000, nowMsec / 1000);
  });
});
