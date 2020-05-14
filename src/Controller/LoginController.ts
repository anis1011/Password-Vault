import { Request, Response } from "express";
import { AppSettings } from "../AppSettings";
import { Cookie } from "../lib/Common/Cookie";
import { Crypto } from "../lib/Security/Crypto";
import { GoogleAuth } from "../Lib/Security/GoogleAuth";
import { changeSequelize, SequelizeLists } from "../Repository/Sequelize";
import { AuthService } from "../Service/AuthService";
import { LogService } from "../Service/LogService";
import { UserLoginInfoService } from "../Service/UserLoginInfoService";
import { UserService } from "../Service/UserService";

export class LoginController {

  async Login(req: Request, res: Response) {
    try {
      const user = req.body;
      let password = req.body.Password;
      user.Password = password.trim();

      changeSequelize(SequelizeLists.SequelizeAdmin);

      const authService = new AuthService();
      const crypto = new Crypto();
      const googleAuth = new GoogleAuth();

      await googleAuth.verify(user.idToken);
      const userService = new UserService();
      const userFromDb: any = await userService.getContext()
        .find({
          where: { datedeleted: null, email: user.email },
          attributes: ['guid', 'userid', 'email', 'name', 'isactive', 'isadminyesno', 'encpassword', 'masterpassword']
        });

      if (!userFromDb) {
        throw ({ message: "Invalid email", description: `Invalid email: ${user.email}`, filelog: true });
      }

      await userService.isValidUser(user, userFromDb);

      if (userFromDb.isadminyesno == 1) {
        if ((!userFromDb.masterpassword) || userFromDb.masterpassword && !authService.verifyAdmin(user, userFromDb)) {
          userService.update({ guid: userFromDb.guid, isadminyesno: 0, masterpassword: null });
        }
      }

      const salt = crypto.generateRandomkey();
      const valueToEncrypt = {
        Password: user.Password,
        UserId: userFromDb.userid,
        isadmin: user.isAdmin,
        logindatetime: Date.now()
      };

      let encryptedValue = crypto.encrypt(salt, JSON.stringify(valueToEncrypt));
      let userLoginInfoService = new UserLoginInfoService()
      await userLoginInfoService.clearPreviousSession(userFromDb.userid);

      const logInfo = {
        userid: userFromDb.userid,
        encryptedtoken: encryptedValue
      };

      let loginfo = await userLoginInfoService.create(logInfo)

      const guid = loginfo["guid"];
      let authkey = JSON.stringify({ salt, guid });

      Cookie.set(req, res, "Authkey", authkey, {
        httpOnly: true,
        signed: true,
        secure: AppSettings.IsCookieSecure,
        expires: AppSettings.cookieTimeoutTime,
        overwrite: true
      });

      res.status(200).send({
        guid: userFromDb.guid,
        username: userFromDb.name,
        role: userFromDb.isadminyesno
      });
    }
    catch (error) {
      const logservice = new LogService();
      console.info('User cannot Login:' + error.message);
      logservice.Log(error.message, "E", "Rest service", null, null, error.description, error.stack);
      res.status(401).send({ message: error.message });
    }
  }

  async Logout(req: Request, res: Response) {
    try {
      let obj: any = {};
      let authkey = JSON.parse(Cookie.get(req, res, "Authkey", { signed: true }));

      obj.guid = authkey.guid;
      obj.dateloggedout = Date.now();
      obj.encryptedtoken = null;

      const userLoginInfoService = new UserLoginInfoService();
      await userLoginInfoService.update(obj);

      // Cookie.set(req, res, "Authkey", authkey, {
      //   httpOnly: false,
      //   expires: new Date(),
      //   signed: true
      // });

      res.clearCookie("Authkey");
      res.send({ message: "Logout" });

    } catch (error) {
      new LogService().fileLog("Logout", error.message, error.stack);
      res.status(500).send({ message: "Logout failed" });
    }
  }
}
