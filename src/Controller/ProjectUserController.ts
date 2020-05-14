import { Request, Response } from "express";
import { Log } from "../Lib/Common/log";
import { LogService } from "../Service/LogService";
import { ProjectUserService } from "../Service/ProjectUserService";

export class ProjectUserController {

  async getProjectUsers(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const projectUserService = new ProjectUserService();
      const logService = new LogService();

      let queryString: any = [];

      if (req.query.userguid) {
        queryString.userguid = req.query.userguid;
      }

      if (req.query.projectguid) {
        queryString.projectguid = req.query.projectguid;
      }

      if (req.query.name.trim()) {
        queryString.name = req.query.name.trim();
      }

      if (req.query.flag) {
        queryString.flag = parseInt(req.query.flag);
      }

      let projectUsers = await projectUserService
        .getAssignableAndUnassignableProjectsOrUsers(page, pagesize, queryString)
      if (!projectUsers) {
        Log.logger().info("Project Users not added yet !");
        logService.Log("projectUsers get projectUsers", "I", "Rest Service", res.locals.user.UserId, null, "project users not added yet !", null);
        res.status(404).send({ message: "Not record found" });
      }
      res.header("x-page-totalcount", `${projectUsers.totalcount}`);
      res.send(projectUsers.data);
    } catch (error) {
      new LogService().Log('Get projectuser', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get projectuser" });
    }
  }

  async addProjectUser(req: Request, res: Response) {
    try {
      let objects = req.body;
      const projectUserService = new ProjectUserService();
      await projectUserService.addProjectUser(objects, res.locals.user.EncryptionKey)
      res.send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Add projectuser', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add projectuser" });
    }
  }

  async deleteProjectUser(req: Request, res: Response) {
    try {
      let guids = req.query.projectuserids.split(',');
      const projectUserService = new ProjectUserService();

      await projectUserService.deleteProjectUser(guids)
      res.send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Delete projectusers ', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't delete projectusers" });
    }
  }
}
