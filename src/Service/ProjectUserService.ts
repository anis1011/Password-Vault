import { reject } from "bluebird";
import { AppDbContext } from "../Repository/AppDbContext";
import { Sequelize } from "../Repository/Sequelize";
import { BaseService } from "./BaseService";
import { EntityService } from "./EntityService";
import { EntityUserService } from "./EntityUserService";
import { ProjectService } from "./ProjectService";
import { UserService } from "./UserService";

export class ProjectUserService extends BaseService {

  constructor() {
    super(new AppDbContext().ProjectUser());
  }

  //Get assigned and unassigned projects for user with page details and filter
  async getAssignableAndUnassignableProjectsOrUsers(page: number, pagesize: number, querystring: any) {

    try {
      let query: string, userId: number, projectId: number;
      if (querystring.userguid) {
        const userService = new UserService();
        userId = await userService.getId(querystring.userguid, "userid");
      }

      if (querystring.projectguid) {
        const projectService = new ProjectService();
        projectId = await projectService.getId(querystring.projectguid, "projectid")
      }

      if (querystring.flag == 0) {
        if (userId) {
          query = `SELECT p.Guid ProjectGuid, p.name
                FROM projects p
                WHERE p.datedeleted IS NULL AND p.projectid NOT IN 
                (SELECT projectid FROM projectusers WHERE userid = ${userId} AND datedeleted IS NULL)`;
        }
        if (projectId) {
          query = `SELECT u.guid UserGuid,u.name
                FROM users u
                WHERE datedeleted is NULL AND userid NOT IN
                (SELECT userid FROM projectusers WHERE projectid = ${projectId} AND datedeleted IS NULL)`
        }
      }
      if (querystring.flag == 1) {
        if (userId) {
          query = `SELECT pu.guid ProjectUserGuid, p.Guid ProjectGuid, p.name
                FROM projects p
                INNER JOIN projectusers pu ON p.projectid = pu.projectid
                WHERE p.datedeleted IS NULL AND pu.datedeleted IS NULL 
                AND userid = ${userId} AND p.projectid = pu.projectid`;
        }

        if (projectId) {
          query = `SELECT pu.guid ProjectUserGuid,u.name
                FROM users u
                INNER JOIN projectusers pu ON u.userid = pu.userid
                WHERE u.datedeleted IS NULL AND pu.datedeleted IS NULL
                AND pu.projectid =${projectId}`
        }
      }

      if (querystring.name) {
        if (userId) {
          query = query + ` and p.name ILIKE '%${querystring.name}%'`;
        }
        if (projectId) {
          query = query + ` and u.name ILIKE '%${querystring.name}%'`;
        }
      }

      if (projectId) {
        query = query + ` Order by u.name`;
      }
      if (userId) {
        query = query + ` ORDER BY p.name`;
      }

      return await Sequelize.query(query)
        .then(data => {
          const offset: number = pagesize * (page - 1);
          const totalcount: number = data[0].length;
          return {
            data: data[0].slice(offset, offset + pagesize),
            totalcount: totalcount
          };
        });
    } catch (error) {
      return reject(error);
    }
  }

  //Get All projects for a user
  async getAllProjectForUsers(userid: number) {
    try {
      let query: string;
      query = `select p.guid projectguid,p.name 
              from projects p
              inner join entityprojects ep on p.projectid = ep.projectid
              inner join userownedentities uoe on ep.entityid = uoe.entityid
              and uoe.userid = ${userid} and p.datedeleted is null and ep.datedeleted is null and uoe.datedeleted is null
              group by p.guid, p.name
              order by p.name`;
      return await Sequelize.query(query);
    } catch (error) {
      return reject(error);
    }

  }
  //Assign user to a project
  async addProjectUser(obj: any, masterEncKey) {
    try {
      const userService = new UserService();
      const projectService = new ProjectService();
      const entityService = new EntityService();
      const entityUserService = new EntityUserService();

      for (let index = 0; index < obj.length; index++) {

        let userGuid = obj[index].userid;
        obj[index].userid = await userService.getId(obj[index].userid, 'userid');
        obj[index].projectid = await projectService.getId(obj[index].projectid, 'projectid');

        let isExists: any = await this.getContext()
          .findOne({
            where: {
              datedeleted: null,
              userid: obj[index].userid,
              projectid: obj[index].projectid
            }
          });

        if (isExists) {
          return reject({ message: `Project already assigned to the user` });
        }

        let getEntitiesPerProject = await entityService.getEntitiesPerProject(obj[index].projectid);

        await entityUserService
          .addUserEntity(
            getEntitiesPerProject,
            userGuid,
            masterEncKey,
            null,
            obj[index].projectid
          );
      }
      return await this.createAll(obj);
    } catch (error) {
      return reject(error);
    }

  }

  //Unassign user from a project
  async deleteProjectUser(guids: string[]) {
    try {
      const entityUserService = new EntityUserService();
      for (let index = 0; index < guids.length; index++) {
        await this.getContext()
          .find({
            where: { datedeleted: null, guid: guids[index] }
          })
          .then(async (obj: any) => {
            await entityUserService.deleteUserEntity(obj.userid, null, obj.projectid);

          });
      }
      return await this.deleteAll(guids);
    } catch (error) {
      return reject(error);
    }

  }
}
