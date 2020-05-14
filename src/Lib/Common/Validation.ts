import * as Joi from "joi";

export class Validation {
  static get Joi() {
    return Joi;
  }
  static getSchema(keys: {}) {
    return Joi.object().keys(keys);
  }

  static getError(data, schema) {
    return Joi.validate(data, schema, (err, value) => {
      if (err) {
        return err;
      }
    });
  }
}
