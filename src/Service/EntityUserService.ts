import { reject } from "bluebird";
import { Crypto } from "../lib/Security/Crypto";
import { AppDbContext } from "../Repository/AppDbContext";
import { Sequelize } from "../Repository/Sequelize";
import { BaseService } from "./BaseService";
import { EntityService } from "./EntityService";
import { LogActionService } from "./LogActionService";
import { LogEntriesService } from "./LogEntriesService";
import { ProjectService } from "./ProjectService";
import { UserService } from "./UserService";

export class EntityUserService extends BaseService {

  private readonly context: AppDbContext;
  constructor() {
    super(new AppDbContext().UserOwnedEntities());
    this.context = new AppDbContext();
  }

  // Assign entities to user through group or project or direct entity
  async addUserEntity(obj: any, user, masterEncKey, groupid?, projectid?) {
    try {
      const entityService = new EntityService();
      const logactionService = new LogActionService();
      const logentriesService = new LogEntriesService();
      const userService = new UserService();
      let userFrmDb: any;

      let entityids = [];

      return await Sequelize.transaction(async t => {
        for (let index = 0; index < obj.length; index++) {
          if (groupid || projectid) {
            userFrmDb = await userService.getUserById(user, masterEncKey);

          } else {
            userFrmDb = await userService.getUserById(user[index].guid, masterEncKey);
          }
          let decryptedEntity = entityService.entityToEncryptDecrypt(obj[index], masterEncKey, "Decrypt");
          let encryptedEntity = entityService.entityToEncryptDecrypt(decryptedEntity, userFrmDb.password, "Encrypt");

          encryptedEntity.entityid = obj[index].entityid;
          encryptedEntity.userid = userFrmDb.userid;
          let isExists: any = await this.getContext()
            .find({
              where: {
                datedeleted: null,
                entityid: obj[index].entityid,
                userid: userFrmDb.userid
              }
            })
          if (groupid) {

            encryptedEntity.isgroup = true;
          } else if (projectid) {

            encryptedEntity.isproject = true;
          } else {

            encryptedEntity.isdirectassign = true;
          }

          if (isExists) {
            delete encryptedEntity.guid;
            await this.getContext().update(encryptedEntity, {
              where: { guid: isExists.guid },
              transaction: t
            })
            entityids.push(obj[index].entityid);
          } else {
            delete encryptedEntity.guid;
            encryptedEntity.lastseenat = Date.now();
            await this.getContext().create(encryptedEntity, { transaction: t })
              .catch(() => {
                throw new Error();
              });
            entityids.push(obj[index].entityid);
          }
        }
      })
        .then(async () => {
          const actionid = await logactionService.getLogActionId("Add");
          let logEntries = [];
          for (let index = 0; index < entityids.length; index++) {
            obj = {
              entityid: entityids[index].id,
              logactionid: actionid,
              userid: user[index].userid,
              memo: `Entity ${entityids[index].id} is assigned for users ${user.userid}`
            };
            logEntries.push(obj);
          }
          logentriesService.createAll(logEntries);
        });
    } catch (error) {
      return reject(error);
    }
  }

