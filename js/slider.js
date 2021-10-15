var slider = document.getElementById("slider-round");
var slider2 = document.getElementById("slider-round");

noUiSlider.create(slider, {
  start: [0, 4000],
  connect: lower,
  behaviour: "drag",
  range: {
    min: 0,
    max: 1000,
  },
});

var connectSlider = document.getElementById("slider-connect");

noUiSlider.create(connectSlider, {
  start: 40,
  connect: "lower",
  range: {
    min: 0,
    max: 100,
  },
});
