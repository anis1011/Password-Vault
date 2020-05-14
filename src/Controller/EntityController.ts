import { Request, Response } from "express";
import { EntityGroupService } from "../Service/EntityGroupService";
import { EntityProjectService } from "../Service/EntityProjectService";
import { EntityService } from "../Service/EntityService";
import { EntityTypeService } from "../Service/EntityTypeService";
import { EntityUserService } from "../Service/EntityUserService";
import { GroupService } from "../Service/GroupService";
import { LocationService } from "../Service/LocationService";
import { LogEntriesService } from "../Service/LogEntriesService";
import { LogService } from "../Service/LogService";
import { ProjectService } from "../Service/ProjectService";
import { ProjectUserService } from "../Service/ProjectUserService";
import { StatusService } from "../Service/StatusService";
import { UserService } from "../Service/UserService";
import { LogActionService } from "./../Service/LogActionService";

export class EntityController {

  async getEntities(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      let queryString: object = {
        name: req.query.name.trim(),
        projectguid: req.query.projectguid,
        groupguid: req.query.groupguid,
        entitytypeguid: req.query.entitytypeguid,
      };

      const entityService = new EntityService();
      let entities = await entityService
        .getEntitiesWithPage(page, pagesize, queryString)
      if (entities == null) {
        new LogService().Log("Entity get entities", "I", "Rest Service", res.locals.user.UserId, null, "Entity not added yet !", null);
        res.send(404).send({ message: "No record found" });
      } else {
        res.header("x-page-totalcount", `${entities.totalcount}`);
        res.json(entities.data);
      }
    } catch (error) {
      new LogService().Log("Getentity", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get entities" });
    }
  }

