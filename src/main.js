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
const tileCount = 5;
let tileSprites = [];
let dropZones = [];
let congratsText;

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
    // Create drop zone with visible outline
    const zone = this.add.rectangle(i * tileWidth, 0, tileWidth, tileHeight)
      .setOrigin(0, 0)
      .setStrokeStyle(4, 0xff0000)
      .setInteractive({ dropZone: true });
    dropZones.push(zone);

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
    // gameObject.y = dragY;
  });

  this.input.on('dragenter', (pointer, gameObject, dropZone) => {
    dropZone.setStrokeStyle(4, 0x00ff00); // Highlight on enter
  });

  this.input.on('dragleave', (pointer, gameObject, dropZone) => {
    dropZone.setStrokeStyle(4, 0xff0000); // Reset highlight
  });

  this.input.on('drop', (pointer, draggedTile, dropZone) => {
    const dropIndex = dropZones.indexOf(dropZone);
    const targetTile = tileSprites.find(t => t.currentIndex === dropIndex);

    if (targetTile && draggedTile !== targetTile) {
      swapTiles(draggedTile, targetTile);
    } else {
      // Return tile to original position
      this.tweens.add({
        targets: draggedTile,
        x: draggedTile.currentIndex * tileWidth,
        y: 0,
        duration: 300,
        ease: 'Power2'
      });
    }

    dropZone.setStrokeStyle(4, 0xff0000); // Reset highlight
  });

  this.input.on('dragend', (pointer, gameObject, dropped) => {
    if (!dropped) {
      this.tweens.add({
        targets: gameObject,
        x: gameObject.currentIndex * tileWidth,
        y: 0,
        duration: 300,
        ease: 'Power2'
      });
    }
  });
}

function swapTiles(tileA, tileB) {
  const tileWidth = config.width / tileCount;

  const indexA = tileA.currentIndex;
  const indexB = tileB.currentIndex;

  tileA.currentIndex = indexB;
  tileB.currentIndex = indexA;

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

  [tileSprites[indexA], tileSprites[indexB]] = [tileSprites[indexB], tileSprites[indexA]];
}

function checkIfSolved(scene) {
  const allCorrect = tileSprites.every(tile => tile.originalIndex === tile.currentIndex);
  if (allCorrect && !congratsText) {
    congratsText = scene.add.text(
      config.width / 2,
      100,
      '🎉 Congratulations! 🎉',
      {
        fontSize: '48px',
        fill: '#ffffff',
        backgroundColor: '#28a745',
        padding: { x: 20, y: 10 },
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(10);
  }
}


function update() {
  // Not used currently
}
