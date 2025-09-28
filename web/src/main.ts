<!doctype html>
<html>
<head>
 <meta charset="UTF-8">
 <title>Solarballs.io, a simple multiplayer game</title>
  <style>
    body { margin: 0; overflow: hidden; background: black; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script>
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    // Resize canvas to full window
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // Player and camera
    let player = { x: 500, y: 500, speed: 200 };
    let camera = { x: 0, y: 0 };

    // Keyboard state
    let keys = {};
    document.addEventListener("keydown", e => keys[e.key] = true);
    document.addEventListener("keyup", e => keys[e.key] = false);

    function update(dt) {
      if (keys["w"] || keys["ArrowUp"]) player.y -= player.speed * dt;
      if (keys["s"] || keys["ArrowDown"]) player.y += player.speed * dt;
      if (keys["a"] || keys["ArrowLeft"]) player.x -= player.speed * dt;
      if (keys["d"] || keys["ArrowRight"]) player.x += player.speed * dt;

      // Camera follows player
      camera.x = player.x - canvas.width / 2;
      camera.y = player.y - canvas.height / 2;
    }

    function worldToScreen(wx, wy) {
      return { x: wx - camera.x, y: wy - camera.y };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw map grid (2000x2000 area, 50px tiles)
      for (let x = 0; x < 2000; x += 50) {
        for (let y = 0; y < 2000; y += 50) {
          let {x: sx, y: sy} = worldToScreen(x, y);
          ctx.strokeStyle = "#444";
          ctx.strokeRect(sx, sy, 50, 50);
        }
      }

      // Draw player
      let screenPos = worldToScreen(player.x, player.y);
      ctx.fillStyle = "red";
      ctx.fillRect(screenPos.x - 15, screenPos.y - 15, 30, 30);
    }

    // Game loop
    let last = performance.now();
    function loop(now) {
      let dt = (now - last) / 1000;
      last = now;

      update(dt);
      draw();

      requestAnimationFrame(loop);
    }
    loop(last);
  </script>
</body>
</html>
