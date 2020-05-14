import { Crypto } from "../lib/Security/Crypto";
import { UserService } from "./UserService";

export class AuthService {

  //Verifying user password matches
  validatePassword(password: string, email: string, encpassword: string) {
    const crypto = new Crypto();
    let hashpassword = crypto.passwordhash(password, email);
    return hashpassword == encpassword ? true : false;
  }

  //Verifying if user is admin
  verifyAdmin(user: any, userFormDb: any) {
    const crypto = new Crypto();
    let decryptedValue = crypto.decrypt(user.Password, userFormDb.masterpassword);
    let adminInfo: string[] = decryptedValue.split(";");

    if (userFormDb.email != adminInfo[0]) {
      user.isAdmin = false;
      return false;
    }

    user.EncryptionKey = adminInfo[1];
    user.isAdmin = true;
    return true;
  }
}
