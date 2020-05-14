import { Op } from "sequelize";
import { AppDbContext } from "../Repository/AppDbContext";
import { BaseService } from "./BaseService";
import { reject } from "bluebird";

export class MenuItemService extends BaseService {
  private readonly context: AppDbContext;
  constructor() {
    super(new AppDbContext().MenuItems());
    this.context = new AppDbContext();
  }

  //Get All Menus
  async getAllMenu(isAdmin: boolean) {
    try {
      let queryString: any = {};
      queryString.datedeleted = null;
      queryString.parentmenuid = null;

      if (!isAdmin) {
        queryString.accesslabelid = 0;
      }
      return this.context.models.Menu
        .findAll({
          include: [{
            model: this.context.models.Menu,
            as: "ChildMenu",
            attributes: ["guid", "menuname", "path", "icon", "sortorder"],
            where: {
              datedeleted: null,
              parentmenuid: {
                [Op.ne]: null
              }
            },
            required: false
          }],
          attributes: ["guid", "menuname", "path", "icon", "sortorder"],
          where: queryString,
          order: [
            ["sortorder", "ASC"],
            [{ model: this.context.models.Menu, as: "ChildMenu" },
              "sortorder",
              "ASC"
            ]
          ]
        });
    } catch (error) {
      return reject(error);
    }

  }
}
