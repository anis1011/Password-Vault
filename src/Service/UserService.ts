import { reject } from "bluebird";
import { Crypto } from "../lib/Security/Crypto";
import { AppDbContext } from "../Repository/AppDbContext";
import { Sequelize } from "../Repository/Sequelize";
import { AuthService } from './AuthService';
import { BaseService } from "./BaseService";
import { UserLoginInfoService } from './UserLoginInfoService';

export class UserService extends BaseService {

  constructor() {
    super(new AppDbContext().Users());
  }

  //Get User detail
  async getUserById(guid: string, masterEncriptionKey: string) {
    try {
      let userFromDb: any = await this.findById(guid).then(result => result);
      const crypto = new Crypto();
      let user: any = {
        guid: userFromDb.guid,
        name: userFromDb.name,
        email: userFromDb.email,
        userid: userFromDb.userid,
        isadminyesno: userFromDb.isadminyesno,
        password: crypto.decryptPassword(userFromDb.masterencpassword, masterEncriptionKey)
      };
      return user;
    } catch (error) {
      return reject(error);
    }
  }

  //Add user
  async addUser(user: any, masterEncriptionKey?: string) {
    try {
      const crypto = new Crypto();
      if (!masterEncriptionKey) {
        masterEncriptionKey = crypto.generateRandomkey();
      }

      //
      user.encpassword = crypto.passwordhash(user.password, user.email);
      user.masterencpassword = crypto.encryptPassword(user.password, masterEncriptionKey);
      if (user.isadminyesno == 1) {
        user.masterpassword = crypto.encrypt(
          user.password,
          `${user.email};${masterEncriptionKey}`
        );
      }
      return await this.create(user);
    } catch (error) {
      return reject(error);
    }

  }

  //Update user
  async updateUser(user: any, masterEncriptionKey: string) {
    try {
      let userFromDb: any = await this.getUserById(user.guid, masterEncriptionKey);
      const crypto = new Crypto();

      if (userFromDb.isadminyesno == 1 && user.isadminyesno != 1) {
        user.masterpassword = null;

        if (userFromDb.email != user.email) {
          user.encpassword = crypto.passwordhash(userFromDb.password, user.email)
        }
      }
      else if (userFromDb.isadminyesno == 1 && user.isadminyesno == 1) {
        if (userFromDb.email != user.email) {
          user.masterpassword = crypto.encrypt(
            userFromDb.password,
            `${user.email};${masterEncriptionKey}`
          );
          user.encpassword = crypto.passwordhash(userFromDb.password, user.email)
        }
      }
      else if (userFromDb.isadminyesno != 1 && user.isadminyesno == 1) {
        user.masterpassword = crypto.encrypt(
          userFromDb.password, `${user.email};${masterEncriptionKey}`
        );

        if (user.email != userFromDb.email) {
          user.encpassword = crypto.passwordhash(userFromDb.password, user.email)
        }
      }
      else {
        if (user.email != userFromDb.email) {
          user.encpassword = crypto.passwordhash(userFromDb.password, user.email)
        }
      }
      return await this.update(user);
    } catch (error) {
      return reject(error);
    }
  }

  //Make user Inactive
  async deleteUser(guids: string[]) {
    try {
      for (let index = 0; index < guids.length; index++) {
        await this.getContext()
          .update(
            { isactive: 1, datedeleted: Date.now() },
            { where: { guid: guids[index] } }
          );
      }
    } catch (error) {
      return reject(error);
    }
  }

  //Change user password
  async changePassword(user: any,userFromDb, masterEncriptionKey: string, t) {
    try {
      // let userFromDb: any = await this.getContext().find({ attributes: ['userid', 'email', 'isadminyesno'], where: { guid: user.guid, datedeleted: null } })

      const crypto = new Crypto();
      user.encpassword = crypto.passwordhash(user.password, userFromDb.email);

      if (userFromDb.isadminyesno == 1) {
        user.masterpassword = crypto.encrypt(user.password, `${userFromDb.email};${masterEncriptionKey}`);
      }

      user.masterencpassword = crypto.encryptPassword(user.password, masterEncriptionKey);
      user.datemodified = Date.now();

      return await this.getContext().update(user, {
        where: { guid: user.guid, },
        transaction: t
      })

      // user.userid = userFromDb.userid;

    } catch (error) {
      return reject(error);
    }
  }

  // Get user email
  async findUserByEmail(email: string) {
    try {
      return await this.getContext()
        .find({
          where: { email: email, datedeleted: null, isactive: null }
        });
    } catch (error) {
      return reject(error);
    }
  }

  //Check existing email
  async checkExistingEmail(email: string, guid: string) {
    try {
      return await this.getContext()
        .find({
          where: {
            email: email,
            datedeleted: null,
            guid: { [Sequelize.Op.ne]: guid }
          }
        });
    } catch (error) {
      return reject(error);
    }
  }

  async isValidUser(user: any, userFromDb: any) {
    try {
      const authService = new AuthService();
      if (!authService.validatePassword(user.Password, user.email, userFromDb.encpassword)) {
        return reject({ message: "Invalid Credential", description: `Invalid password for ${user.email}` });
      }

      if (userFromDb.isactive) {
        return reject({ message: "User not active", description: `User not active ${user.email}` });
      }
      return;
    } catch (error) {
      return reject(error);
    }
  }
}
