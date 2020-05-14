import { Request, Response } from "express";
import { Validation } from "../Lib/Common/Validation";
import { EntityGroupService } from "../Service/EntityGroupService";
import { GroupService } from "../Service/GroupService";
import { GroupUserService } from "../Service/GroupUserService";
import { LogService } from "../Service/LogService";

export class GroupController {

  async getGroups(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const groupService = new GroupService();
      const logService = new LogService();


      let queryString: any = {};
      if (req.query.description.trim()) {
        queryString.description = groupService.getQueryStringName(req.query.description.trim());
      }

      let groups = await groupService
        .finds(page, pagesize, queryString, Object.keys(req.query)[2], ["guid", "description"]);

      if (groups == null) {
        logService.Log("Group get Groups", "I", "Rest Service", res.locals.user.UserId, null, "group not added yet !", null);
        return res.send(404).send({ message: "No record found" });
      }
      res.header("x-page-totalcount", `${groups.totalcount}`);
      res.json(groups.data);

    } catch (error) {
      new LogService().Log("Get groups", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get groups" });
    }
  }

  async getGroup(req: Request, res: Response) {
    try {
      const guid: string = req.params.guid;
      let queryString: any = { groupguid: guid, flag: 1 };
      let responseData: any = {};
      let entityHeader: string, userHeader: string;

      const entityGroupService = new EntityGroupService();
      await entityGroupService
        .getAssignableAndUnassignableEntitiesOrGroups(1, 20, queryString)
        .then((entity) => {
          responseData.Entities = entity.data;
          entityHeader = entity.totalcount.toString();
        });

      const groupUserService = new GroupUserService();
      await groupUserService
        .getAssignableAndUnassignableGroupsOrUsers(1, 20, queryString)
        .then((users) => {
          responseData.Users = users.data;
          userHeader = users.totalcount.toString();
        })

      const groupService = new GroupService();
      let group = await groupService.findById(guid);

      responseData.Group = {
        guid: group["guid"],
        description: group["description"]
      };

      res.header("EntityLink", entityHeader);
      res.header("UserLink", userHeader);
      res.send(responseData);

    } catch (error) {
      new LogService().Log("Get group", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get group" });
    }
  }

  async addGroups(req: Request, res: Response) {
    try {
      let group: any = req.body;

      const groupService = new GroupService();
      let schema = Validation.getSchema({
        description: Validation.Joi.string().required()
      });

      let err = Validation.getError(group, schema);

      if (err) {
        new LogService().Log("Add group", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      const groups: any = await groupService.create(group)
      res.status(200).send({ guid: groups.guid })
    } catch (error) {
      new LogService().Log("Add group", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add group" });
    }
  }

  async updateGroup(req: Request, res: Response) {
    try {
      let group: any = req.body;
      const groupService = new GroupService();

      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required(),
        description: Validation.Joi.string().required()
      });

      let err = Validation.getError(group, schema);

      if (err) {
        new LogService().Log("Update group", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      await groupService.update(group)
      res.status(200).send({ message: "ok" });
    } catch (error) {
      new LogService().Log("Update group", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't update group" });
    }
  }

  async deleteGroup(req: Request, res: Response) {
    try {
      let guids = req.query.groupids.split(',');

      const entityGroupService = new EntityGroupService();
      const groupService = new GroupService();
      const groupUserService = new GroupUserService();

      let groupIds: any[] = [];

      for (let index = 0; index < guids.length; index++) {
        let groupid = await groupService.getId(guids[index], "groupid")
        groupIds.push({ groupid: groupid, datedeleted: null })
      }

      let existOnEntity = await entityGroupService.checkExisting(groupIds);

      let existOnUser = await groupUserService.checkExisting(groupIds);

      if (existOnEntity || existOnUser) {
        throw { message: "Couldn't delete group" };
      }
      await groupService.deleteAll(guids)
      res.status(200).send({ message: "ok" });

    } catch (error) {
      new LogService().Log("Delete groups", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't delete groups" });
    }
  }
}
