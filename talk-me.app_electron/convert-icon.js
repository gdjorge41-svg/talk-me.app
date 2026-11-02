const fs = require('fs');
const path = require('path');

const srcPng = path.join(__dirname, '..', 'public', 'favicon', 'favicon_2.png');
const destIco = path.join(__dirname, 'icon.ico');

console.log(`🎬 Leyendo icono origen: ${srcPng}`);
if (!fs.existsSync(srcPng)) {
    console.error(`❌ ERROR: No se encontró el archivo PNG en ${srcPng}`);
    process.exit(1);
}

const pngBuffer = fs.readFileSync(srcPng);

// Crear Cabecera ICO (6 bytes)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reservado
header.writeUInt16LE(1, 2); // Tipo (1 = Icono)
header.writeUInt16LE(1, 4); // Cantidad de imágenes (1)

// Crear Directorio de Entrada (16 bytes)
const dir = Buffer.alloc(16);
dir.writeUInt8(0, 0); // Ancho: 256px (0 significa 256)
dir.writeUInt8(0, 1); // Alto: 256px (0 significa 256)
dir.writeUInt8(0, 2); // Cantidad de colores (0 si >= 8bpp)
dir.writeUInt8(0, 3); // Reservado
dir.writeUInt16LE(1, 4); // Planos de color (1)
dir.writeUInt16LE(32, 6); // Bits por píxel (32)
dir.writeUInt32LE(pngBuffer.length, 8); // Tamaño de los datos PNG
dir.writeUInt32LE(22, 12); // Offset del PNG (6 de cabecera + 16 del directorio = 22)

// Concatenar e intentar guardar
const icoBuffer = Buffer.concat([header, dir, pngBuffer]);
fs.writeFileSync(destIco, icoBuffer);

console.log(`✅ Icono convertido con éxito: ${destIco}`);
