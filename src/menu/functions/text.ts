import { registerFunction } from "..";
import { manager } from "../../main";
import TextInputModal from "../../modal/textInputModal";
import { getState } from "../../utils/state";
import renderTextToImageWebPPrecise from "../../utils/textWebp";

registerFunction("text", () => {
  const modal = new TextInputModal((text) => {
    if (!text) return;
    const imgURL = renderTextToImageWebPPrecise(text);
    const img = new Image();
    img.onload = () => {
      img.onload = null;
      let [width, height] = [img.width, img.height];
      width /= getState("TEXT_RES");
      height /= getState("TEXT_RES");

      const GLOBAL_PADDING = getState("IMAGE_GLOBAL_PADDING");

      let scale = 1;
      if (width > window.innerWidth - GLOBAL_PADDING) {
        scale = (window.innerWidth - GLOBAL_PADDING) / width;
      }
      if (height * scale > window.innerHeight - GLOBAL_PADDING) {
        scale = (window.innerHeight - GLOBAL_PADDING) / height;
      }

      manager.focused.appendImage({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        width: width * scale,
        height: height * scale,
        image: img,
        rotate: 0,
      });
      manager.focused.requestRender();
      manager.focused.saveAsHistory();
    };
    img.src = imgURL;
  });
  modal.open();
});
