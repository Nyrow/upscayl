import React, { useCallback, useEffect, useState } from "react";
import { ReactCompareSlider } from "react-compare-slider";
import useTranslation from "../hooks/use-translation";
import { sanitizePath } from "@common/sanitize-path";
import { loadTgaPreview } from "@/lib/tga-preview";

const SliderView = ({
  imagePath,
  sanitizedImagePath,
  sanitizedUpscaledImagePath,
  zoomAmount,
}: {
  imagePath: string;
  sanitizedImagePath: string;
  sanitizedUpscaledImagePath: string;
  zoomAmount: string;
}) => {
  const t = useTranslation();
  const [backgroundPosition, setBackgroundPosition] = useState("0% 0%");
  const [originalTgaSrc, setOriginalTgaSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    setOriginalTgaSrc("");
    if (!imagePath.toLowerCase().endsWith(".tga")) return;
    loadTgaPreview(imagePath)
      .then((preview) => { if (!cancelled) setOriginalTgaSrc(preview.src); })
      .catch((error: unknown) => console.error("Failed to decode original TGA for comparison:", error));
    return () => { cancelled = true; };
  }, [imagePath]);

  const handleMouseMove = useCallback((e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBackgroundPosition(`${x}% ${y}%`);
  }, []);

  const isTga = imagePath.toLowerCase().endsWith(".tga");
  const originalSrc = isTga ? originalTgaSrc : "file:///" + sanitizedImagePath;
  const upscaledSrc = "file:///" + sanitizedUpscaledImagePath;

  return (
    <ReactCompareSlider
      itemOne={
        <>
          <p className="absolute bottom-1 left-1 rounded-md bg-black p-1 text-sm font-medium text-white opacity-30">
            {t("APP.SLIDER.ORIGINAL_TITLE")}
          </p>
          <img
            src={originalSrc}
            alt={t("APP.SLIDER.ORIGINAL_TITLE")}
            onMouseMove={handleMouseMove}
            draggable="false"
            style={{ width: "100%", height: "100%", objectFit: "contain", transformOrigin: backgroundPosition }}
            className="block"
          />
        </>
      }
      itemTwo={
        <>
          <p className="absolute bottom-1 right-1 rounded-md bg-black p-1 text-sm font-medium text-white opacity-30">
            {t("APP.SLIDER.UPSCAYLED_TITLE")}
          </p>
          <img
            src={upscaledSrc}
            alt={t("APP.SLIDER.UPSCAYLED_TITLE")}
            onMouseMove={handleMouseMove}
            draggable="false"
            style={{ width: "100%", height: "100%", objectFit: "contain", transformOrigin: backgroundPosition }}
            className="block"
          />
        </>
      }
      className="group h-screen"
    />
  );
};

export default SliderView;
