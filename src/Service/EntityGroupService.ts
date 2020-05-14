import { BaseService } from "./BaseService";
import { AppDbContext } from "../Repository/AppDbContext";
import { EntityService } from "./EntityService";
import { GroupService } from "./GroupService";
import { reject } from "bluebird";
import { EntityTypeService } from "./EntityTypeService";
import { Sequelize } from "../Repository/Sequelize";

export class EntityGroupService extends BaseService {

  constructor() {
    super(new AppDbContext().EntityGroup());
  }

  //Retrieve all entity assigned/unassigned to single group with page details and filter
  async getAssignableAndUnassignableEntitiesOrGroups(page: number, pagesize: number, queryString: any) {
    try {
      let query: string;
      const entitytypeService = new EntityTypeService();

      const groupService = new GroupService();
      const groupId: number = await groupService.getId(queryString.groupguid, "groupid")

      const entityService = new EntityService();
      const entityId: number = await entityService.getId(queryString.entityguid, "entityid")

      if (queryString.flag == 0 && entityId) {
        query = `SELECT g.guid, g.description
                  FROM groups g
                  WHERE datedeleted IS NULL AND groupid NOT IN
                  (SELECT groupid FROM entitygroups WHERE datedeleted IS NULL AND entityid = ${entityId})`
      }
      if (queryString.flag == 0 && groupId) {
        query = `select e.guid EntityGuid, e.name EntityName, et.name EntityTypeName 
                  from entity e
                  Left JOIN entitytypes et on e.entitytypeid = et.entitytypeid
                  where et.datedeleted IS NULL and e.datedeleted IS NULL
                  and e.entityid not in (select entityid from entitygroups where groupid =  ${groupId} and datedeleted is null)`;
      }
      if (queryString.flag == 1 && entityId) {
        query = `SELECT eg.guid EntityGroupGuid, g.description 
                  FROM groups g
                  INNER JOIN entitygroups eg ON eg.groupid = g.groupid AND eg.datedeleted IS NULL
                  WHERE g.datedeleted IS NULL AND eg.entityid = ${entityId}`
      }
      if (queryString.flag == 1 && groupId) {
        query = `select ep.guid EntityGroupGuid,e.guid EntityGuid, e.name EntityName, et.name EntityTypeName 
                  from entity e
                  Left JOIN entitygroups ep on e.entityid = ep.entityid
                  Left JOIN entitytypes et on e.entitytypeid = et.entitytypeid
                  where ep.datedeleted IS NULL and et.datedeleted IS NULL and e.datedeleted IS NULL
                  and groupid =  ${groupId} and e.entityid = ep.entityid`;
      }

      if (queryString.entitytypeid) {
        const entitytypeid: number = await entitytypeService.getId(queryString.entitytypeid, "entitytypeid");
        query = query + ` and e.entitytypeid = ${entitytypeid}`;
      }

      if (groupId && queryString.name) {
        query = query + ` and e.name ILIKE '%${queryString.name}%'`;
      }

      if (entityId && queryString.name) {
        query = query + ` AND g.description ILIKE '%${queryString.name}%'`;
      }

      if (entityId) { query = query + ` ORDER BY g.description` }

      if (groupId) { query = query + ` Order by e.name` }

      return await Sequelize.query(query)
        .then(data => {
          const offset: number = pagesize * (page - 1);
          const totalcount: number = data[1].rows.length;
          return {
            data: data[0].slice(offset, offset + pagesize),
            totalcount: totalcount
          };
        });
    } catch (error) {
      return reject(error);
    }
  }

  //Assign Entity to Group
  async addEntityGroup(obj: any) {
    try {
      const entityService = new EntityService();
      const groupService = new GroupService();

      let entityIds = [];
      for (let index = 0; index < obj.length; index++) {
        obj[index].entityid = await entityService.getId(obj[index].entityid, "entityid");

        obj[index].groupid = await groupService.getId(obj[index].groupid, "groupid")

        let isExists: any = await this.getContext()
          .find({
            where: {
              datedeleted: null,
              entityid: obj[index].entityid,
              groupid: obj[index].groupid
            }
          });

        if (isExists) {
          return reject({ message: `Record already exists Guid: ${isExists.guid}` });
        }
        entityIds.push(obj[index].entityid);
      }

      await this.createAll(obj)
      return entityIds;
    } catch (error) {
      return reject(error);
    }
  }
}
