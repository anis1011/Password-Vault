import { Request, Response } from "express";
import { EntityUserService } from "../Service/EntityUserService";
import { LogService } from "../Service/LogService";

export class UserOwnedEntitiesController {

  async getUserOwnedEntity(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const entityUserService = new EntityUserService();

      let queryString: any = {
        name: req.query.name.trim(),
        entitytypeguid: req.query.entitytypeguid,
        projectguid: req.query.projectguid,
        flag: req.query.flag
      };

      const entities = await entityUserService
        .getUserOwnedEntities(page, pagesize, res.locals.user.UserId, queryString, Object.keys(req.query)[2])

      if (entities == null) {
        new LogService().Log('Get userownedentity', 'I', 'Rest service', res.locals.user.UserId, null, 'useronwedentity not found', null);
        return res.status(404).send({ message: "No record found" });
      }
      res.header("x-page-totalcount", `${entities.totalcount}`);
      res.json(entities.data);
    } catch (error) {
      new LogService().Log('Get userownedentity', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't get userentity" });
    }
  }

  async getSingleEntity(req: Request, res: Response) {
    try {
      const guid: string = req.params.guid;

      const entityUserService = new EntityUserService();
      await entityUserService.update({ guid: guid, lastseenat: Date.now() }, true);
      const entity = await entityUserService.getSingleEntity(guid, res.locals.user)
      res.json(entity);
    }
    catch (error) {
      console.log(error.message);
      console.log(error.stack);
      new LogService().Log('Get userownedentities', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get userentity" });
    }
  }

  async addFavourite(req: Request, res: Response) {
    try {
      const entityUserService = new EntityUserService();
      await entityUserService.addFavouriteEntity(req.body);
      res.send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Add favourite', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't add userentity" });
    }
  }

  async getmyentities(req, res) {
    try {
      const users = res.locals.user;
      let data = await new EntityUserService().getMyEntities(users)
      res.send(data)
    } catch (error) {
      new LogService().Log('Get userownedentities', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't get myentity" });
    }
  }
}
