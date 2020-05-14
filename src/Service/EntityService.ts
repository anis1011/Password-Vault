import { Crypto } from "../lib/Security/Crypto";
import { Entity, EntityEncryptDecrypt } from "../Model/EntityModel";
import { AppDbContext } from "../Repository/AppDbContext";
import { Sequelize } from "../Repository/Sequelize";
import { BaseService } from "./BaseService";
import { GroupService } from "./GroupService";
import { ProjectService } from "./ProjectService";
import { reject } from "bluebird";
import { LogService } from "./LogService";

export class EntityService extends BaseService {

  private readonly context: AppDbContext;
  constructor() {
    super(new AppDbContext().Entities());
    this.context = new AppDbContext();
  }

  //Get entities for dorpdownlist
  async getEntities() {
    try {
      return await this.context.models.Entity.findAll({
        include: [{
          model: this.context.models.EntityType,
          where: { datedeleted: null }
        }],
        where: { datedeleted: null }
      });
    } catch (error) {
      return reject(error);
    }

  }

  //Get all entities with page details and filter and sort
  async getEntitiesWithPage(page: number, pagesize: number, queryString: any) {
    try {
      let query: string, selectQuery: string;

      selectQuery = `select distinct e.guid, e.name, et.name EntityType
                  from entity e
                  left join entitytypes et on e.entitytypeid = et.entitytypeid and et.datedeleted is null`;

      let joinQuery = ``;

      let conditionQuery = ` where e.datedeleted is null and et.datedeleted is null`;

      if (queryString.name) {
        conditionQuery = conditionQuery + ` and e.name ILIKE '%${queryString.name}%'`;
      }
      if (queryString.entitytypeguid) {
        conditionQuery = conditionQuery + ` and et.guid = '${queryString.entitytypeguid}'`;
      }
      if (queryString.projectguid) {
        const projectService = new ProjectService();
        const projectid: number = await projectService.getId(queryString.projectguid, 'projectid');

        joinQuery = joinQuery + ` left join entityprojects ep on e.entityid = ep.entityid and ep.datedeleted is null`
        conditionQuery = conditionQuery + ` and ep.datedeleted is null and ep.projectid = ${projectid}`;
      }

      if (queryString.groupguid) {
        const groupService = new GroupService();
        let groupid = await groupService.getId(queryString.groupguid, 'groupid');

        joinQuery = joinQuery + ` left join entitygroups eg on e.entityid = eg.entityid and eg.datedeleted is null`;
        conditionQuery = conditionQuery + ` and eg.datedeleted is null and eg.groupid = ${groupid}`;
      }

      conditionQuery = conditionQuery + ` Order by e.name`;

      query = selectQuery + joinQuery + conditionQuery;

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

  //Get single decrypted entity
  async getSingleEntity(guid: string, masterEncKey) {
    try {
      console.log("entity view " + guid);

      return await this.context.models.Entity.find({
        include: [{
          model: this.context.models.EntityType,
          attributes: ["name", "guid"],
          where: { datedeleted: null }
        },
        {
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
        }],
        attributes: { exclude: ["entitytypeid"] },
        where: { datedeleted: null, guid: guid }
      }).then((entity: any) => {

        let decEntity = this.entityToEncryptDecrypt(entity, masterEncKey, "Decrypt");
        console.log("entity decryped")

        decEntity.entitytype = entity.EntityType.name;
        decEntity.entitytypeguid = entity.EntityType.guid;

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

  //Add an Entity
  async addEntity(entity: any, masterEncKey) {
    entity = this.entityToEncryptDecrypt(entity, masterEncKey, "Encrypt");
    return await this.create(entity);
  }

  //Update an Entity
  async updateEntity(entity: any, masterEncKey) {
    entity = this.entityToEncryptDecrypt(entity, masterEncKey, "Encrypt");
    return await this.update(entity);
  }

  //Delete an entity
  async deleteEntity(guid: string) {
    return await this.delete(guid);
  }

  //Encrypt or Decrypt entity
  entityToEncryptDecrypt(entity: any, encKey: string, task: string) {

    let entityHalf: Entity = {
      assetid: entity.assetid,
      name: entity.name,
      locationid: entity.locationid,
      statusid: entity.statusid,
      entitytypeguid: entity.entitytypeguid,
      entitytypeid: entity.entitytypeid,
      guid: entity.guid,
      member: entity.member,
      pdu: entity.pdu,
      radmin: entity.radmin,
      rdp: entity.rdp,
      ssh: entity.ssh,
      virtualhost: entity.virtualhost,
      vnc: entity.vnc,
      isfavourite:entity.isfavourite
    };

    let entityToEncryptDecrypt: EntityEncryptDecrypt = {
      backuplocation: entity.backuplocation,
      brand: entity.brand,
      comment: entity.comment,
      cpu: entity.cpu,
      domainvalue: entity.domainvalue,
      dtinstallation: entity.dtinstallation,
      externalip1: entity.externalip1,
      externalip2: entity.externalip2,
      harddrive: entity.harddrive,
      housing: entity.housing,
      internalip1: entity.internalip1,
      internalip2: entity.internalip2,
      ipvalue: entity.ipvalue,
      liveapp: entity.liveapp,
      livedb: entity.livedb,
      localusers: entity.localusers,
      mainboard: entity.mainboard,
      passwordvalue: entity.passwordvalue,
      pduport: entity.pduport,
      portvalue: entity.portvalue,
      ram: entity.ram,
      sqlsrvversion: entity.sqlsrvversion,
      testapp: entity.testapp,
      testdb: entity.testdb,
      urlvalue: entity.urlvalue,
      usernamevalue: entity.usernamevalue,
      wanip1: entity.wanip1,
      wanip2: entity.wanip2
    };

    let entityFull: any = entityHalf;

    try {
      let keys = Object.keys(entityToEncryptDecrypt);
      for (let index = 0; index < keys.length; index++) {
        let key = keys[index];
        const crypto = new Crypto();
        entityFull[key] = null;

        if (entityToEncryptDecrypt[key] != null) {
          if (entityToEncryptDecrypt[key].trim() != "") {
            if (task == "Encrypt") {

              let encryptedValue = crypto.encrypt(encKey, entityToEncryptDecrypt[key]);
              let decryptedValue = crypto.decrypt(encKey, encryptedValue);

              if (decryptedValue != entityToEncryptDecrypt[key]) {
                console.log("encryption issue: " + key)
              }
              entityFull[key] = encryptedValue;
            }
            else {
              let decryptedValue = crypto.decrypt(encKey, entityToEncryptDecrypt[key]);
              let encryptedValue = crypto.encrypt(encKey, decryptedValue);
              // console.log(decryptedValue);

              if (encryptedValue != entityToEncryptDecrypt[key]) {
                console.log("decryption issue: " + key)
              }
              entityFull[key] = decryptedValue;
            }
          }
        }
      }

      return entityFull;
    }
    catch (error) {
      console.log("error occured when encrypting/decrypting on entity service")
      console.log(error.message);
      console.log(error.stack);
      return reject(error);
    }
  }

  //Get all entities for a group
  async getEntitiesPerGroup(groupid: number) {
    return await Sequelize
      .query(`select *
            from entity e 
            inner join  entitygroups eg on e.entityid = eg.entityid
            and eg.groupid = ${groupid} and e.datedeleted is null and eg.datedeleted is null`
      )
      .then(data => data[0]);
  }

  //Get all entities for a project
  async getEntitiesPerProject(projectid: number) {
    return await Sequelize
      .query(`select * 
        from entity e
        inner join entityprojects ep on e.entityid = ep.entityid
        and ep.projectid= ${projectid} and e.datedeleted is null and ep.datedeleted is null`
      )
      .then(data => data[0]);
  }

  //Get all entities by thier type
  async getEntitiesByEntityType(entitytype: string, page: number, pagesize: number) {
    let filterQuery: any = { datedeleted: null };
    filterQuery.name = this.getQueryStringName(entitytype);
    if (page == 0 && pagesize == 0) {
      return await this.context.models.Entity
        .findAll({
          include: [{
            model: this.context.models.EntityType,
            attributes: [],
            where: filterQuery
          }],
          attributes: ["guid", "name"],
          order: [["name", "ASC"]],
          where: { datedeleted: null },
          raw: true
        });
    }
  }
}
