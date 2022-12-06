import "./style.css";

// import "three";
// import "./build/ar-threex.js";
// THREEx.ArToolkitContext.baseURL = "../";

//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////

const cameraParam = "./camera_para.dat";
const patternUrl = "./pattern-marker.patt";
var arToolkitSource, arToolkitContext, arMarkerControls;

// init renderer
var renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setClearColor(new THREE.Color("lightgrey"), 0);
renderer.setSize(640, 480);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0px";
renderer.domElement.style.left = "0px";
document.body.appendChild(renderer.domElement);

// array of functions for the rendering loop
var onRenderFcts = [];

// init scene and camera
var scene = new THREE.Scene();

//////////////////////////////////////////////////////////////////////////////////
//		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
var camera = new THREE.Camera();
scene.add(camera);

////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

arToolkitSource = new THREEx.ArToolkitSource({
  // to read from the webcam
  sourceType: "webcam",
  sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
  sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
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
  });

  window.arToolkitSource = arToolkitSource;
});
////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////
function initARContext() {
  console.log("initARContext()");

  // CONTEXT
  arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: cameraParam,
    detectionMode: "mono_and_matrix",
    matrixCodeType: "3x3",
    patternRatio: 0.5,

    // canvasWidth: arToolkitSource.domElement.videoWidth,
    // canvasHeight: arToolkitSource.domElement.videoHeight
  });

  arToolkitContext.init(() => {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());

    arToolkitContext.arController.orientation = getSourceOrientation();
    arToolkitContext.arController.options.orientation = getSourceOrientation();

    console.log("arToolkitContext", arToolkitContext);
    window.arToolkitContext = arToolkitContext;
  });

  // MARKER
  arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
    type: "pattern",
    patternUrl,
    smooth: true,
    changeMatrixMode: "cameraTransformMatrix",
  });

  console.log("ArMarkerControls", arMarkerControls);
  window.arMarkerControls = arMarkerControls;
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
  if (window.arToolkitContext.arController !== null) {
    arToolkitSource.copyElementSizeTo(
      window.arToolkitContext.arController.canvas
    );
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

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

// add a simple box
var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshNormalMaterial({
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
});
var mesh = new THREE.Mesh(geometry, material);
mesh.position.y = geometry.parameters.height / 2;
scene.add(mesh);

// add a torus knot
var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
var material = new THREE.MeshNormalMaterial();
var mesh = new THREE.Mesh(geometry, material);
mesh.position.y = 0.5;
scene.add(mesh);

onRenderFcts.push(function (delta) {
  mesh.rotation.x += Math.PI * delta;
});

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(function () {
  renderer.render(scene, camera);
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
// import ARToolkit from "@ar-js-org/artoolkit5-js";
// import "@ar-js-org/ar.js";

// window.onload = () => {
//   console.log("ARController", window.ARThreeOnLoad);
//   window.ARThreeOnLoad = function () {
//     ARController.getUserMediaThreeScene({
//       maxARVideoSize: 320,
//       cameraParam: "/camera_para-iPhone 5 rear 640x480 1.0m.dat",
//       onSuccess: function (arScene, arController, arCamera) {
//         document.body.className = arController.orientation;

//         console.log("arController", arController);

//         var renderer = new THREE.WebGLRenderer({ antialias: true });
//         if (arController.orientation === "portrait") {
//           var w =
//             (window.innerWidth / arController.videoHeight) *
//             arController.videoWidth;
//           var h = window.innerWidth;
//           renderer.setSize(w, h);
//           renderer.domElement.style.paddingBottom = w - h + "px";
//         } else {
//           if (/Android|mobile|iPad|iPhone/i.test(navigator.userAgent)) {
//             renderer.setSize(
//               window.innerWidth,
//               (window.innerWidth / arController.videoWidth) *
//                 arController.videoHeight
//             );
//           } else {
//             renderer.setSize(arController.videoWidth, arController.videoHeight);
//             document.body.className += " desktop";
//           }
//         }

//         document.body.insertBefore(
//           renderer.domElement,
//           document.body.firstChild
//         );

//         var rotationV = 0;
//         var rotationTarget = 0;

//         renderer.domElement.addEventListener(
//           "click",
//           function (ev) {
//             ev.preventDefault();
//             rotationTarget += 1;
//           },
//           false
//         );

//         var sphere = new THREE.Mesh(
//           new THREE.SphereGeometry(0.5, 8, 8),
//           new THREE.MeshNormalMaterial()
//         );
//         sphere.material.flatShading;
//         sphere.position.z = 0.5;

//         var torus = new THREE.Mesh(
//           new THREE.TorusGeometry(0.3, 0.2, 8, 8),
//           new THREE.MeshNormalMaterial()
//         );
//         torus.material.flatShading;
//         torus.position.z = 0.5;
//         torus.rotation.x = Math.PI / 2;

//         arController.loadMarker("/pattern-marker.patt", function (markerId) {
//           var markerRoot = arController.createThreeMarker(markerId);
//           markerRoot.add(sphere);
//           arScene.scene.add(markerRoot);
//         });

//         arController.loadMarker("Data/patt.kanji", function (markerId) {
//           var markerRoot = arController.createThreeMarker(markerId);
//           markerRoot.add(torus);
//           arScene.scene.add(markerRoot);
//         });

//         var tick = function () {
//           arScene.process();

//           rotationV += (rotationTarget - sphere.rotation.z) * 0.05;
//           sphere.rotation.z += rotationV;
//           torus.rotation.y += rotationV;
//           rotationV *= 0.8;

//           arScene.renderOn(renderer);
//           requestAnimationFrame(tick);
//         };

//         tick();
//       },
//     });

//     delete window.ARThreeOnLoad;
//   };

//   if (window.ARController && ARController.getUserMediaThreeScene) {
//     ARThreeOnLoad();
//   }
// };
