import { reject } from "bluebird";
import { Log } from "../Lib/Common/log";
import { AppDbContext } from "../Repository/AppDbContext";
import { BaseService } from "./BaseService";

export class LogService extends BaseService {
  constructor() {
    super(new AppDbContext().LogInfo());
  }

  //both filelog and dblog
  async Log(message: string, severity: string, processname: string, userid: number, runtimereference: string, description: string, stacktrace: string) {
    let log = {
      userid: userid,
      message: message,
      description: description,
      severity: severity,
      processname: processname,
      runtimereference: runtimereference
    };

    this.create(log);
    // Log.logger().error(`${message}:  ${description} ; stacktrace: ${stacktrace}`);
    //close the handle
    // Log.logger().close();
  }

  //filelog only
  fileLog(message, description, stacktrace) {
    //Log.logger().error(`${message}:  ${description} ; stacktrace: ${stacktrace}`);
  }
}
