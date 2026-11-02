/**
 * @file image-utils.js
 * @description Utilidades para el procesamiento de imágenes (compresión y redimensionado).
 */

/**
 * Procesa una imagen para comprimirla y redimensionarla si es necesario.
 * @param {File} file - El archivo de imagen original.
 * @returns {Promise<string>} - Una promesa que resuelve con la imagen en formato DataURL (base64).
 */
export async function processImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Compresión inteligente: si supera 1920x1080, redimensionar manteniendo ratio
                const MAX_W = 1920;
                const MAX_H = 1080;

                if (width > MAX_W || height > MAX_H) {
                    const ratio = Math.min(MAX_W / width, MAX_H / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Exportar como JPEG con calidad 0.8 para buen detalle y poco peso
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
