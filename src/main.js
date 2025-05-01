import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87CEEB',
  scene: {
    preload,
    create,
    update
  }
};

new Phaser.Game(config);

let bg, startButton;
const tileCount = 5;
let tileSprites = [];
let dropZones = [];
let congratsText;
let puzzleSolved = false;

function preload() {
  this.load.image('img', 'img.jpg');
  this.load.image('start', 'icons8-start-64.png');
}

function create() {
  bg = this.add.image(0, 0, 'img').setOrigin(0);
  bg.displayWidth = this.scale.width;
  bg.displayHeight = this.scale.height;

  startButton = this.add.image(this.scale.width / 2, this.scale.height / 2, 'start')
    .setOrigin(0.5)
    .setInteractive();

  startButton.on('pointerdown', () => sliceImage.call(this, 'img'));
}

function sliceImage(imageKey) {
  bg.destroy();
  startButton.destroy();

  const fullImage = this.textures.get(imageKey).getSourceImage();
  const tileWidth = config.width / tileCount;
  const tileHeight = config.height * 0.9; // 90% height

  const tileData = [];

  for (let i = 0; i < tileCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = tileWidth;
    canvas.height = tileHeight;
    const ctx = canvas.getContext('2d');

    const srcTileWidth = fullImage.width / tileCount;
    const srcX = i * srcTileWidth;

    ctx.drawImage(fullImage, srcX, 0, srcTileWidth, fullImage.height, 0, 0, tileWidth, tileHeight);

    const tileKey = `tile-${i}`;
    this.textures.addCanvas(tileKey, canvas);
    tileData.push({ key: tileKey, index: i });
  }

  Phaser.Utils.Array.Shuffle(tileData);

  for (let i = 0; i < tileData.length; i++) {
    const x = i * tileWidth;
    
    // Drop zone
    const zone = this.add.rectangle(x, 0, tileWidth, tileHeight)
      .setOrigin(0)
      .setStrokeStyle(2, 0xff0000)
      .setInteractive({ dropZone: true });
    dropZones.push(zone);

    // Tile sprite
    const sprite = this.add.image(x, 0, tileData[i].key)
      .setOrigin(0)
      .setInteractive({ draggable: true });

    sprite.originalIndex = tileData[i].index;
    sprite.currentIndex = i;
    tileSprites.push(sprite);
    this.input.setDraggable(sprite);
  }

  this.input.on('dragstart', (_, gameObject) => {
    if (puzzleSolved) return;
    gameObject.setDepth(1);
  });

  this.input.on('drag', (_, gameObject, dragX, dragY) => {
    if (puzzleSolved) return;
    gameObject.x = dragX;
    gameObject.y = dragY;
  });

  this.input.on('dragenter', (_, __, dropZone) => {
    dropZone.setStrokeStyle(2, 0x00ff00);
  });

  this.input.on('dragleave', (_, __, dropZone) => {
    dropZone.setStrokeStyle(2, 0xff0000);
  });

  this.input.on('drop', (_, dragged, dropZone) => {
    if (puzzleSolved) return;

    const dropIndex = dropZones.indexOf(dropZone);
    const targetTile = tileSprites.find(t => t.currentIndex === dropIndex);

    if (!targetTile || dragged === targetTile) {
      // Revert to original
      resetTile(dragged);
      return;
    }

    swapTiles(dragged, targetTile);
    dropZone.setStrokeStyle(2, 0xff0000);
  });

  this.input.on('dragend', (_, gameObject, dropped) => {
    if (!dropped) {
      resetTile(gameObject);
    }
  });
}

function resetTile(tile) {
  const tileWidth = config.width / tileCount;
  tile.scene.tweens.add({
    targets: tile,
    x: tile.currentIndex * tileWidth,
    y: 0,
    duration: 300,
    ease: 'Power2'
  });
}

function swapTiles(tileA, tileB) {
  const tileWidth = config.width / tileCount;

  const indexA = tileA.currentIndex;
  const indexB = tileB.currentIndex;

  // Swap index values
  tileA.currentIndex = indexB;
  tileB.currentIndex = indexA;

  // Swap in array (for tracking)
  [tileSprites[indexA], tileSprites[indexB]] = [tileSprites[indexB], tileSprites[indexA]];

  tileA.scene.tweens.add({
    targets: tileA,
    x: indexB * tileWidth,
    y: 0,
    duration: 300,
    ease: 'Power2',
    onComplete: () => tileA.setDepth(0)
  });

  tileB.scene.tweens.add({
    targets: tileB,
    x: indexA * tileWidth,
    y: 0,
    duration: 300,
    ease: 'Power2',
    onComplete: () => {
      tileB.setDepth(0);
      checkIfSolved(tileB.scene);
    }
  });
}

function checkIfSolved(scene) {
  const isCorrect = tileSprites.every(t => t.originalIndex === t.currentIndex);
  if (isCorrect && !puzzleSolved) {
    puzzleSolved = true;

    // Disable interaction
    tileSprites.forEach(tile => tile.disableInteractive());

    // Show text
    scene.add.text(
      config.width / 2,
      60,
      '🎉 Congratulations! 🎉',
      {
        fontSize: '48px',
        fill: '#ffffff',
        backgroundColor: '#28a745',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setDepth(10);

    // Show Lottie animation
    showLottieAnimation();
  }
}

function showLottieAnimation() {
  const container = document.getElementById('lottie-container');
  container.style.display = 'block';
  lottie.loadAnimation({
    container: container,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'congrats.json' // Place this file in the same directory
  });
}

function update() {}
