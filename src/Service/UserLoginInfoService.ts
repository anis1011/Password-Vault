import { AppSettings } from "../AppSettings";
import { Crypto } from "../lib/Security/Crypto";
import { AppDbContext } from "../Repository/AppDbContext";
import { BaseService } from "./BaseService";

export class UserLoginInfoService extends BaseService {

  constructor() {
    super(new AppDbContext().UserLoginInfo());
  }

  //Authentication of user on every request
  async checkSession(authkey: any, schedulerequest?) {
    let user: any = {};

    const guid: string = authkey.guid;
    const salt: string = authkey.salt;

    const loginInfo: any = await this.getContext()
      .find({
        attributes: ['userid', 'encryptedtoken', 'datemodified'],
        where: { guid: guid }
      });

    if (!loginInfo || !loginInfo.encryptedtoken) {
      throw ({ message: "Unauthenticated", description: "Invalid token", userid: null });
    }

    if (loginInfo.datemodified) {
      if (AppSettings.sessionTimeoutTime < (Date.now() - loginInfo.datemodified)) {
        throw ({ message: "Session has expired", description: `Invalid token for ${loginInfo.userid}` });
      }
    }

    const crypto = new Crypto();
    const decryptedToken: any = JSON.parse(crypto.decrypt(salt, loginInfo.encryptedtoken));

    //someone trying to use other user's session/cookie; return empty
    if (loginInfo.userid != decryptedToken.UserId) {
      throw ({ message: "Unauthenticated", description: `Invalid token for ${decryptedToken.userid}` });
    }

    //8 hours session timeout check
    if (AppSettings.loginDuration < (Date.now() - decryptedToken.logindatetime)) {
      throw ({ message: "Login required", description: `Maximum login duration exceeds for ${loginInfo.userid}` });
    }

    //UserId and Password will be stored in encrypted token
    user.UserId = decryptedToken.UserId;
    user.Password = decryptedToken.Password;
    user.isAdmin = decryptedToken.isadmin;

    this.update({ guid: guid }, schedulerequest);
    return user;

  }

  async clearPreviousSession(userid: number, transaction?) {
    if (transaction) {
      return await this.getContext()
        .update({ dateloggedout: Date.now(), encryptedtoken: null, datemodified: Date.now() }, { where: { userid: userid }, transaction: transaction })
    }
    return await this.getContext()
      .update({ dateloggedout: Date.now(), encryptedtoken: null, datemodified: Date.now() }, { where: { userid: userid } })
  }
}
