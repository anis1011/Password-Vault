import * as sequelize from "sequelize";
import { Sequelize } from "../Repository/Sequelize";
import { reject } from "bluebird";

export abstract class BaseService {

  constructor(private _context: sequelize.Model<{}, {}>) { }

  //Checking for any existing rows
  async checkExisting(querys: any[]) {

    let data: any;
    for (let index = 0; index < querys.length; index++) {
      data = await this._context.findOne({ where: querys[index] })
      if (data) { return data; }
    }


  }
  //Adding a row into database
  async create(obj: object) {
    if (Object.keys(this._context).length > 0) {
      return await this._context.create(obj);
    }
    else {
      return null;
    }
  }

  //Adding multiple rows using transaction
  async createAll(obj: Array<object>) {
    return await Sequelize.transaction(async t => {
      for (let index = 0; index < obj.length; index++) {
        await this._context.create(obj[index], { transaction: t })
      }
    })
  }

  //Deleting a row
  async delete(guid: string) {
    return this._context.update({ datedeleted: Date.now() }, { where: { guid: guid } })
  }

  //Delete multiple rows
  async deleteAll(obj: string[]) {
    return await Sequelize.transaction(async (t) => {
      for (let index = 0; index < obj.length; index++) {
        await this.delete(obj[index]);
      }
    })
  }

  //Get single row filter through guid
  async findById(guid: string) {
    return await this._context.find({ where: { guid: guid, datedeleted: null } })
  }

  //Get first row that matches query
  async findFirst(query: object) {
    query["datedeleted"] = null;
    return await this._context.findOne({ where: query })

  }

  //Get rows based on limited attributes and ordering using sort value
  async find(attributes: object, sort?: string) {

    return await this._context.findAll({
      attributes: attributes,
      where: { datedeleted: null },
      order: [[sort, "ASC"]],
      raw: true
    })

  }

  //Get selected attribute rows including page details and filtering through querystring and sort order
  async finds(page: number, pagesize: number, queryString: any, sort?: string, attributes?: any) {

    queryString.datedeleted = null;
    const data = await this._context.findAll({
      attributes: attributes,
      where: queryString,
      order: [[sort, "ASC"]]
    })
    const offset: number = pagesize * (page - 1);
    const totalcount: number = data.length;
    return {
      data: data.slice(offset, offset + pagesize),
      totalcount: totalcount
    };
  }

  //Return Current Context
  getContext() {
    return this._context;
  }

  //Get Id value based on guid
  async getId(guid: string, idname: string) {

    if (!guid) { return null; }
    const objId = await this._context.find({ attributes: [idname], where: { guid: guid, datedeleted: null } });
    if (objId) {
      return objId[idname];
    }
    return reject({ message: `${idname} doesn't exists` });

  }

  //Return Query string concat with ilike
  getQueryStringName(name: string) {
    return { [Sequelize.Op.iLike]: `%${name}%` };
  }

  //Update a row
  async update(obj: object, schedulerequest?) {

    const guid = obj["guid"];
    if (!schedulerequest) {
      obj["datemodified"] = Date.now();
    }
    delete obj["guid"];
    return this._context.update(obj, { where: { guid: guid } })

  }
}
