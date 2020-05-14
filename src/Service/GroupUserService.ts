import { reject } from "bluebird";
import { AppDbContext } from "../Repository/AppDbContext";
import { Sequelize } from "../Repository/Sequelize";
import { BaseService } from "./BaseService";
import { EntityService } from "./EntityService";
import { EntityUserService } from "./EntityUserService";
import { GroupService } from "./GroupService";
import { UserService } from "./UserService";

export class GroupUserService extends BaseService {

  constructor() {
    super(new AppDbContext().GroupUser());
  }

  //Get all assigned and unassigned groups with page details and filter
  async getAssignableAndUnassignableGroupsOrUsers(page: number, pagesize: number, querystring: any) {
    try {
      let query: string;
      let userId: number, groupId: number;

      if (querystring.userguid) {
        const userService = new UserService();
        userId = await userService.getId(querystring.userguid, "userid");
      }
      if (querystring.groupguid) {
        const groupService = new GroupService();
        groupId = await groupService.getId(querystring.groupguid, "groupid");
      }

      if (querystring.flag == 0 && userId) {
        query = `SELECT g.guid GroupGuid, g.description Description
                FROM groups g
                WHERE datedeleted is NULL AND groupid NOT IN 
                (SELECT groupid FROM groupusers WHERE userid = ${userId} AND datedeleted is NULL)`;
      }

      if (querystring.flag == 0 && groupId) {
        query = `SELECT u.guid UserGuid, u.name UserName
                FROM users u
                WHERE datedeleted is NULL AND userid NOT IN 
                (SELECT userid FROM groupusers WHERE datedeleted IS NULL AND groupid =${groupId})`
      }
      if (querystring.flag == 1 && userId) {
        query = `SELECT gu.guid GroupUserGuid, g.guid GroupGuid, g.description Description
                FROM groups g
                INNER JOIN groupusers gu ON g.groupid = gu.groupid
                WHERE g.datedeleted is NULL AND gu.datedeleted is NULL 
                AND gu.userid = ${userId} AND g.groupid = gu.groupid`;
      }
      if (querystring.flag == 1 && groupId) {
        query = `SELECT gu.guid GroupUserGuid, u.name UserName
                FROM users u 
                INNER JOIN groupusers gu ON u.userid = gu.userid
                WHERE u.datedeleted IS NULL AND gu.datedeleted IS NULL AND gu.groupid =${groupId}`
      }

      if (querystring.description && userId) {
        query = query + ` AND g.description ILIKE '%${querystring.description}%'`;
      }
      if (querystring.description && groupId) {
        query = query + ` AND u.name ILIKE '%${querystring.description}%'`;
      }

      if (userId) {
        query = query + ` ORDER BY g.description`;
      }

      if (groupId) {
        query = query + ` ORDER BY u.name`;
      }

      return await Sequelize.query(query)
        .then(data => {
          const offset: number = pagesize * (page - 1);
          const totalcount: number = data[1].rows.length;
          return {
            data: data[0].slice(offset, offset + pagesize),
            totalcount: totalcount
          };
        })
    } catch (error) {
      return reject(error);
    }
  }

  //Assign Groups to a user
  async addGroupUser(obj: any, masterEncKey) {
    try {
      const userService = new UserService();
      const groupService = new GroupService();
      const entityService = new EntityService();
      const entityUserService = new EntityUserService();

      for (let index = 0; index < obj.length; index++) {
        let userGuid = obj[index].userid;
        obj[index].userid = await userService.getId(obj[index].userid, 'userid');

        obj[index].groupid = await groupService.getId(obj[index].groupid, 'groupid');

        let isExists: any = await this.getContext()
          .find({
            where: {
              datedeleted: null,
              userid: obj[index].userid,
              groupid: obj[index].groupid
            }
          });

        if (isExists) {
          return reject({ message: `Group already assigned to the user` });
        }

        let getEntitiesPerGroup: any = await entityService
          .getEntitiesPerGroup(obj[index].groupid);

        await entityUserService
          .addUserEntity(
            getEntitiesPerGroup,
            userGuid,
            masterEncKey,
            obj[index].groupid,
            null
          );
      }
      return await this.createAll(obj);
    } catch (error) {
      return reject(error);
    }

  }

  //Unassign user from group
  async deleteGroupUser(guids: string[]) {
    try {
      const entityUserService = new EntityUserService();

      for (let index = 0; index < guids.length; index++) {

        let obj: any = await this.getContext()
          .find({ where: { datedeleted: null, guid: guids[index] } })
        await entityUserService.deleteUserEntity(obj.userid, obj.groupid, null, null);
      }
      return await this.deleteAll(guids);
    } catch (error) {
      return reject(error);
    }
  }
}
