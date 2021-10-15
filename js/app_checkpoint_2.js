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

  addTestCube();
  addLight();
}

function addLight() {
  pointlight = new THREE.PointLight(0xffffff, 1);
  pointlight.position.set(600, 600, 600);

  scene.add(pointlight);

  const light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(light);
}

function addTestCube() {
  // cube
  cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );

  scene.add(cube);
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

loadExt();

let ptcloud;
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
  const particles = arr.length;

  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const colors = [];

  const color = new THREE.Color();

  for (let i = 0; i < particles; i++) {
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

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  geometry.computeBoundingSphere();

  let material = new THREE.PointsMaterial({ size: 5, vertexColors: true });

  let connectSlider = document.getElementById("slider-connect");

  noUiSlider.create(connectSlider, {
    start: 5,
    connect: "lower",
    range: {
      min: 1,
      max: 10,
    },
  });

  connectSlider.addEventListener("click", function updatePtCloud() {
    scene.remove(ptcloud);
    //inputSize = connectSlider.noUiSlider.get();
    let inputSize = parseInt(connectSlider.noUiSlider.get());
    material = new THREE.PointsMaterial({
      vertexColors: true,
      size: inputSize,
    });
    ptcloud = new THREE.Points(geometry, material);
    scene.add(ptcloud);
  });

  ptcloud = new THREE.Points(geometry, material);
  scene.add(ptcloud);
}

async function fetchText(url) {
  let response = await fetch(url);
  let data = await response.text();

  let csv = csvToArray(data);
  //console.log(csv);
  createXYZRGB(csv);
}

let test = fetchText("./models/csv/test.csv");

function render() {
  requestAnimationFrame(render);

  controls.update();

  //removeObject(scene);
  //addObject(scene);
  renderer.render(scene, camera);
}

init();
render();

function removeObject(scene) {
  document.body.onmousedown = function x() {
    scene.remove(ptcloud);
  };
}

function addObject(scene) {
  document.body.onmouseup = function y() {
    scene.add(ptcloud);
  };
}

// --------------------------------------- SLIDER
