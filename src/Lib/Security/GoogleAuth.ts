import { reject } from "bluebird";
import { OAuth2Client } from "google-auth-library";
import { AppSettings } from "../../AppSettings";

export class GoogleAuth {
  private googleClientId = AppSettings.googleClientId;

  //Verifying the token sent from client side with Google Authorization server
  async verify(idToken: string) {
    let client = new OAuth2Client(this.googleClientId);

    return await client
      .verifyIdToken({
        idToken: idToken,
        audience: this.googleClientId
      })
      .catch(err => reject(err));
  }
}
