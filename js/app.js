import * as THREE from "https://cdn.skypack.dev/three@v0.133.1";

import { OrbitControls } from "https://cdn.skypack.dev/three@v0.133.1/examples/jsm/controls/OrbitControls.js";

let scene, renderer, camera, controls, pointlight, ambientlight;
let cube;

function init() {
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );

  controls = new OrbitControls(camera, renderer.domElement);
  //camera.position.set(800, 200, -500);
  camera.position.set(940, 40, -245);

  // Set the center of pivot for the orbit at volume centroid
  controls.target.set(493, 0, -233);

  controls.update();
  addLight();

  initialSettings();
}

function addLight() {
  pointlight = new THREE.PointLight(0xffffff, 1);
  pointlight.position.set(600, 600, 600);

  scene.add(pointlight);

  const light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(light);
}

let mesh;
let modelPath = "./models/json/model_ptrom_joined.json";
function loadExt() {
  var loader = new THREE.ObjectLoader();
  loader.load(modelPath, function (object) {
    // if you want to add your custom material
    var materialObj = new THREE.MeshStandardMaterial({
      color: new THREE.Color("DarkSlateGray"),
    });

    // var materialObj = new THREE.MeshNormalMaterial();
    object.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = materialObj;
      }
    });

    // then directly add the object
    scene.add(object);
  });
}

let arr = [];
let ptcloud, material;
function csvToArray(str, delimiter = ";") {
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  // return the array
  return arr;
}

let threshold, treedist, arrViz;
function createXYZRGB(arr, viz) {
  scene.remove(ptcloud);

  arrViz = [];
  if (viz == "viz100") {
    for (let i = 0; i < arr.length; i++) {
      arrViz.push(arr[i].viz100);
    }
  } else if (viz == "viz50") {
    for (let i = 0; i < arr.length; i++) {
      arrViz.push(arr[i].viz50);
    }
  }

  filterVals();
}

function filterVals() {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];

  const color = new THREE.Color();

  for (let i = 0; i < arr.length; i++) {
    if (
      parseInt(arrViz[i]) >= threshold[0] &&
      parseInt(arrViz[i]) <= threshold[1] &&
      parseInt(arr[i].treedist) >= treedist[0] &&
      parseInt(arr[i].treedist) <= treedist[1]
    ) {
      // positions
      const x = parseFloat(arr[i].X);
      const y = parseFloat(arr[i].Y);
      const z = parseFloat(arr[i].Z);

      positions.push(x, y, z);

      // colors
      const R = arr[i].R;
      const G = arr[i].G;
      const B = arr[i].B;

      color.setRGB(R, G, B);
      colors.push(color.r, color.g, color.b);
    }
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  geom.computeBoundingSphere();

  let material = new THREE.PointsMaterial({ size: 5, vertexColors: true });
  ptcloud = new THREE.Points(geom, material);
  scene.add(ptcloud);

  sizeSlider.noUiSlider.on("update", function (values) {
    scene.remove(ptcloud);
    let inputSize = parseInt(values[0]);
    //console.log(inputSize);

    material = new THREE.PointsMaterial({
      vertexColors: true,
      size: inputSize,
    });
    ptcloud = new THREE.Points(geom, material);
    scene.add(ptcloud);
  });

  return geom;
}

let ptcloudpath = "models/csv/ptcloud_100m.csv";

let viz = "viz100";
async function fetchText(url, viz) {
  scene.remove(ptcloud);

  let response = await fetch(url);
  let data = await response.text();

  let csv = csvToArray(data);

  btn50.addEventListener("change", function (event) {
    viz = event.target.value;
    scene.remove(ptcloud);
    console.log(viz);
    createXYZRGB(csv, viz);
  });

  btn100.addEventListener("change", function (event) {
    viz = event.target.value;
    scene.remove(ptcloud);
    console.log(viz);
    createXYZRGB(csv, viz);
  });

  createXYZRGB(csv, viz);
}

function render() {
  requestAnimationFrame(render);

  controls.update();

  renderer.render(scene, camera);
}

// ------------------------- UI
let sizeSlider = document.getElementById("slider-connect");
noUiSlider.create(sizeSlider, {
  start: 5,
  connect: "lower",
  range: {
    min: 1,
    max: 10,
  },
});

let filterSlider = document.getElementById("slider-range-vals");
noUiSlider.create(filterSlider, {
  start: [0, 4000],
  connect: true,
  behaviour: "drag",
  range: {
    min: 0,
    max: 4000,
  },
  pips: { mode: "count", values: 4 },
});

let treeSlider = document.getElementById("slider-range-tree");
noUiSlider.create(treeSlider, {
  start: [0, 180],
  connect: true,
  behaviour: "drag",
  range: {
    min: 0,
    max: 180,
  },
});

let btn50 = document.getElementById("btn50");
let btn100 = document.getElementById("btn100");

init();
loadExt();
fetchText(ptcloudpath, viz);
render();

filterSlider.noUiSlider.on("update", function (values) {
  threshold = values;
  scene.remove(ptcloud);
  filterVals();
});
treeSlider.noUiSlider.on("update", function (values) {
  treedist = values;
  scene.remove(ptcloud);
  filterVals();
});

function initialSettings() {
  threshold = filterSlider.noUiSlider.get();
  treedist = treeSlider.noUiSlider.get();
  viz = "viz100";
}
