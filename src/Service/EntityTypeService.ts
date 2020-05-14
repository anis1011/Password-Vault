import { AppDbContext } from "../Repository/AppDbContext";
import { Sequelize } from "../Repository/Sequelize";
import { BaseService } from "./BaseService";

export class EntityTypeService extends BaseService {
  constructor() {
    super(new AppDbContext().EntityTypes());
  }

  //Get EntityType filter through description
  async findEntityByDesc(name: string) {
    name = !name ? "" : name;
    return await this.getContext()
      .findAll({
        where: {
          name: { [Sequelize.Op.iLike]: `%${name}%` },
          datedeleted: null
        }
      });
  }

  //Get MyEntity Id
  async getMyEntityTypeId() {
    return await this.getContext()
      .find({ where: { name: "My Entity", datedeleted: null } })
      .then((res: any) => res.entitytypeid);
  }
}
