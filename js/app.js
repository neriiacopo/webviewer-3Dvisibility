import * as THREE from "https://cdn.skypack.dev/three@v0.133.1";

import { OrbitControls } from "https://cdn.skypack.dev/three@v0.133.1/examples/jsm/controls/OrbitControls.js";

let scene, renderer, camera, controls, pointlight, ambientlight;
let cube;

function init() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
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
    pointlight = new THREE.PointLight(0xffffff, 0.2);
    pointlight.position.set(600, 600, 600);

    scene.add(pointlight);

    // const light = new THREE.AmbientLight(0x404040); // soft white light
    const light = new THREE.AmbientLight(0xf5f5f5); // soft white light
    scene.add(light);
}

let mesh;
let modelPath = "./models/json/model_ptrom_joined.json";
function loadExt() {
    var loader = new THREE.ObjectLoader();
    loader.load(modelPath, function (object) {
        // if you want to add your custom material
        var materialObj = new THREE.MeshStandardMaterial({
            // color: new THREE.Color("darkslategray"),
            color: new THREE.Color("#D8D8D8"),
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
    } else if (viz == "viz100g") {
        for (let i = 0; i < arr.length; i++) {
            arrViz.push(arr[i].viz100g);
        }
    } else if (viz == "viz100t") {
        for (let i = 0; i < arr.length; i++) {
            arrViz.push(arr[i].viz100t);
        }
    } else if (viz == "viz100w") {
        for (let i = 0; i < arr.length; i++) {
            arrViz.push(arr[i].viz100w);
        }
    } else if (viz == "viz300") {
        for (let i = 0; i < arr.length; i++) {
            arrViz.push(arr[i].viz300);
        }
    }

    filterVals();
}

function filterVals() {
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    //const color = new THREE.Color();
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
            const color = extractColor(arrViz[i]);

            colors.push(color[0], color[1], color[2]);
        }
    }

    geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    );
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

    selectForm.onchange = function (sel) {
        scene.remove(ptcloud);

        viz = sel.target.value;
        createXYZRGB(csv, viz);
    };

    createXYZRGB(csv, viz);
}

function render() {
    requestAnimationFrame(render);

    controls.update();

    renderer.render(scene, camera);
}

// ------------------------- Generate colors for values
const gradient = [
    [0, [0.05, 0.03, 0.53]],
    [25, [0.5, 0.01, 0.66]],
    [50, [0.8, 0.28, 0.47]],
    [75, [0.97, 0.59, 0.25]],
    [101, [0.94, 0.98, 0.13]],
];

function extractColor(x) {
    let colorRange = [];

    for (let i = 0; i < 4; i++) {
        if (x >= gradient[i][0] && x < gradient[i + 1][0]) {
            colorRange = [i, i + 1];
        }
    }

    //Get the two closest colors
    var firstcolor = gradient[colorRange[0]][1];
    var secondcolor = gradient[colorRange[1]][1];

    //Calculate ratio between the two closest colors
    var firstcolor_x = 100 * (gradient[colorRange[0]][0] / 100);
    var secondcolor_x = 100 * (gradient[colorRange[1]][0] / 100) - firstcolor_x;
    var slider_x = 100 * (x / 100) - firstcolor_x;
    var ratio = slider_x / secondcolor_x;

    //Get the color with pickHex(thx, less.js's mix function!)
    var result = pickHex(secondcolor, firstcolor, ratio);
    return result;
}

function pickHex(color1, color2, weight) {
    var p = weight;
    var w = p * 2 - 1;
    var w1 = (w / 1 + 1) / 2;
    var w2 = 1 - w1;
    var rgb = [
        color1[0] * w1 + color2[0] * w2,
        color1[1] * w1 + color2[1] * w2,
        color1[2] * w1 + color2[2] * w2,
    ];
    return rgb;
}

// ------------------------- UI
let selectForm = document.getElementById("viz-select");

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
    start: [0, 100],
    connect: true,
    behaviour: "drag",
    range: {
        min: 0,
        max: 100,
    },
    pips: { mode: "values", values: [0, 25, 50, 75, 100] },
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

// ------------------------- CAMERA PRESET

const cameraPositions = [
    [0, [940, 40, -245]],
    [1, [52, 35, -193]],
    [2, [750, 250, -250]],
    [3, [200, 250, -150]],
    [4, [495, 480, -200]],
];

function getActive() {
    let value = document.querySelector(".form-check-input:checked").value - 1;
    let cameraPosition = cameraPositions[value][1];
    camera.position.set(
        cameraPosition[0],
        cameraPosition[1],
        cameraPosition[2]
    );

    // Center setting
    controls.target.set(493, 0, -233);

    if (value == 2 || value == 3) {
        controls.target.set(cameraPosition[0], 0, cameraPosition[2]);
    }
    controls.update();
}
document
    .querySelectorAll(".form-check-input")
    .forEach((input) => input.addEventListener("click", getActive));

// ------------------------- INIT
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
    viz = "viz100w";
}
