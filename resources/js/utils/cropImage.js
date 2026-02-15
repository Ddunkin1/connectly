/**
 * Get cropped image blob from image source and crop area.
 * Used with react-easy-crop - croppedAreaPixels is in the displayed image's coordinate space.
 * We need to account for the natural image dimensions vs displayed dimensions.
 */
export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

export const getCroppedImg = async (imageSrc, pixelCrop, filter = 'none') => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

    if (filter && filter !== 'none') {
        const tmp = document.createElement('canvas');
        tmp.width = canvas.width;
        tmp.height = canvas.height;
        const tmpCtx = tmp.getContext('2d');
        if (tmpCtx) {
            tmpCtx.drawImage(canvas, 0, 0);
            ctx.filter = filter;
            ctx.drawImage(tmp, 0, 0);
        }
    }

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
};
