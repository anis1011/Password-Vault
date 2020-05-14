import { Request, Response } from "express";
import { EntityProjectService } from "../Service/EntityProjectService";
import { LogService } from "../Service/LogService";
import { LogEntriesService } from './../Service/LogEntriesService';

export class EntityProjectController {

  async getEntityProjects(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const entityProjectService = new EntityProjectService();
      const logService = new LogService();

      let queryString: any = {};

      if (req.query.name.trim()) {
        queryString.name = req.query.name.trim();
      }

      if (req.query.entitytypeguid) {
        queryString.entitytypeguid = req.query.entitytypeguid;
      }

      if (req.query.projectguid) {
        queryString.projectguid = req.query.projectguid;
      }

      if (req.query.entityguid) {
        queryString.entityguid = req.query.entityguid;
      }

      if (req.query.flag) {
        queryString.flag = parseInt(req.query.flag);
      }

      let entityprojects = await entityProjectService
        .getAssignableAndUnassignableEntitiesOrProjects(page, pagesize, queryString);

      if (!entityprojects) {
        logService.Log("entityprojects get entityprojects", "I", "Rest Service", res.locals.user.UserId, null, "entityproject not added yet !", null);
        return res.status(404).send({ message: "No record found" });
      }

      res.header("x-page-totalcount", `${entityprojects.totalcount}`);
      res.send(entityprojects.data);
    } catch (error) {
      new LogService().Log("Get entityprojects", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get entityprojects" });
    }
  }

  async addProjectEntity(req: Request, res: Response) {
    try {
      let objects = req.body;

      const entityProjectService = new EntityProjectService();
      const entityIds = await entityProjectService.addProjectEntity(objects);

      const logEntriesService = new LogEntriesService();
      await logEntriesService.log(entityIds, "Add", res.locals.user.UserId, "Entity is added to Project")
      res.status(200).send({ message: "ok" })

    } catch (error) {
      new LogService().Log("Add entityprojects", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add entityprojects" });
    }
  }

  async deleteEntityProject(req: Request, res: Response) {
    try {
      let guids = req.query.entityprojectids.split(',');
      let entityIds = [];
      let entityProjectService = new EntityProjectService();

      for (let index = 0; index < guids.length; index++) {
        let entityid = await entityProjectService.getId(guids[index], "entityid")
        entityIds.push(entityid);
      }
      await entityProjectService.deleteAll(guids);
      const logEntriesService = new LogEntriesService();
      await logEntriesService.log(entityIds, "Delete", res.locals.user.UserId, "Entity is Deleted from Project");
      res.send({ message: "ok" });

    } catch (error) {
      new LogService().Log("Delete entityprojects", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't delete entityprojects" });
    }
  }
}
