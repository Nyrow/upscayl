import { useEffect, useState } from "react";
import { sanitizePath } from "@common/sanitize-path";
import { loadTgaPreview } from "@/lib/tga-preview";

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

    loadTgaPreview(imagePath)
      .then((preview) => {
        if (cancelled) return;
        setDimensions({ width: preview.width, height: preview.height });
        setPreviewSrc(preview.src);
      })
      .catch((error: unknown) => console.error("Failed to decode TGA preview:", error));

    return () => { cancelled = true; };
  }, [imagePath, setDimensions]);

  const isTga = imagePath.toLowerCase().endsWith(".tga");
  return (
    <img
      src={isTga ? previewSrc : "file:///" + sanitizePath(imagePath)}
      onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
        if (!isTga) setDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight });
      }}
      draggable="false"
      alt=""
      className="h-full w-full bg-gradient-to-br from-base-300 to-base-100 object-contain"
    />
  );
};

export default ImageViewer;
