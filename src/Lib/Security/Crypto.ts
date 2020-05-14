import * as crypto from "crypto";
import { reject } from "bluebird";

export class Crypto {
  public vector: string = 'klhjklj98jl34kj-98kjlgkdfjlkjgdf9-8pj3lkjlkj0-98gfdklj';

  //Using Advance Encryption Standard to encrypt data
  encrypt(key: string, data) {
    if (data == null) {
      return null;
    }

    key = key.trim();
    data = data.trim();
    let keybuffer = (key + key + key + key + key + key + key + key + key + key).slice(0, 32);

    let iv = Buffer.from(this.vector.slice(0, 16));
    var cipher = crypto.createCipheriv("aes-256-ctr", keybuffer, iv);

    let encoded = cipher.update(data, 'utf8', "hex");
    encoded += cipher.final('hex');

    return encoded;
  }

  decrypt(key: string, data) {
    if (data == null) {
      return null;
    }

    key = key.trim();
    data = data.trim();
    let keybuffer = (key + key + key + key + key + key + key + key + key + key).slice(0, 32);

    let iv = Buffer.from(this.vector.slice(0, 16));
    var decipher = crypto.createDecipheriv("aes-256-ctr", keybuffer, iv);

    let decoded = decipher.update(data, 'hex', "utf8");
    decoded += decipher.final('utf8');

    return decoded.toString();
  }

  //Generates 128 random hex character
  generateRandomkey() {
    let randomNumber = Math.floor(Math.random() * (256 - 128) + 128);
    return crypto.randomBytes(randomNumber).toString("hex");
  }

  //Logical encryption for encrypted password and master encrypted password
  encryptPassword(password, encKey?) {
    try {
      let encryptedValue: any;

      if (!encKey) {
        encryptedValue = this.encrypt(password, password);
      } else {
        encryptedValue = this.encrypt(encKey, password);
      }

      return encryptedValue;
    }
    catch (error) {
      return reject(error);
    }
  }

  //Logical decryption for master encrypted password
  decryptPassword(encPassword, encKey) {
    try {
      let decryptedValue: any;

      if (!encKey) {
        decryptedValue = this.decrypt(encPassword, encPassword);
      } else {
        decryptedValue = this.decrypt(encKey, encPassword);
      }

      return decryptedValue;
    }
    catch (error) {
      return reject(error);
    }
  }

  //SHA256 with salt
  hash(data, salt) {
    let hash = crypto.createHash('sha256', salt)
    hash.update(data)
    return hash.digest('hex');
  }

  //Password hashing
  passwordhash(password: string, email: string) {
    let dataToHash = password;
    for (let index = 0; index < email.length; index++) {
      const element = email[index];
      dataToHash += element;
      dataToHash = this.hash(dataToHash, password);
    }

    return dataToHash;
  }

}