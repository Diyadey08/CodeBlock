const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const dpr = window.devicePixelRatio || 1
const MAP_SCALE=dpr + 2
const MAP_COLS=28
const MAP_ROWS=28
const TILE_SIZE=16

canvas.width = 1024 * dpr
canvas.height = 576 * dpr

const VIEWPORT_WIDTH=canvas.width/MAP_SCALE
const VIEWPORT_HEIGHT=canvas.height/MAP_SCALE

const VIEWPORT_CENTER_X=VIEWPORT_WIDTH/2
const VIEWPORT_CENTER_Y=VIEWPORT_HEIGHT/2

const MAP_WIDTH=TILE_SIZE*MAP_COLS
const MAP_HEIGHT=TILE_SIZE*MAP_ROWS

const MAP_SCROLL_X=MAP_WIDTH-VIEWPORT_WIDTH
const MAP_SCROLL_Y=MAP_HEIGHT-VIEWPORT_HEIGHT
const layersData = {
   l_Terrain: l_Terrain,
   l_Trees_1: l_Trees_1,
   l_Trees_2: l_Trees_2,
   l_Trees_3: l_Trees_3,
   l_Trees_4: l_Trees_4,
   l_Landscape_Decorations: l_Landscape_Decorations,
   l_Landscape_Decorations_2: l_Landscape_Decorations_2,
   l_Houses: l_Houses,
   l_House_Decorations: l_House_Decorations,
   l_Characters: l_Characters,
   l_Collisions: l_Collisions,
};

const tilesets = {
  l_Terrain: { imageUrl: './images/terrain.png', tileSize: 16 },
  l_Front_Renders: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Trees_1: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Trees_2: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Trees_3: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Trees_4: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Landscape_Decorations: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Landscape_Decorations_2: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Houses: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_House_Decorations: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Characters: { imageUrl: './images/characters.png', tileSize: 16 },
  l_Collisions: { imageUrl: './images/characters.png', tileSize: 16 },
};
const frontRenderLayersDate={
  l_Front_Renders: l_Front_Renders,
}

// Tile setup
const collisionBlocks = []
const blockSize = 16 // Assuming each tile is 16x16 pixels

collisions.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 1) {
      collisionBlocks.push(
        new CollisionBlock({
          x: x * blockSize,
          y: y * blockSize,
          size: blockSize,
        }),
      )
    }
  })
})

const renderLayer = (tilesData, tilesetImage, tileSize, context) => {
  // Calculate the number of tiles per row in the tileset
  // We use Math.ceil to ensure we get a whole number of tiles
  const tilesPerRow = Math.ceil(tilesetImage.width / tileSize)

  tilesData.forEach((row, y) => {
    row.forEach((symbol, x) => {
      if (symbol !== 0) {
        // Adjust index to be 0-based for calculations
        const tileIndex = symbol - 1

        // Calculate source coordinates
        const srcX = (tileIndex % tilesPerRow) * tileSize
        const srcY = Math.floor(tileIndex / tilesPerRow) * tileSize

        context.drawImage(
          tilesetImage, // source image
          srcX,
          srcY, // source x, y
          tileSize,
          tileSize, // source width, height
          x * 16,
          y * 16, // destination x, y
          16,
          16, // destination width, height
        )
      }
    })
  })
}

const renderStaticLayers = async (layersData) => {
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = canvas.width
  offscreenCanvas.height = canvas.height
  const offscreenContext = offscreenCanvas.getContext('2d')

  for (const [layerName, tilesData] of Object.entries(layersData)) {
    const tilesetInfo = tilesets[layerName]
    if (tilesetInfo) {
      try {
        const tilesetImage = await loadImage(tilesetInfo.imageUrl)
        renderLayer(
          tilesData,
          tilesetImage,
          tilesetInfo.tileSize,
          offscreenContext,
        )
      } catch (error) {
        console.error(`Failed to load image for layer ${layerName}:`, error)
      }
    }
  }

  // Optionally draw collision blocks and platforms for debugging
  // collisionBlocks.forEach(block => block.draw(offscreenContext));

  return offscreenCanvas
}
// END - Tile setup

// Change xy coordinates to move player's default position
const player = new Player({
  x: 100,
  y: 100,
  size: 15,
})

const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
}

let lastTime = performance.now()
let frontRendersCanvas
function animate(backgroundCanvas) {
  // Calculate delta time
  const currentTime = performance.now()
  const deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime

  // Update player position
  player.handleInput(keys)
  player.update(deltaTime, collisionBlocks)

  const horizontalScrollDistance =Math.min(Math.max(0,player.center.x - VIEWPORT_CENTER_X),MAP_SCROLL_X)
  const verticalScrollDistance=Math.min(Math.max(0,player.center.y - VIEWPORT_CENTER_Y),MAP_SCROLL_Y)
  // Render scene
  c.save()
  c.scale(MAP_SCALE,MAP_SCALE )
  c.translate(-horizontalScrollDistance,-verticalScrollDistance)
  c.clearRect(0, 0, canvas.width, canvas.height)
  c.drawImage(backgroundCanvas, 0, 0)
  player.draw(c)
  c.drawImage(frontRendersCanvas, 0, 0)
  c.restore()

  requestAnimationFrame(() => animate(backgroundCanvas))
}

const startRendering = async () => {
  try {
    const backgroundCanvas = await renderStaticLayers(layersData)
    frontRendersCanvas = await renderStaticLayers(frontRenderLayersDate)
    if (!backgroundCanvas) {
      console.error('Failed to create the background canvas')
      return
    }

    animate(backgroundCanvas)
  } catch (error) {
    console.error('Error during rendering:', error)
  }
}

startRendering()

