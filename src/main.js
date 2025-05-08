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

  // Create drop zones
  createDropZones.call(this, tileWidth, tileHeight);

  // Create tile sprites
  for (let i = 0; i < tileData.length; i++) {
    const x = i * tileWidth;

    const sprite = this.add.image(x, 0, tileData[i].key)
      .setOrigin(0)
      .setInteractive({ draggable: true });

    sprite.originalIndex = tileData[i].index;
    sprite.currentIndex = i;
    sprite.preFX.addColorMatrix().blackWhite()
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

//  Function to create drop zones
function createDropZones(tileWidth, tileHeight) {
  for (let i = 0; i < tileCount; i++) {
    const x = i * tileWidth;

    const zone = this.add.rectangle(x + 20, 20, tileWidth - 40, tileHeight - 40)
      .setOrigin(0)
      .setStrokeStyle(2, 0xff0000)
      .setInteractive({ dropZone: true });

    dropZones.push(zone);
  }
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

  tileA.currentIndex = indexB;
  tileB.currentIndex = indexA;

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

    tileSprites.forEach(tile => tile.clearFX());

    showLottieAnimation(); // Show animation
    // Hide it after 5 seconds
    setTimeout(() => {
      hideLottieAnimation();
      // showBackButton(scene);

      // Call the askQuestion function here to prompt the user after the puzzle is solved
      askQuestion(scene);
    }, 5000);
  }
}


//show the animation
function showLottieAnimation() {
  const container = document.getElementById('lottie-container');
  container.style.display = 'block';
  lottie.loadAnimation({
    container: container,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'congrats.json'
  });
}
//hide the animation 
function hideLottieAnimation() {
  const container = document.getElementById('lottie-container');
  container.style.display = 'none';
}
function askQuestion(scene) {
  const question = "Where is Obito in the image?";
  const correctTiles = [2]; // Adjust as needed

  // Display question
  const questionText = scene.add.text(scene.scale.width / 2, 25, question, {
    font: "32px Arial",
    fill: "#ffffff",
    backgroundColor: "#000000",
    padding: { x: 10, y: 10 },
    align: "center"
  }).setOrigin(0.5, 0);

  const selectedTiles = [];

  // Make tiles interactive for selection
  tileSprites.forEach((tile) => {
    tile.setInteractive();
    tile.on("pointerdown", () => {
      tile.selected = !tile.selected;

      if (tile.selected) {
        tile.setTint(0xffff00);
        selectedTiles.push(tile);
      } else {
        tile.clearTint();
        const index = selectedTiles.indexOf(tile);
        if (index !== -1) selectedTiles.splice(index, 1);
      }
    });
  });

  // Submit button
  const submitButton = scene.add.text(scene.scale.width / 2, scene.scale.height - 50, "Submit", {
    font: "32px Arial",
    fill: "#ffffff",
    backgroundColor: "#ff0000",
    padding: { x: 20, y: 10 },
    align: "center"
  }).setOrigin(0.5, 1).setInteractive();

  submitButton.on("pointerdown", () => {
    if (selectedTiles.length === 0) {
      alert("Please select at least one tile!");
      return;
    }

    const selectedIndices = selectedTiles.map(tile => tile.currentIndex);
    const isCorrect = selectedIndices.length === correctTiles.length &&
      selectedIndices.every(index => correctTiles.includes(index));

    if (isCorrect) {
      alert("Correct! You Win!");
      questionText.destroy();
      selectedTiles.forEach(tile => tile.clearTint());
      submitButton.destroy();
      setTimeout(() => showBackButton(scene), 500);
    } else {
      alert("Wrong! Please Try Again!");
    }
  });
}


// Optionally, you can also use this to manage submission of answers in a more reusable way
function submitAnswer(scene, selectedTiles, correctTiles) {
  if (selectedTiles.length === 0) {
    alert("Please select at least one tile!");
    return;
  }

  // Compare selected tiles with the correct ones
  const isCorrect =
    selectedTiles.length === correctTiles.length &&
    selectedTiles.every(tile => correctTiles.includes(tile));

  if (isCorrect) {
    alert("Correct! You Win!");
    setTimeout(() => showBackButton(scene), 500); // Show back button after correct answer
  } else {
    alert("Wrong! Please Try Again!");
  }
}


function showBackButton(scene) {
  const backText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, "← Back to Start", {
    fontSize: '40px',
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: '#000000aa',
    padding: { x: 20, y: 10 },
    align: 'center',
    fontStyle: 'bold',
    stroke: '#ffcc00',
    strokeThickness: 4
  })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  // Pulse animation (scale up and down)
  scene.tweens.add({
    targets: backText,
    scale: { from: 1, to: 1.1 },
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Hover effect (tint or scale)
  backText.on('pointerover', () => {
    backText.setStyle({ color: '#ffff00' });
  });

  backText.on('pointerout', () => {
    backText.setStyle({ color: '#ffffff' });
  });

  // Restart the scene when clicked
  backText.on("pointerdown", () => {
    tileSprites = [];
    dropZones = [];
    puzzleSolved = false;
    scene.scene.restart();
  });
}




function update() {}