  async getEntityById(req: Request, res: Response) {
    try {
      const guid: string = req.params.guid;
      let responseData: any = {};
      let queryString: any = { flag: 1, entityguid: guid };
      let userHeader: string, projectHeader: string, groupHeader: string;

      const entityService = new EntityService();
      const entityUserService = new EntityUserService();
      const entityProjectService = new EntityProjectService();
      const entityGroupService = new EntityGroupService();
      const logEntriesService = new LogEntriesService();

      await entityUserService
        .getAssignableAndUnassignableEntitiesOrUsers(1, 20, queryString)
        .then((res) => {
          responseData.Users = res.data;
          userHeader = res.totalcount.toString();
        });

      await entityProjectService
        .getAssignableAndUnassignableEntitiesOrProjects(1, 20, queryString)
        .then((res) => {
          responseData.Projects = res.data;
          projectHeader = res.totalcount.toString();
        });

      await entityGroupService
        .getAssignableAndUnassignableEntitiesOrGroups(1, 20, queryString)
        .then((res) => {
          responseData.Groups = res.data;
          groupHeader = res.totalcount.toString();
        });

      await entityService
        .getSingleEntity(guid, res.locals.user.EncryptionKey)
        .then(async entity => {
          let entityids = [];
          let entityid = await entityService.getId(entity.guid, "entityid");
          entityids.push(entityid);
          logEntriesService.log(entityids, "View", res.locals.user.UserId);
          responseData.Entity = entity;
        });
      res.header("UserLink", userHeader);
      res.header("GroupLink", groupHeader);
      res.header("ProjectLink", projectHeader);
      res.send(responseData);

    } catch (error) {
      new LogService().Log("Get entity ById", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get entity" });
    }
  }

  async getEntitiesByEntityType(req: Request, res: Response) {
    try {
      const page = req.query.page;
      const pagesize = req.query.pagesize;
      const entitytype = req.query.entitytype;

      const entityService = new EntityService();

      let result = await entityService
        .getEntitiesByEntityType(entitytype, page, pagesize)
      if (result == null) {
        new LogService().Log("Entity get EntityByEntityType", "I", "Rest Service", res.locals.user.UserId, null, "Entity by EntityType is not found! !", null);
        res.send(404).send("Entities by EntityType not found!");
      } else {
        res.json(result);
      }
    } catch (error) {
      new LogService().Log("Get entity by entitytypes", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get entities" });
    }
  }

  async getDropDownListForUser(req: Request, res: Response) {
    try {
      let responseData: any = {};

      const entityTypeService = new EntityTypeService();
      const projectUserService = new ProjectUserService();

      await entityTypeService
        .find(["guid", "name"], "name")
        .then((res: any) => {
          responseData.EntityType = res;
        });

      await projectUserService
        .getAllProjectForUsers(res.locals.user.UserId)
        .then((res: any) => {
          responseData.Project = res[0];
        });

      res.send(responseData);

    } catch (error) {
      new LogService().Log("Get dropdownuser", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get userdropdownlist" });
    }
  }

  async getDropDownListForAdmin(req: Request, res: Response) {
    try {
      let responseData: any = {};

      const entityService = new EntityService();
      const entityTypeService = new EntityTypeService();
      const projectService = new ProjectService();
      const groupService = new GroupService();
      const locationService = new LocationService();
      const logactionService = new LogActionService();
      const statusService = new StatusService();
      const userService = new UserService();

      responseData.EntityType = await entityTypeService.find(["guid", "name"], "name")

      responseData.Project = await projectService.find(["guid", "name", "description"], "name")

      responseData.Group = await groupService.find(["guid", "description"], "description")

      responseData.LogAction = await logactionService.find(["guid", "logactionname"], "logactionname")

      responseData.User = await userService.find(["guid", "name"], "name")

      responseData.Radmin = await entityService.getEntitiesByEntityType("Radmin", 0, 0)

      responseData.VNC = await entityService.getEntitiesByEntityType("VNC", 0, 0)

      responseData.SSH = await entityService.getEntitiesByEntityType("SSH", 0, 0)

      responseData.RDP = await entityService.getEntitiesByEntityType("RDP", 0, 0)

      responseData.Location = await locationService.find(["guid", "location"], "location")

      responseData.Status = await statusService.find(["guid", "status"], "status")

      res.send(responseData);

    } catch (error) {
      new LogService().Log("Get dropdownadmin", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get admindropdownlist" });
    }
  }

  async addEntity(req: Request, res: Response) {
    try {
      let entity = req.body;
      const entitytypeService = new EntityTypeService();
      const entityService = new EntityService();
      const locationService = new LocationService();
      const logentriesService = new LogEntriesService();
      const logService = new LogService();
      const statusService = new StatusService();

      if (!entity.name) {
        throw ({ message: "Entity name is required!" });
      }
      else if (!entity.entitytypeguid) {
        throw ({ message: "Entity type is required!" });
      }
      else {
        entity.entitytypeid = await entitytypeService.getId(entity.entitytypeguid, "entitytypeid");

        entity.locationid = await locationService.getId(entity.locationguid, "locationid");

        entity.statusid = await statusService.getId(entity.statusguid, "statusid");

        entity.radmin = await entityService.getId(entity.radminguid, "entityid");

        entity.vnc = await entityService.getId(entity.vncguid, "entityid");

        entity.rdp = await entityService.getId(entity.rdpguid, "entityid");

        entity.ssh = await entityService.getId(entity.sshguid, "entityid");

        return await entityService
          .addEntity(entity, res.locals.user.EncryptionKey)
          .then((entity: any) => {
            logService.Log("Entity Added", "I", "Rest Service", res.locals.user.UserId, null, "Entity Added", null);
            let entityIds = [];
            entityIds.push(entity["entityid"]);
            logentriesService.log(entityIds, "Add", res.locals.user.UserId);
            res.status(200).send({ guid: entity.guid });
          });
      }
    } catch (error) {
      new LogService().Log("Add entity", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add entity", description: error.message });
    }
  }

  async updateEntity(req: Request, res: Response) {
    try {

      let entity: any = req.body;

      const entityService = new EntityService();
      const entityUserService = new EntityUserService();
      const entityTypeService = new EntityTypeService();
      const locationService = new LocationService();
      const logService = new LogService();
      const statusService = new StatusService();
      if (!entity.name.trim()) {
        throw ({ message: "Entity name is required!" });
      }
      else if (!entity.entitytypeguid) {
        throw ({ message: "Entity type is required!" });
      }
      else {
        entity.entitytypeid = await entityTypeService.getId(entity.entitytypeguid, "entitytypeid");

        entity.locationid = await locationService.getId(entity.locationguid, "locationid");

        entity.statusid = await statusService.getId(entity.statusguid, "statusid");

        entity.radmin = await entityService.getId(entity.radminguid, "entityid");

        entity.vnc = await entityService.getId(entity.vncguid, "entityid");

        entity.rdp = await entityService.getId(entity.rdpguid, "entityid");

        await entityUserService.updateAllRelatedEntities(entity, res.locals.user.EncryptionKey);

        await entityService.updateEntity(entity, res.locals.user.EncryptionKey)

        logService.Log("Entity Updated", "I", "Rest Service", res.locals.user.UserId, null, "Entity Updated", null);
        let entityIds = [];
        const entityId = await entityService.getId(entity.guid, "entityid");
        entityIds.push(entityId);

        const logEntriesService = new LogEntriesService();
        await logEntriesService.log(entityIds, 'Change', res.locals.user.UserId, null);
        res.status(200).send({ message: "ok" });
      }
    } catch (error) {
      new LogService().Log("Getentity", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't update entity", description: error.message });
    }
  }

  async deleteEntity(req: Request, res: Response) {
    try {
      let guids = req.query.entityids.split(',');
      const entityService = new EntityService();
      const entityGroupService = new EntityGroupService();
      const entityProjectService = new EntityProjectService();
      const entityUserService = new EntityUserService();
      const logentriesService = new LogEntriesService();

      let entityids: any[] = [];
      let entityidsForRadmin: any[] = [];
      let entityidsForVnc: any[] = [];
      let entityidsForRdp: any[] = [];
      let entityidsForSsh: any[] = [];

      for (let index = 0; index < guids.length; index++) {

        await entityService.getId(guids[index], "entityid")
          .then(id => {
            entityids.push({ entityid: id, datedeleted: null });
            entityidsForRadmin.push({ radmin: id, datedeleted: null });
            entityidsForVnc.push({ vnc: id, datedeleted: null });
            entityidsForRdp.push({ rdp: id, datedeleted: null });
            entityidsForSsh.push({ ssh: id, datedeleted: null });
          });
      }

      let existOnEntityRadmin: any = await entityService.checkExisting(entityidsForRadmin);

      if (existOnEntityRadmin) {
        throw { message: `Couldn't delete the entity. Exists in entity Radmin: ${existOnEntityRadmin.name}` };
      }

      let existOnEntityVnc: any = await entityService.checkExisting(entityidsForVnc);

      if (existOnEntityVnc) {
        throw { message: `Couldn't delete the entity. Exists in entity Vnc: ${existOnEntityVnc.name}` };
      }

      let existOnEntityRdp: any = await entityService.checkExisting(entityidsForRdp);

      if (existOnEntityRdp) {
        throw { message: `Couldn't delete the entity. Exists in entity Rdp: ${existOnEntityRdp.name}` };
      }

      let existOnEntitySsh: any = await entityService.checkExisting(entityidsForSsh);

      if (existOnEntitySsh) {
        throw { message: `Couldn't delete the entity. Exists in entity Vnc: ${existOnEntitySsh.name}` };
      }

      let existOnGroups = await entityGroupService.checkExisting(entityids);

      if (existOnGroups) {
        throw { message: `Couldn't delete the entity. Exists in Group` };
      }

      let existOnProject = await entityProjectService.checkExisting(entityids);

      if (existOnProject) {
        throw { message: `Couldn't delete the entity. Exists in Project` };
      }

      let existOnUser = await entityUserService.checkExisting(entityids);

      if (existOnUser) {
        throw { message: `Couldn't delete the entity. Exists in User` };
      }

      await entityService.deleteAll(guids)

      let entityIds = [];

      entityids.forEach((id) => {
        entityIds.push(id.entityid)
      })
      logentriesService.log(entityIds, "Delete", res.locals.user.UserId);
      res.status(200).send({ message: "ok" });

    }
    catch (error) {
      new LogService().Log("Delete entity", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't delete entity", description: error.message });
    }
  }
}