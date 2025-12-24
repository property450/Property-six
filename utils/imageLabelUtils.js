//utils/imageLabelUtils.js
import { toCount } from "./numberUtils";
import { toArray, getName } from "./arrayUtils";

export const getPhotoLabelsFromConfig = (c = {}) => {
  const labels = [];
  ["bedrooms", "bathrooms", "kitchens", "livingRooms", "carpark"].forEach(
    (k) => {
      for (let i = 1; i <= toCount(c[k]); i++) labels.push(`${k}${i}`);
    }
  );

  toArray(c.extraSpaces).forEach((e) => labels.push(getName(e)));
  toArray(c.furniture).forEach((f) => labels.push(getName(f)));

  return labels.length ? [...new Set(labels)] : ["房源照片"];
};
