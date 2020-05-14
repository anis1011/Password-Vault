import { AppDbContext } from "../Repository/AppDbContext";
import { BaseService } from "./BaseService";

export class LogActionService extends BaseService {
  constructor() {
    super(new AppDbContext().LogActions());
  }

  //Get logactionId based on its name
  async getLogActionId(logActionName: string) {
    return await this.getContext()
      .find({ where: { datedeleted: null, logactionname: logActionName } })
      .then(action => {
        return action["logactionid"];
      });
  }
}
