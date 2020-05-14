import { reject } from 'bluebird';
import { Request, Response } from "express";
import { Validation } from "../Lib/Common/Validation";
import { EntityUserService } from "../Service/EntityUserService";
import { GroupUserService } from "../Service/GroupUserService";
import { LogService } from "../Service/LogService";
import { ProjectUserService } from "../Service/ProjectUserService";
import { UserService } from "../Service/UserService";
import { Sequelize } from './../Repository/Sequelize';
import { UserLoginInfoService } from '../Service/UserLoginInfoService';

export class UserController {

  async getUsers(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const logService = new LogService();
      const userService = new UserService();

      let queryString: any = {};
      if (req.query.name.trim()) {
        queryString.name = userService.getQueryStringName(req.query.name.trim());
      }

      return await userService
        .finds(page, pagesize, queryString, Object.keys(req.query)[2], ["guid", "name", "email", ["isadminyesno", "isadmin"]])
        .then((users) => {
          if (!users) {
            logService.Log("Users get Users", "I", "Rest Service", res.locals.user.UserId, null, "User not added yet !", null);
            res.status(404).send({ message: "No record found" });
          }
          res.header("x-page-totalcount", `${users.totalcount}`);
          res.send(users.data);
        });
    } catch (error) {
      new LogService().Log('Get users', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't get users" });
    }
  }

  async getUser(req: Request, res: Response) {
    try {
      const guid: string = req.params.guid;
      let responseData: any = {};
      let queryString: any = { userguid: guid, flag: 1 };
      let entityHeader: string, projectHeader: string, groupHeader: string;

      const entityUserService = new EntityUserService();
      await entityUserService
        .getAssignableAndUnassignableEntitiesOrUsers(1, 20, queryString)
        .then((entity) => {
          responseData.Entities = entity.data;
          entityHeader = entity.totalcount.toString();
        });

      const projectUserService = new ProjectUserService();
      await projectUserService
        .getAssignableAndUnassignableProjectsOrUsers(1, 20, queryString)
        .then((projects) => {
          responseData.Projects = projects.data;
          projectHeader = projects.totalcount.toString();
        });

      const groupUserService = new GroupUserService();
      await groupUserService
        .getAssignableAndUnassignableGroupsOrUsers(1, 20, queryString)
        .then((groups) => {
          responseData.Groups = groups.data;
          groupHeader = groups.totalcount.toString();
        });

      const userService = new UserService();
      const logService = new LogService();
      await userService.getContext()
        .find({ where: { guid: guid }, attributes: ['guid', 'name', 'email', 'isadminyesno'] })
        .then((user) => {
          if (!user) {
            logService.Log("User get User", "I", "Rest Service", res.locals.user.UserId, null, "user not found", null);
            return res.status(404).send({ message: "No record found" });
          } else {
            responseData.User = user;
          }
        });
      res.header("EntityLink", entityHeader);
      res.header("ProjectLink", projectHeader);
      res.header("GroupLink", groupHeader);
      res.send(responseData);
    }
    catch (error) {
      new LogService().Log('Get user', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't get user" });
    }
  }

  async addUser(req: Request, res: Response) {
    try {
      let user = req.body;
      let schema = Validation.getSchema({
        name: Validation.Joi.string().required(),
        email: Validation.Joi.string().required(),
        password: Validation.Joi.string().regex(
          /((?=.*\d)(?=.*[a-z])(?=.*\W).{8,15})/
        ),
        isadminyesno: Validation.Joi.number().required()
      });

      let err = Validation.getError(user, schema);
      if (err) {
        new LogService().Log("Add user", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }

      const userService = new UserService();
      const userEmail: any = await userService.getContext().count({ where: { datedeleted: null, email: user.email } });

      if (userEmail) {
        new LogService().Log("Add user", "E", "Rest service", res.locals.user.UserId, null, null, null);
        return res.status(500).send({ message: "Email already exists" });
      }
      let users: any = await userService.addUser(user, res.locals.user.EncryptionKey)
      res.send({ guid: users.guid });
    } catch (error) {
      new LogService().Log('Add user', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't add user" });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      let user = req.body;
      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required(),
        name: Validation.Joi.string().required(),
        email: Validation.Joi.string().required(),
        isadminyesno: Validation.Joi.number().required()
      });

      let err = Validation.getError(user, schema);

      if (err) {
        new LogService().Log("Update user", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      const userService = new UserService();

      let userEmail: any = await userService.checkExistingEmail(user.email, user.guid);

      if (userEmail) {
        new LogService().Log('Update users', 'E', 'Rest Service', res.locals.user.UserId, null, null, null)
        return res.status(500).send({ message: "Email already exists" });
      }
      await userService.updateUser(user, res.locals.user.EncryptionKey)
      res.send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Update users', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't update user" });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      let user: any = { guid: req.body.guid, password: req.body.newpassword };

      new LogService().Log("Change password", "E", "Rest service", res.locals.user.UserId, null, user.guid, null);


      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required(),
        password: Validation.Joi.string().regex(
          /((?=.*\d)(?=.*[a-z])(?=.*\W).{8,15})/
        )
      });

      let err = Validation.getError(user, schema);

      if (err) {
        new LogService().Log("Change password", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        res.status(422).send({ message: `Invalid data request` });
      } else {

        Sequelize.transaction({ autocommit: false }).then(async t => {
          try {
            const userservice = new UserService();
            let userFromDb: any = await userservice.getContext().find({ attributes: ['userid', 'email', 'isadminyesno'], where: { guid: user.guid, datedeleted: null } })

            await userservice.changePassword(user, userFromDb, res.locals.user.EncryptionKey, t);

            await new UserLoginInfoService().clearPreviousSession(userFromDb.userid, t);

            let objemail: any = await userservice.getContext().find({ attributes: ['email'], where: { datedeleted: null, guid: user.guid } });
            user.email = objemail.email;

            await new EntityUserService().updateAllUserEntities(user, res.locals.user.EncryptionKey, t)

            await t.commit();
            res.status(200).send({ message: "ok" })
          }
          catch (e) {
            await t.rollback();
            new LogService().Log('Change password', 'E', 'Rest Service', res.locals.user.UserId, null, e.message, e.stack);
            res.status(500).send({ message: "Couldn't change passsword" });
            // return reject(0);
          }
        })
      }
    } catch (error) {
      new LogService().Log('Change password', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't change password" });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      let guids = req.query.userids.split(',');

      const userService = new UserService();
      await userService.deleteUser(guids)
      res.send({ message: "ok" });
    } catch (error) {
      new LogService().Log('Delete users', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't delete users" });
    }
  }
}
