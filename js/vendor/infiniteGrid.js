const grid = new THREE.InfiniteGridHelper(0, 100, null, null, "xzy");

const color = {
  value: 0xffffff,
};

gui.add(grid.material.uniforms.uSize1, "value", 2, 100).step(1).name("Size 1");
gui.add(grid.material.uniforms.uSize2, "value", 2, 1000).step(1).name("Size 2");
gui
  .add(grid.material.uniforms.uDistance, "value", 100, 10000)
  .step(1)
  .name("Distance");
gui
  .addColor(color, "value")
  .name("Color")
  .onChange(function () {
    grid.material.uniforms.uColor.value.set(color.value);
  });

scene.add(grid);
