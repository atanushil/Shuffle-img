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

const game = new Phaser.Game(config);

let bg;
let startButton;
const tileCount = 11;
let tileSprites = [];

function preload() {
  this.load.image('img', 'img.jpg');
  this.load.image('start', 'icons8-start-64.png');
}

function create() {
  bg = this.add.image(0, 0, 'img').setOrigin(0, 0);
  bg.displayWidth = this.scale.width;
  bg.displayHeight = this.scale.height;

  startButton = this.add.image(this.scale.width / 2, this.scale.height / 2, 'start').setOrigin(0.5);
  startButton.setInteractive();
  startButton.on('pointerdown', () => sliceImage.call(this, 'img'));
}

function sliceImage(imageKey) {
  bg.destroy();
  startButton.destroy();

  const fullImage = this.textures.get(imageKey).getSourceImage();
  const tileWidth = config.width / tileCount;
  const tileHeight = config.height;

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
    const sprite = this.add.image(i * tileWidth, 0, tileData[i].key)
      .setOrigin(0, 0)
      .setInteractive({ draggable: true });

    sprite.originalIndex = tileData[i].index;
    sprite.currentIndex = i;
    tileSprites.push(sprite);

    this.input.setDraggable(sprite);
  }

  this.input.on('dragstart', (pointer, gameObject) => {
    gameObject.setDepth(1);
  });

  this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
    gameObject.x = dragX;
    gameObject.y = dragY;
  });

  this.input.on('dragend', (pointer, draggedTile) => {
    let swapped = false;

    for (let i = 0; i < tileSprites.length; i++) {
      const targetTile = tileSprites[i];
      if (targetTile === draggedTile) continue;

      const boundsA = draggedTile.getBounds();
      const boundsB = targetTile.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB)) {
        swapTiles(draggedTile, targetTile);
        swapped = true;
        break;
      }
    }

    if (!swapped) {
      resetTilePosition(draggedTile);
    }
  });
}

function resetTilePosition(tile) {
  const tileWidth = config.width / tileCount;
  tile.x = tile.currentIndex * tileWidth;
  tile.y = 0;
  tile.setDepth(0);
}

function swapTiles(tileA, tileB) {
  const tileWidth = config.width / tileCount;

  const indexA = tileA.currentIndex;
  const indexB = tileB.currentIndex;

  // Swap currentIndex
  tileA.currentIndex = indexB;
  tileB.currentIndex = indexA;

  // Move them visually
  tileA.x = indexB * tileWidth;
  tileA.y = 0;
  tileB.x = indexA * tileWidth;
  tileB.y = 0;

  tileA.setDepth(0);
  tileB.setDepth(0);

  // Swap in tileSprites array if needed
  [tileSprites[indexA], tileSprites[indexB]] = [tileSprites[indexB], tileSprites[indexA]];
}

function update() {
  // Optional game loop
}
