import { helper } from "./types";

export const pi = helper({
  code: `
#ifndef TWO_PI
#define TWO_PI 6.28318530718
#endif
#ifndef PI
#define PI 3.14159265358979323846
#endif`,
});
