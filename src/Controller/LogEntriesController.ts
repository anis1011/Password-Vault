import { Request, Response } from "express";
import { LogEntriesService } from "../Service/LogEntriesService";
import { LogService } from "../Service/LogService";

export class LogEntriesController {

  async getAllLogEntries(req: Request, res: Response) {

    let logEntriesService = new LogEntriesService(req.query);
    let logEntries = await logEntriesService.getAllLogEntries()

    if (!logEntries) {
      new LogService().Log("Get Logentrees", "I", "Rest Service", res.locals.user.UserId, null, "Logentrees not added yet!", null);
      return res.status(404).send({ message: "logEntries not found" });
    }
    res.header("x-page-totalcount", `${logEntries.totalcount}`);
    res.send(logEntries.data);
  }
}
