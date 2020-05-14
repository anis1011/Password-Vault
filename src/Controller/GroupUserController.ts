import { Request, Response } from "express";
import { GroupUserService } from "../Service/GroupUserService";
import { LogService } from "../Service/LogService";

export class GroupUserController {

  async getGroupUsers(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const groupUserService = new GroupUserService();
      const logService = new LogService();

      let queryString: any = [];

      if (req.query.userguid) {
        queryString.userguid = req.query.userguid;
      }

      if (req.query.groupguid) {
        queryString.groupguid = req.query.groupguid;
      }

      if (req.query.description.trim()) {
        queryString.description = req.query.description.trim();
      }

      if (req.query.flag) {
        queryString.flag = parseInt(req.query.flag);
      }

      const groupUsers = await groupUserService
        .getAssignableAndUnassignableGroupsOrUsers(page, pagesize, queryString);

      if (!groupUsers) {
        logService.Log("Get groupUsers", "I", "Rest Service", res.locals.user.UserId, null, "entityproject not added yet !", null);
        res.status(404).send({ message: "No record found" });
      }
      res.header("x-page-totalcount", `${groupUsers.totalcount}`);
      res.send(groupUsers.data);
    } catch (error) {
      new LogService().Log("Get groupusers", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get groupusers" });
    }
  }

  async addGroupUser(req: Request, res: Response) {
    try {
      let objects = req.body;
      const groupUserService = new GroupUserService();
      await groupUserService.addGroupUser(objects, res.locals.user.EncryptionKey);
      res.send({ message: "ok" });
    } catch (error) {
      new LogService().Log("Add groupuser", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add groupuser" });
    }
  }

  async deleteGroupUser(req: Request, res: Response) {
    try {
      let guids = req.query.groupuserids.split(',');
      const groupUserService = new GroupUserService();
      await groupUserService.deleteGroupUser(guids)
      res.send({ message: "ok" });
    } catch (error) {
      new LogService().Log("Detete groupusers", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't delete groupusers" });
    }
  }
}
