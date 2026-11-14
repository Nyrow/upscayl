import { useEffect, useState } from "react";
import { sanitizePath } from "@common/sanitize-path";
import { ELECTRON_COMMANDS } from "@common/electron-commands";

const decodeTga = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  if (bytes.length < 18) throw new Error("TGA header is incomplete");

  const view = new DataView(bytes.buffer);
  const idLength = bytes[0];
  const colorMapType = bytes[1];
  const imageType = bytes[2];
  const width = view.getUint16(12, true);
  const height = view.getUint16(14, true);
  const bitsPerPixel = bytes[16];
  const descriptor = bytes[17];
  const bytesPerPixel = bitsPerPixel / 8;

  if (colorMapType !== 0 || (imageType !== 2 && imageType !== 10)) {
    throw new Error("Only uncompressed and RLE true-color TGA images are supported");
  }
  if ((bitsPerPixel !== 24 && bitsPerPixel !== 32) || !width || !height) {
    throw new Error("Only 24-bit and 32-bit TGA images are supported");
  }

  const pixelCount = width * height;
  const rgba = new Uint8ClampedArray(pixelCount * 4);
  let offset = 18 + idLength;
  let pixelIndex = 0;

  const readPixel = () => {
    if (offset + bytesPerPixel > bytes.length) throw new Error("TGA pixel data is truncated");
    const b = bytes[offset++];
    const g = bytes[offset++];
    const r = bytes[offset++];
    const a = bytesPerPixel === 4 ? bytes[offset++] : 255;
    return [r, g, b, a];
  };

  const writePixel = (pixel: number[]) => {
    if (pixelIndex >= pixelCount) throw new Error("TGA contains too much pixel data");
    const fileX = pixelIndex % width;
    const fileY = Math.floor(pixelIndex / width);
    const x = descriptor & 0x10 ? width - 1 - fileX : fileX;
    const y = descriptor & 0x20 ? fileY : height - 1 - fileY;
    const target = (y * width + x) * 4;
    rgba[target] = pixel[0];
    rgba[target + 1] = pixel[1];
    rgba[target + 2] = pixel[2];
    rgba[target + 3] = pixel[3];
    pixelIndex += 1;
  };

  if (imageType === 2) {
    while (pixelIndex < pixelCount) writePixel(readPixel());
  } else {
    while (pixelIndex < pixelCount) {
      if (offset >= bytes.length) throw new Error("TGA RLE data is truncated");
      const packet = bytes[offset++];
      const count = (packet & 0x7f) + 1;
      if (packet & 0x80) {
        const pixel = readPixel();
        for (let i = 0; i < count; i += 1) writePixel(pixel);
      } else {
        for (let i = 0; i < count; i += 1) writePixel(readPixel());
      }
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create image preview canvas");
  const imageData = context.createImageData(width, height);
  imageData.data.set(rgba);
  context.putImageData(imageData, 0, 0);
  return { src: canvas.toDataURL("image/png"), width, height };
};

const ImageViewer = ({
  imagePath,
  setDimensions,
}: {
  imagePath: string;
  setDimensions: (dimensions: { width: number; height: number }) => void;
}) => {
  const [previewSrc, setPreviewSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPreviewSrc("");

    if (!imagePath.toLowerCase().endsWith(".tga")) return;

    window.electron
      .invoke(ELECTRON_COMMANDS.READ_TGA_PREVIEW, imagePath)
      .then((base64: string) => {
        const preview = decodeTga(base64);
        if (cancelled) return;
        setDimensions({ width: preview.width, height: preview.height });
        setPreviewSrc(preview.src);
      })
      .catch((error: unknown) => {
        console.error("Failed to decode TGA preview:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [imagePath, setDimensions]);

  const isTga = imagePath.toLowerCase().endsWith(".tga");
  const src = isTga ? previewSrc : "file:///" + sanitizePath(imagePath);

  return (
    <img
      src={src}
      onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
        if (!isTga) {
          setDimensions({
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight,
          });
        }
      }}
      draggable="false"
      alt=""
      className="h-full w-full bg-gradient-to-br from-base-300 to-base-100 object-contain"
    />
  );
};

export default ImageViewer;
