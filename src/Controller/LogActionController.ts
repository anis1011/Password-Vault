import { Request, Response } from "express";
import { LogActionService } from "../Service/LogActionService";
import { LogService } from "../Service/LogService";

export class LogActionController {

  async getLogActions(req: Request, res: Response) {
    try {
      const logActionService = new LogActionService();
      const logactions = await logActionService
        .find(["guid", "logactionname"], "logactionname");

      if (logactions.length == 0) {
        new LogService().Log("Get Logaction", "I", "Rest Service", res.locals.user.UserId, null, "logaction not added yet!", null);
        return res.status(404).send("logactions not found");
      }

      res.json(logactions)
    } catch (error) {
      new LogService().Log("Get logactions", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get logactions" });
    }
  }
}
