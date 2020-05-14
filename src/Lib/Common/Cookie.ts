import * as Cookies from "cookies";

export class Cookie {

  static get(req: any, res: any, name: string, options?: {}) {
    return (req.signedCookies[name] == "undefined") ? null : req.signedCookies[name];
  }

  static set(req: any, res: any, name: string, value: string, options?: {}) {
    res.cookie(name, value, options);
  }

}