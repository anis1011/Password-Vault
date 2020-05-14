import { Request, Response } from "express";
import { Validation } from "../Lib/Common/Validation";
import { EntityService } from "../Service/EntityService";
import { EntityTypeService } from "../Service/EntityTypeService";
import { LogService } from "../Service/LogService";

export class EntityTypeController {

  async getEntityTypes(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const entityTypeService = new EntityTypeService();
      const logService = new LogService();

      let queryString: any = {};

      if (req.query.name.trim()) {
        queryString.name = entityTypeService.getQueryStringName(req.query.name.trim());
      }

      const entities = await entityTypeService
        .finds(page, pagesize, queryString, Object.keys(req.query)[2], ["guid", "name"]);

      if (!entities) {
        logService.Log("Entity type  get Entity types", "I", "Rest Service", res.locals.user.UserId, null, "entitytype not added yet !", null);
        return res.status(404).send({ message: "No record found" });
      }
      res.header("x-page-totalcount", `${entities.totalcount}`);
      res.json(entities.data);
    } catch (error) {
      new LogService().Log("Get entitytypes", "E", "Rest service", null, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get entitytypes" });
    }
  }

  async getEntityType(req: Request, res: Response) {
    try {
      const guid: string = req.params.guid;
      let entityType = { guid: guid };

      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required()
      });

      let err = Validation.getError(entityType, schema);

      if (err) {
        new LogService().Log("Add entitytype", "E", "Rest service", null, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }

      const entityTypeService = new EntityTypeService();
      const logService = new LogService();

      let entitytype = await entityTypeService.findById(guid)
      if (!entitytype) {
        logService.Log("Entity type  get Entity type", "I", "Rest Service", res.locals.user.UserId, null, "EntityType not found", null);
        return res.status(404).send({ message: "No record found" });
      }
      res.json({ guid: entitytype["guid"], name: entitytype["name"] });
    } catch (error) {
      new LogService().Log("Get entitytypes", "E", "Rest service", null, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get entitytype" });
    }
  }

  async addEntityType(req: Request, res: Response) {
    try {
      let entityType: any = req.body;

      let schema = Validation.getSchema({
        name: Validation.Joi.string().required()
      });

      let err = Validation.getError(entityType, schema);

      if (err) {
        new LogService().Log("Add entitytypes", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      const entityTypeService = new EntityTypeService();

      const entitytype: any = await entityTypeService.create(entityType)
      res.status(200).send({ guid: entitytype.guid });
    } catch (error) {
      new LogService().Log("Delete entitygroups", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add entitytype" });
    }
  }

  async updateEntityType(req: Request, res: Response) {
    try {
      let entityType = req.body;

      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required(),
        name: Validation.Joi.string().required()
      });

      let err = Validation.getError(entityType, schema);

      if (err) {
        new LogService().Log("Update entitytype", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      const entityTypeService = new EntityTypeService();
      await entityTypeService.update(entityType)
      res.status(200).send({ message: "ok" });
    } catch (error) {
      new LogService().Log("Update entitytype", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't update entitytype" });
    }
  }

  async deleteEntityType(req: Request, res: Response) {
    try {
      let guids = req.query.entitytypeids.split(',');

      const entityService = new EntityService();
      const entityTypeService = new EntityTypeService();

      let entityTypeIds: any[] = [];
      for (let index = 0; index < guids.length; index++) {
        let entitytypeid = await entityTypeService.getId(guids[index], "entitytypeid")
        entityTypeIds.push({ entitytypeid: entitytypeid, datedeleted: null });
      }

      let existOnEntity: any = await entityService.checkExisting(entityTypeIds);

      if (existOnEntity) {
        new LogService().Log("Delete entitytype", "E", "Rest service", res.locals.user.UserId, null, null, null);
        return res.status(400).send({ message: `Couldn't delete EntityType. Exists in entity : ${existOnEntity.name}` });
      }
      
      await entityTypeService.deleteAll(guids)
      res.status(200).send({ message: "ok" });
    } catch (error) {
      new LogService().Log("Delete entitytype", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't delete entitytypes" });
    }
  }
}
