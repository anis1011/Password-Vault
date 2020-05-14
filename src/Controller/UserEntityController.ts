import { Request, Response } from "express";
import { Validation } from "../Lib/Common/Validation";
import { EntityTypeService } from "../Service/EntityTypeService";
import { EntityUserService } from "../Service/EntityUserService";
import { LogService } from "../Service/LogService";

export class UserEntityController {

  async addUserEntity(req: Request, res: Response) {
    try {
      let entity: any = {
        name: req.body.key,
        passwordvalue: req.body.value,
      };

      let schema = Validation.getSchema({
        name: Validation.Joi.string().required(),
        passwordvalue: Validation.Joi.string().required(),
      });

      let err = Validation.getError(entity, schema);
      if (err) {
        new LogService().Log("Add userentity", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }

      const entityTypeService = new EntityTypeService();
      entity.entitytypeid = await entityTypeService.getMyEntityTypeId();
      const entityUserService = new EntityUserService();
      await entityUserService.addMyEntity(entity, res.locals.user)
      res.status(200).send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Add userentity', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't add userentity" });
    }
  }

  async updateUserEntity(req: Request, res: Response) {
    try {
      let entity: any = {
        guid: req.body.guid,
        name: req.body.key,
        passwordvalue: req.body.value
      };

      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required(),
        name: Validation.Joi.string().required(),
        passwordvalue: Validation.Joi.string().required()
      });

      let err = Validation.getError(entity, schema);
      if (err) {
        new LogService().Log("Update userentity", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      const entityTypeService = new EntityTypeService();
      entity.entitytypeid = await entityTypeService.getMyEntityTypeId();

      const entityUserService = new EntityUserService();
      await entityUserService.updateMyEntity(entity, res.locals.user)

      res.status(200).send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Update userentity', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't update userentity" });
    }
  }

  async DeleteUserEntity(req: Request, res: Response) {
    try {
      const guid: string = req.params.guid;

      const entityUserService = new EntityUserService();
      await entityUserService.delete(guid)
      res.send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Delete userentity', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't delete userentity" });
    }
  }
}
