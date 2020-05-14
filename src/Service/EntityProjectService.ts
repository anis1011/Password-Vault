import { reject } from "bluebird";
import { AppDbContext } from "../Repository/AppDbContext";
import { Sequelize } from "../Repository/Sequelize";
import { BaseService } from "./BaseService";
import { EntityService } from "./EntityService";
import { EntityTypeService } from "./EntityTypeService";
import { ProjectService } from "./ProjectService";

export class EntityProjectService extends BaseService {

  private readonly context: AppDbContext;

  constructor() {
    super(new AppDbContext().EntityProject());
    this.context = new AppDbContext();
  }

  //Assign entity to Project
  async addProjectEntity(obj: any) {
    try {
      const entityService = new EntityService();
      const projectService = new ProjectService();
      let entityIds = [];
      for (let index = 0; index < obj.length; index++) {
        obj[index].entityid = await entityService.getId(obj[index].entityid, "entityid")

        obj[index].projectid = await projectService.getId(obj[index].projectid, "projectid")

        let isExists: any = await this.getContext()
          .count({
            where: {
              datedeleted: null,
              entityid: obj[index].entityid,
              projectid: obj[index].projectid
            }
          });

        if (isExists) {
          return reject({ message: `Entity already exists` });
        }
        entityIds.push(obj[index].entityid)
      }
      await this.createAll(obj)
      return entityIds;
    } catch (error) {
      return reject(error);
    }

  }

  //Get all Projects for single Entity
  async getAllProjectsForEntity(queryString: any, entityguid: string) {
    try {
      queryString.datedeleted = null;
      return await this.context.models.Project
        .findAll({
          include: [{
            model: this.context.models.Entity,
            through: {
              model: this.context.models.EntityProject,
              where: { datedeleted: null }
            },
            attributes: [],
            where: { datedeleted: null, guid: entityguid }
          }],
          attributes: [
            ["guid", , "name", "description"]
          ],
          order: ["name"],
          where: queryString
        });
    } catch (error) {
      return reject(error);
    }

  }

  //Get all assigned/unassigned entities for Project with page details and filter
  async getAssignableAndUnassignableEntitiesOrProjects(page: number, pagesize: number, queryString: any) {
    try {
      let query: string;
      const entitytypeService = new EntityTypeService();
      const projectService = new ProjectService();
      const projectId: number = await projectService.getId(queryString.projectguid, "projectid")

      const entityService = new EntityService();
      const entityId: number = await entityService.getId(queryString.entityguid, "entityid")

      if (queryString.flag == 0 && entityId) {
        query = `SELECT p.guid,p.name, p.description 
                  FROM projects p
                  WHERE datedeleted IS NULL AND projectid NOT IN 
                  (SELECT projectid FROM entityprojects WHERE entityid =${entityId} AND datedeleted IS NULL)`
      }
      if (queryString.flag == 0 && projectId) {
        query = `SELECT e.guid EntityGuid, e.name EntityName, et.name EntityTypeName 
                  FROM entity e
                  Left JOIN entitytypes et on e.entitytypeid = et.entitytypeid
                  where et.datedeleted IS NULL and e.datedeleted IS NULL and e.entityid not in
                  (select entityid from entityprojects where projectid =  ${projectId} and datedeleted is null)`;
      }
      if (queryString.flag == 1 && entityId) {
        query = `SELECT ep.guid, p.name, p.description
                  FROM projects p
                  INNER JOIN entityprojects ep ON ep.projectid = p.projectid AND ep.datedeleted IS NULL
                  AND ep.entityid = ${entityId} AND p.datedeleted IS NULL`

      }
      if (queryString.flag == 1 && projectId) {
        query = `select ep.guid EntityProjectGuid, e.guid EntityGuid, e.name EntityName, et.name EntityTypeName 
                  from entity e
                  Left JOIN entityprojects ep on e.entityid = ep.entityid
                  Left JOIN entitytypes et on e.entitytypeid = et.entitytypeid
                  where ep.datedeleted IS NULL and et.datedeleted IS NULL and e.datedeleted IS NULL 
                  and projectid = ${projectId} and e.entityid = ep.entityid`;
      }

      if (queryString.entitytypeid) {
        const entitytypeid: number = await entitytypeService.getId(queryString.entitytypeid, "entitytypeid");
        query = query + ` and e.entitytypeid = ${entitytypeid}`;
      }

      if (entityId && queryString.name) {
        query = query + ` and p.name ILIKE '%${queryString.name}%'`;
      }
      if (projectId && queryString.name) {
        query = query + ` and e.name ILIKE '%${queryString.name}%'`;
      }

      if (entityId) { query = query + ` ORDER BY p.name` }

      if (projectId) { query = query + ` Order by e.name `; }

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
}
