/**
 * Compresses an image file on the client-side using HTML5 Canvas.
 * Resizes the image to fit within maxWidth and maxHeight, and outputs a compressed JPEG or PNG file.
 */
export function compressImage(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only process images
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Draw to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }

        // Fill canvas with white background in case source image has transparency (converting to JPEG)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed blob (always convert to JPEG to prevent large base64 data payloads)
        const outputType = "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Change file extension to .jpg
            let newName = file.name;
            const lastDot = newName.lastIndexOf(".");
            if (lastDot !== -1) {
              newName = newName.substring(0, lastDot) + ".jpg";
            } else {
              newName = newName + ".jpg";
            }

            const compressedFile = new File([blob], newName, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = () => {
        resolve(file);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}