  //Updating entities related when user password changes
  async updateAllUserEntities(user, masterEncKey, transaction) {
    const entityService = new EntityService();

    let query = `select uoe.userownedentitiesid,entityid, uoe.userid, uoe.isproject, uoe.isgroup,uoe.isdirectassign
                  from userownedentities uoe
                  inner join users u on u.userid = uoe.userid
                  where uoe.datedeleted IS NULL and u.datedeleted is null
                  and u.guid = '${user.guid}'`

    let userownedentities = await Sequelize.query(query)
      .then(data => {
        return data[0];
      });

    for (let index = 0; index < userownedentities.length; index++) {

      let userentity = userownedentities[index];
      // console.log(userentity.entityid);
      if (userentity.entityid) {
        let entity = await entityService.getContext().find({ where: { entityid: userentity.entityid, datedeleted: null } });

        let decryptedEntity = entityService.entityToEncryptDecrypt(entity, masterEncKey, "Decrypt");
        let encryptedEntity = entityService.entityToEncryptDecrypt(decryptedEntity, user.password, "Encrypt");

        encryptedEntity.userid = userentity.userid;
        encryptedEntity.entityid = userentity.entityid;

        (userentity.isgroup == null) ? encryptedEntity.isgroup = null : encryptedEntity.isgroup = userentity.isgroup;
        (userentity.isproject == null) ? encryptedEntity.isproject = null : encryptedEntity.isproject = userentity.isproject;
        (userentity.isdirectassign == null) ? encryptedEntity.isdirectassign = null : encryptedEntity.isdirectassign = userentity.isdirectassign;

        delete encryptedEntity["guid"];

        encryptedEntity.datemodified = Date.now();
        await this.getContext()
          .update(encryptedEntity,
            {
              where: { userownedentitiesid: userentity.userownedentitiesid },
              transaction: transaction
            })
      }

      //For My entity
      if (userentity.entityid == null && userentity.isgroup == null && userentity.isproject == null && userentity.isdirectassign == null) {
        let userFrmDb = await new UserService().getUserById(user.guid, masterEncKey);
        let entity = await this.getContext().findOne({ where: { userownedentitiesid: userentity.userownedentitiesid, datedeleted: null } });
        let decryptedEntity = entityService.entityToEncryptDecrypt(entity, userFrmDb.password, "Decrypt");
        let encryptedEntity = entityService.entityToEncryptDecrypt(decryptedEntity, user.password, 'Encrypt');
        encryptedEntity.datemodified = Date.now();
        await this.getContext()
          .update(encryptedEntity,
            {
              where: { userownedentitiesid: userentity.userownedentitiesid },
              transaction: transaction
            });
      }
    }
  }

  //Updating assigned entities when updating a single entitiy
  async updateAllRelatedEntities(entity, masterEncKey) {
    try {
      const entityService = new EntityService();
      const entityId: number = await entityService.getId(entity.guid, "entityid");
      let userEntities: any = await this.getContext()
        .findAll({
          attributes: ["userid", "guid"],
          where: {
            entityid: entityId,
            datedeleted: null
          }
        });

      return await Sequelize
        .transaction(async t => {
          const crypto = new Crypto();
          const entityService = new EntityService();
          const userService = new UserService();

          for (let index = 0; index < userEntities.length; index++) {
            let userKey = await userService.getContext()
              .find({
                attributes: ["masterencpassword"],
                where: { userid: userEntities[index].userid }
              })
              .then((res: any) => {
                return crypto.decrypt(masterEncKey, res.masterencpassword);
              })
            let encEntity = entityService.entityToEncryptDecrypt(entity, userKey, "Encrypt");
            delete encEntity["guid"];

            await this.getContext()
              .update(encEntity, {
                where: { guid: userEntities[index].guid },
                transaction: t
              })
          }
        })
    } catch (error) {
      return reject(error);
    }
  }

  //UnAssign entities from user through group, project or directly
  async deleteUserEntity(userid, groupid?, projectid?, objects?) {
    try {
      let obj: any;
      if (groupid) {
        obj = await this.getContext()
          .findAll({
            where: { datedeleted: null, userid: userid, isgroup: true }
          });
      }
      else if (projectid) {
        obj = await this.getContext()
          .findAll({
            where: { datedeleted: null, userid: userid, isproject: true }
          });
      } else {
        obj = objects;
      }

      return await Sequelize
        .transaction(async t => {
          let entity: any;
          for (let index = 0; index < obj.length; index++) {
            if (groupid) {
              if (obj[index].isproject || obj[index].isdirectassign) {
                entity = { isgroup: false, datemodified: Date.now() };
              } else {
                entity = { datedeleted: Date.now() };
              }
            } else if (projectid) {
              if (obj[index].isgroup || obj[index].isdirectassign) {
                entity = { isproject: false, datemodified: Date.now() };
              } else {
                entity = { datedeleted: Date.now() };
              }
            } else {
              if (obj[index].isproject || obj[index].isgroup) {
                entity = { isdirectassign: false, datemodified: Date.now() };
              } else {
                entity = { datedeleted: Date.now() };
              }
            }
            await this.getContext().update(entity, { where: { guid: obj[index].guid }, transaction: t })
          }
        })
    } catch (error) {
      return reject(error);
    }
  }

  //Unassigned Directly assigned entity
  async deleteDirectEntity(guids: string) {
    try {
      let objects: any[] = [];
      let entityIds = [];
      for (let index = 0; index < guids.length; index++) {
        await this.getContext()
          .find({
            where: { datedeleted: null, guid: guids[index] }
          })
          .then((res: any) => {
            objects.push(res);
            entityIds.push(res.entityid)
          });
      }

      await this.deleteUserEntity(null, null, null, objects)
      return entityIds
    } catch (error) {
      return reject(error);
    }
  }

