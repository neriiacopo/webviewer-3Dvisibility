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
  const arr = rows.map(function (row) {
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

function createXYZRGB(arr) {
  const geometry = new THREE.BufferGeometry();

  let voxelsize = sizeSlider.noUiSlider.get();

  const threshold = [0, 4000];
  function filterVals(arr, limit) {
    scene.remove(ptcloud);

    const positions = [];
    const colors = [];
    const vals100 = [];

    const color = new THREE.Color();
    let limits = [parseInt(limit[0]), parseInt(limit[1])];

    for (let i = 0; i < arr.length; i++) {
      if (
        parseInt(arr[i].viz100) > limits[0] &&
        parseInt(arr[i].viz100) < limits[1]
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

        // values
        const val100 = arr[i].viz100;
        vals100.push(val100);
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();

    let material = new THREE.PointsMaterial({ size: 5, vertexColors: true });
    ptcloud = new THREE.Points(geometry, material);
    scene.add(ptcloud);

    sizeSlider.noUiSlider.on("update", function (values) {
      scene.remove(ptcloud);
      let inputSize = parseInt(values[0]);
      console.log(inputSize);

      material = new THREE.PointsMaterial({
        vertexColors: true,
        size: inputSize,
      });
      ptcloud = new THREE.Points(geometry, material);
      scene.add(ptcloud);
    });
  }

  filterVals(arr, threshold);

  filterSlider.noUiSlider.on("update", function (values) {
    let valuesInt = [parseInt(values[0]), parseInt(values[1])];
    console.log(valuesInt);
    filterVals(arr, values);
  });
}

const ptcloudpath = "models/csv/ptcloud_100m.csv";
async function fetchText(url) {
  let response = await fetch(url);
  let data = await response.text();

  let csv = csvToArray(data);

  createXYZRGB(csv);
}

function render() {
  requestAnimationFrame(render);

  controls.update();

  renderer.render(scene, camera);
}

init();
loadExt();
fetchText(ptcloudpath);
render();

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
});

let treeSlider = document.getElementById("slider-range-vals");
noUiSlider.create(treeSlider, {
  start: [0, 4000],
  connect: true,
  behaviour: "drag",
  range: {
    min: 0,
    max: 180,
  },
});
