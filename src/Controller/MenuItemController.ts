import { Request, Response } from "express";
import { LogService } from "../Service/LogService";
import { MenuItemService } from "../Service/MenuItemService";

export class MenuItemController {

  async getMenuItems(req: Request, res: Response) {
    try {
      const menuItemService = new MenuItemService();
      const logService = new LogService();

      let menuitems = await menuItemService.getAllMenu(res.locals.user.isAdmin)

      if (menuitems == null) {
        logService.Log("Get menuitems", "I", "Rest Service", res.locals.user.UserId, null, "MenuItem is not added yet !", null);
        return res.send(404).send("MenuItem not found");
      }
      res.json(menuitems);
    } catch (error) {
      new LogService().Log("Get menuitems ", "I", "Rest Service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get menuitems" });
    }
  }
}