  async getMyEntities(user: any) {
    try {
      let query = `SELECT uoe.guid, uoe.name, uoe.passwordvalue as comment
                FROM userownedentities uoe
                INNER JOIN entitytypes et ON et.entitytypeid = uoe.entitytypeid
                INNER JOIN users u ON u.userid = uoe.userid
                WHERE uoe.datedeleted IS NULL AND et.datedeleted IS NULL AND u.datedeleted IS NULL
                AND u.userid =${user.UserId} AND et.name = 'My Entity'`;
      return await Sequelize.query(query)
        .then(data => {
          let entities = data[0];
          for (let index = 0; index < entities.length; index++) {
            const entity = entities[index];
            entities[index].comment = new Crypto().decrypt(user.Password, entity.comment);
          }
          return entities;
        })
    } catch (error) {
      return reject(error);
    }


  }

  //Get assigned and unassigned entities with page details and filter
  async getAssignableAndUnassignableEntitiesOrUsers(page: number, pagesize: number, querystring: any) {
    try {
      let query: string;

      const entityService = new EntityService();
      const entityId: number = await entityService.getId(querystring.entityguid, "entityid");

      const userService = new UserService();
      const userId: number = await userService.getId(querystring.userguid, "userid");

      if (querystring.flag == 0 && userId) {
        query = `select e.guid, e.name
              from entity e
              inner join entitytypes et on e.entitytypeid = et.entitytypeid
              where e.datedeleted is null and et.datedeleted is null  and e.entityid  not in
              (select entityid from userownedentities where userid = ${userId} 
              and datedeleted is null and entityid is not null)`;
      }
      if (querystring.flag === 0 && entityId) {
        query = `SELECT u.guid, u.name
              FROM users u
              WHERE datedeleted IS NULL AND userid NOT IN 
              (SELECT userid FROM userownedentities WHERE datedeleted IS NULL AND entityid = ${entityId})`;
      }

      if (querystring.flag == 1 && userId) {
        query = `select uo.guid EntityUserGuid, e.guid EntityGuid, e.name
              from entity e
              inner join entitytypes et on e.entitytypeid = et.entitytypeid
              inner join userownedentities uo on e.entityid = uo.entityid
              where e.datedeleted is null and et.datedeleted is null and uo.datedeleted is null
              and e.entityid = uo.entityid and uo.userid = ${userId}`;
      }

      if (querystring.flag == 1 && entityId) {
        query = `SELECT uoe.guid, u.name
              FROM users u
              INNER JOIN userownedentities uoe ON uoe.userid = u.userid AND uoe.datedeleted IS NULL
              WHERE u.datedeleted IS NULL AND uoe.entityid = ${entityId}`;
      }

      if (querystring.name && entityId) {
        query = query + ` and u.name ILIKE '%${querystring.name}%'`;
      }

      if (querystring.name && userId) {
        query = query + ` and e.name ILIKE '%${querystring.name}%'`;

      }

      if (querystring.entitytypeguid) {
        query = ` and et.guid = ${querystring.entitytypeguid}`;
      }

      if (entityId) { query = query + ` Order by u.name`; }

      if (userId) { query = query + ` ORDER BY e.name` }

      return await Sequelize
        .query(query)
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

  //Get entities assigned to a user
  async getUserOwnedEntities(page: number, pagesize: number, userid: number, querystring: any, sort: string) {
    let query: string, selectQuery: string;

    selectQuery = `select distinct uoe.name, uoe.guid guid, et.name EntityType, uoe.isfavourite Favourite, uoe.lastseenat
                      from userownedentities uoe 
                      inner join entitytypes et on uoe.entitytypeid = et.entitytypeid`;

    let joinQuery = ``;

    let conditionQuery = ` where et.datedeleted is null and uoe.datedeleted is null and uoe.userid = ${userid}`;

    if (querystring.name) {
      conditionQuery = conditionQuery + ` and uoe.name ILIKE '%${querystring.name}%'`;
    }

    if (querystring.projectguid) {
      const projectService = new ProjectService();
      const projectid: number = await projectService.getId(querystring.projectguid, "projectid");

      joinQuery = joinQuery + ` inner join entityprojects ep on uoe.entityid = ep.entityid`;

      conditionQuery = conditionQuery + ` and ep.datedeleted is null and ep.projectid = ${projectid}`;
    }

    if (querystring.entitytypeguid) {
      conditionQuery = conditionQuery + ` and et.guid = '${querystring.entitytypeguid}'`;
    }

    //get userownedentities
    if (querystring.flag == 0) {
      conditionQuery = conditionQuery + ` and et.entitytypeid <> (select entitytypeid from entitytypes where datedeleted is null and name ilike '%My Entity%') Order by uoe.${sort} `;
    }
    //get recent userentities
    else if (querystring.flag == 1) {
      conditionQuery = conditionQuery + ` Order by uoe.lastseenat desc `;
    }
    //get favourite userentities
    else if (querystring.flag == 2) {
      conditionQuery = conditionQuery + ` and uoe.isfavourite = true Order by uoe.${sort} `;
    }

    query = selectQuery + joinQuery + conditionQuery;

    return await Sequelize.query(query)
      .then(data => {
        let offset = pagesize * (page - 1);
        let totalcount = data[1].rows.length;
        return {
          data: data[0].slice(offset, offset + pagesize),
          totalcount: totalcount
        };
      });
  }

  //Get single decrypted entity for user
  async getSingleEntity(guid: string, user: any) {
    try {
      console.log("View entity: " + guid + " > " + user.UserId);

      const entityService = new EntityService();
      return await this.context.models.UserOwnedEntities
        .find({
          include: [{
            model: this.context.models.Location,
            attributes: ["location", "guid"],
            where: { datedeleted: null },
            required: false
          },
          {
            model: this.context.models.Status,
            attributes: ["status", "guid"],
            where: { datedeleted: null },
            required: false
          },
          {
            model: this.context.models.Entity,
            attributes: ["name", "guid"],
            as: "RadminEntity"
          },
          {
            model: this.context.models.Entity,
            attributes: ["name", "guid"],
            as: "VncEntity"
          },
          {
            model: this.context.models.Entity,
            attributes: ["name", "guid"],
            as: "RdpEntity"
          },
          {
            model: this.context.models.Entity,
            attributes: ["name", "guid"],
            as: "SshEntity"
          }
          ],
          where: { datedeleted: null, guid: guid }
        }).then(entity => {
          let decEntity = entityService.entityToEncryptDecrypt(
            entity,
            user.Password,
            "Decrypt"
          );
          if (entity.Status) {
            decEntity.status = entity.Status.status;
            decEntity.statusguid = entity.Status.guid;
          }
          if (entity.Location) {
            decEntity.location = entity.Location.location;
            decEntity.locationguid = entity.Location.guid;
          }
          if (entity.RadminEntity) {
            decEntity.radminguid = entity.RadminEntity.guid;
            decEntity.radmin = entity.RadminEntity.name;
          }
          if (entity.VncEntity) {
            decEntity.vncguid = entity.VncEntity.guid;
            decEntity.vnc = entity.VncEntity.name;
          }
          if (entity.SshEntity) {
            decEntity.sshguid = entity.SshEntity.guid;
            decEntity.ssh = entity.SshEntity.name;
          }
          if (entity.RdpEntity) {
            decEntity.rdpguid = entity.RdpEntity.guid;
            decEntity.rdp = entity.RdpEntity.name;
          }
          return decEntity;
        });
    }
    catch (error) {
      return reject(error);
    }
  }

  //Declare entity as User Favorite
  async addFavouriteEntity(entity: any) {
    return await this.getContext()
      .update(entity, {
        where: { guid: entity.guid }
      });
  }

  //Add user custom entity
  async addMyEntity(entity: any, user: any) {

    const entityService = new EntityService();
    entity = entityService.entityToEncryptDecrypt(entity, user.Password, "Encrypt");
    entity.userid = user.UserId;
    entity.lastseenat = Date.now();
    return await this.create(entity);
  }

  //update user custom entity
  async updateMyEntity(entity: any, user: any) {
    const entityService = new EntityService();
    entity = entityService.entityToEncryptDecrypt(entity, user.Password, "Encrypt");
    entity.userid = user.UserId;
    return await this.update(entity);
  }

  //delete user custom entity
  async deleteMyEntity(guid: string) {
    await this.delete(guid);
  }
}
