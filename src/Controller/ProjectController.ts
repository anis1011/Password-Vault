import { Request, Response } from "express";
import { Validation } from "../Lib/Common/Validation";
import { EntityProjectService } from "../Service/EntityProjectService";
import { LogService } from "../Service/LogService";
import { ProjectService } from "../Service/ProjectService";
import { ProjectUserService } from "../Service/ProjectUserService";

export class ProjectController {

  async getProjects(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const logService = new LogService();
      const projectService = new ProjectService();

      let queryString: any = {};

      if (req.query.name.trim()) {
        queryString.name = projectService.getQueryStringName(req.query.name.trim());
      }

      if (req.query.description.trim()) {
        queryString.description = projectService.getQueryStringName(req.query.description.trim());
      }

      const projects = await projectService
        .finds(page, pagesize, queryString, Object.keys(req.query)[2], ["guid", "name", "description"])
      if (!projects) {
        logService.Log("Project getProjects", "I", "Rest Service", res.locals.user.UserId, null, "project not added yet  !", null);
        return res.status(404).send({ message: "No record found" });
      }

      res.header("x-page-totalcount", `${projects.totalcount}`);
      res.json(projects.data);
    } catch (error) {
      new LogService().Log('Get projects', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get projects" });
    }
  }

  async getProject(req: Request, res: Response) {
    try {
      const guid: string = req.params.guid;
      let responseData: any = {};
      let queryString: any = { projectguid: guid, flag: 1 };
      let entityHeader: string, userHeader: string;

      const entityProjectService = new EntityProjectService();
      let entityprojects: any = await entityProjectService
        .getAssignableAndUnassignableEntitiesOrProjects(1, 20, queryString)

      responseData.Entities = entityprojects.data;
      entityHeader = entityprojects.totalcount.toString();

      const projectUserService = new ProjectUserService();
      let projectUser = await projectUserService
        .getAssignableAndUnassignableProjectsOrUsers(1, 20, queryString)
      responseData.Users = projectUser.data;
      userHeader = projectUser.totalcount.toString();
      const projectService = new ProjectService();
      const logService = new LogService();

      let project = await projectService.findById(guid);

      if (!project) {
        logService.Log("Project getProject", "I", "Rest Service", res.locals.user.UserId, null, "project not found  !", null);
        return res.status(404).send({ message: "No record found" });
      }
      project = {
        guid: project["guid"],
        name: project["name"],
        description: project["description"]
      };
      responseData.Project = project;

      res.header("EntityLink", entityHeader);
      res.header("UserLink", userHeader);
      res.send(responseData);
    } catch (error) {
      new LogService().Log('Get project ', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get project" });
    }
  }

  async addProject(req: Request, res: Response) {
    try {
      let project: any = req.body;

      let schema = Validation.getSchema({
        name: Validation.Joi.string().required(),
        description: Validation.Joi.string().required()
      });

      let err = Validation.getError(project, schema);
      if (err) {
        new LogService().Log("Add project", "E", "Rest service", null, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });

      }
      const projectService = new ProjectService();
      const Project: any = await projectService.create(project)
      res.status(200).send({ guid: Project.guid });
    } catch (error) {
      new LogService().Log('Add project', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add project" });
    }
  }

  async updateProject(req: Request, res: Response) {
    try {
      let project = req.body;

      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required(),
        name: Validation.Joi.string().required(),
        description: Validation.Joi.string().required()
      });

      let err = Validation.getError(project, schema);
      if (err) {
        new LogService().Log("Add project", "E", "Rest service", null, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      const projectService = new ProjectService();
      await projectService.update(project)
      res.status(200).send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Update project', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't update project" });
    }
  }

  async deleteProject(req: Request, res: Response) {
    try {
      let guids = req.query.projectids.split(',');
      let projectService = new ProjectService();
      let projectIds: any[] = [];

      for (let index = 0; index < guids.length; index++) {
        let projectid = await projectService.getId(guids[index], "projectid")
        projectIds.push({ projectid: projectid, datedeleted: null })
      }

      let entityProjectService = new EntityProjectService();
      let existOnEntity = await entityProjectService.checkExisting(projectIds);

      let projectUserService = new ProjectUserService();
      let existOnUser = await projectUserService.checkExisting(projectIds);

      if (existOnEntity || existOnUser) {
        throw { message: "Couldn't delete project" };
      }
      await projectService.deleteAll(guids)
      res.status(200).send({ message: "ok" });

    } catch (error) {
      new LogService().Log('delete projects', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't delete projects" });
    }
  }
}
