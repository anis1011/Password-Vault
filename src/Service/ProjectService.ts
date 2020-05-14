import { reject } from "lodash";
import { AppDbContext } from "../Repository/AppDbContext";
import { Sequelize } from "../Repository/Sequelize";
import { BaseService } from "./BaseService";

export class ProjectService extends BaseService {
  constructor() {
    super(new AppDbContext().Projects());
  }

  //Filter project using description
  async findProjectByQuery(name: string, description: string) {
    try {
      name = !name ? "" : name;
      description = !description ? "" : description;
      return await this.getContext()
        .findAll({
          where: {
            [Sequelize.Op.or]: [
              {
                name: { [Sequelize.Op.iLike]: `%${name}%` },
                description: { [Sequelize.Op.iLike]: `%${description}%` }
              }
            ],
            datedeleted: null
          }
        })
    } catch (error) {
      return reject(error);
    }

  }
}
