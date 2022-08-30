import EventEmitter from "events";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as oasValidator from "express-oas-validator";

import { ValidatorOpts } from "./types";

export const Validator = async (swaggerInstance: EventEmitter) => {
  const { validateRequest, validateResponse } = await new Promise<ValidatorOpts>((resolve) => {
    swaggerInstance.on("finish", (data) => {
      const response = oasValidator.init(data);
      resolve(response);
    });
  });

  return {
    validateRequest,
    validateResponse,
  };
};
