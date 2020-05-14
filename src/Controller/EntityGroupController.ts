import { Request, Response } from "express";
import { LogService } from "../Service/LogService";
import { EntityGroupService } from './../Service/EntityGroupService';
import { LogEntriesService } from './../Service/LogEntriesService';

export class EntityGroupController {

  async getEntityGroups(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);
      const entityGroupService = new EntityGroupService();
      const logService = new LogService();

      let queryString: any = {};

      if (req.query.name.trim()) {
        queryString.name = req.query.name.trim();
      }

      if (req.query.entitytypeguid) {
        queryString.entitytypeguid = req.query.entitytypeguid;
      }

      if (req.query.groupguid) {
        queryString.groupguid = req.query.groupguid;
      }

      if (req.query.entityguid) {
        queryString.entityguid = req.query.entityguid;
      }

      if (req.query.flag) {
        queryString.flag = parseInt(req.query.flag);
      }

      const entityGroup = await entityGroupService
        .getAssignableAndUnassignableEntitiesOrGroups(page, pagesize, queryString);

      if (!entityGroup) {
        logService.Log("entityGroup get entityGroup", "I", "Rest Service", res.locals.user.UserId, null, "entityproject not added yet !", null);
        return res.status(404).send({ message: "No record found" });
      }

      res.header("x-page-totalcount", `${entityGroup.totalcount}`);
      res.send(entityGroup.data);
    } catch (error) {
      new LogService().Log("Get entitygroups", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get entitygroups" });
    }
  }

  async addEntityGroup(req: Request, res: Response) {
    try {
      const entityGroupService = new EntityGroupService();
      let obj = req.body;
      let data = await entityGroupService.addEntityGroup(obj);

      const logEntriesService = new LogEntriesService();
      await logEntriesService.log(data, 'Add', res.locals.user.UserId, `Entity is added to Group`);
      res.send({ message: "ok" })
    } catch (error) {
      new LogService().Log("Add entitygroups", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add entitygroup" });
    }
  }

  async deleteEntityGroup(req: Request, res: Response) {
    try {
      const entityGroupService = new EntityGroupService();
      let guids = req.query.entitygroupids.split(',');
      let entityIds = [];
      for (let index = 0; index < guids.length; index++) {
        let entityid = await entityGroupService.getId(guids[index], "entityid")
        entityIds.push(entityid);
      }
      await entityGroupService.deleteAll(guids)

      const logEntriesService = new LogEntriesService();
      await logEntriesService.log(entityIds, 'Delete', res.locals.user.UserId, `Entity is deleted from Group`)
      res.send({ message: "ok" })

    } catch (error) {
      new LogService().Log("Delete entitygroups", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.send(500).send({ message: "Couldn't delete entitygroup" });
    }
  }
}
