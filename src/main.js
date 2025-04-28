import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87CEEB',
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let bg;
let startButton;
const tileCount = 11;
let tileSprites = [];
let selectedTile = null; // To keep track of the tile being dragged

function preload() {
  this.load.image('img', 'img.jpg');  
  this.load.image('start', 'start.webp');  
}

function create() {
  bg = this.add.image(0, 0, 'img').setOrigin(0, 0);
  bg.displayWidth = this.scale.width;
  bg.displayHeight = this.scale.height;

  startButton = this.add.image(this.scale.width / 2, this.scale.height / 2, 'start').setOrigin(0.5, 0.5);
  startButton.setScale(0.2);
  startButton.setInteractive();
  startButton.on('pointerdown', () => sliceImage.call(this, 'img'));
}

function sliceImage(imageKey) {
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

    // Enable drag events
    this.input.setDraggable(sprite);
  }

  
}


function update() {
  // Game loop if needed
}
