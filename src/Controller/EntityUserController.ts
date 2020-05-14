import { Request, Response } from "express";
import { EntityService } from "../Service/EntityService";
import { EntityUserService } from "../Service/EntityUserService";
import { LogService } from "../Service/LogService";
import { UserService } from "../Service/UserService";
import { LogEntriesService } from './../Service/LogEntriesService';

export class EntityUserController {

  async getEntityUsers(req: Request, res: Response) {
    try {

      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const entityUserService = new EntityUserService();
      const logService = new LogService();

      let queryString: any = {};

      if (req.query.userguid) {
        queryString.userguid = req.query.userguid;
      }

      if (req.query.entitytypeguid) {
        queryString.entitytypeguid = req.query.entitytypeguid;
      }

      if (req.query.entityguid) {
        queryString.entityguid = req.query.entityguid;
      }

      if (req.query.name.trim()) {
        queryString.name = req.query.name.trim();
      }

      if (req.query.flag) {
        queryString.flag = parseInt(req.query.flag);
      }

      const entityUsers = await entityUserService
        .getAssignableAndUnassignableEntitiesOrUsers(page, pagesize, queryString)
      if (!entityUsers) {
        logService.Log("entityUsers get entityUsers", "I", "Rest Service", res.locals.user.UserId, null, "entityproject not added yet !", null);
        return res.status(404).send({ message: "No record found" });
      }
      res.header("x-page-totalcount", `${entityUsers.totalcount}`);
      res.send(entityUsers.data);
    } catch (error) {
      new LogService().Log("Get entityuser", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get entityusers" });
    }
  }

  async addEntityUser(req: Request, res: Response) {
    try {
      let objects = req.body;
      let entities: any[] = []
      const entityService = new EntityService();
      const entityUserService = new EntityUserService();
      const userService = new UserService();

      let users: any[] = [];

      for (let index = 0; index < objects.length; index++) {
        await entityService.findById(objects[index].entityid)
          .then((res: any) => {
            entities.push(res);
          });

        await userService.findById(objects[index].userid)
          .then((res: any) => {
            users.push(res);
          });
      }

      await entityUserService.addUserEntity(entities, users, res.locals.user.EncryptionKey, null, null)
      res.send({ message: "ok" });

    } catch (error) {
      new LogService().Log("Add entityuser", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add entityuser" });
    }
  }

  async deleteEntityUser(req: Request, res: Response) {
    try {
      let guids = req.query.entityuserids.split(',');

      const entityUserService = new EntityUserService();

      const entityIds = await entityUserService.deleteDirectEntity(guids);

      const logEntriesService = new LogEntriesService();
      await logEntriesService.log(entityIds, 'Delete', res.locals.user.UserId, `Entity is deleted from User ${res.locals.user.UserId}`)
      res.send({ message: "ok" })

    } catch (error) {
      new LogService().Log("Delete entityusers", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't delete entityusers" });
    }
  }
}
