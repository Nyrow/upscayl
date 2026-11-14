import { promises as fs } from "fs";

const readTgaPreview = async (_event: Electron.IpcMainInvokeEvent, imagePath: string) => {
  if (typeof imagePath !== "string" || !imagePath.toLowerCase().endsWith(".tga")) {
    throw new Error("Invalid TGA image path");
  }

  const file = await fs.readFile(imagePath);
  return file.toString("base64");
};

export default readTgaPreview;
