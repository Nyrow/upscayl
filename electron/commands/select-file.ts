import { MessageBoxOptions, dialog } from "electron";
import { getMainWindow } from "../main-window";
import { savedImagePath, setSavedImagePath } from "../utils/config-variables";
import logit from "../utils/logit";
import settings from "electron-settings";
import { FEATURE_FLAGS } from "../../common/feature-flags";

const SUPPORTED_IMAGE_EXTENSIONS = [
  "png", "jpg", "jpeg", "jfif", "webp", "tga",
];

const selectFile = async () => {
  const mainWindow = getMainWindow();

  const { canceled, filePaths, bookmarks } = await dialog.showOpenDialog({
    properties: ["openFile"],
    title: "Select Image",
    defaultPath: savedImagePath,
    securityScopedBookmarks: true,
    message: "Select Image to Upscale",
    filters: [{ name: "Images", extensions: SUPPORTED_IMAGE_EXTENSIONS }],
  });

  if (FEATURE_FLAGS.APP_STORE_BUILD && bookmarks && bookmarks.length > 0) {
    console.log("🚨 Setting Bookmark: ", bookmarks);
    settings.set("file-bookmarks", bookmarks[0]);
  }

  if (canceled || !filePaths.length) {
    logit("🚫 File Operation Cancelled");
    return null;
  }

  const selectedPath = filePaths[0];
  const extension = selectedPath.split(".").pop()?.toLowerCase() ?? "";
  if (!SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) {
    logit("❌ Invalid File Detected");
    const options: MessageBoxOptions = {
      type: "error",
      title: "Invalid File",
      message:
        "The selected file is not a supported image. Supported formats: PNG, JPG, JPEG, JFIF, WEBP and TGA.",
    };
    if (!mainWindow) return null;
    dialog.showMessageBoxSync(mainWindow, options);
    return null;
  }

  setSavedImagePath(selectedPath);
  logit("📄 Selected File Path: ", selectedPath);
  return selectedPath;
};

export default selectFile;
