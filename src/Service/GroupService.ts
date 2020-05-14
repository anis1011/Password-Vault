import { AppDbContext } from "../Repository/AppDbContext";
import { BaseService } from "./BaseService";

export class GroupService extends BaseService {
  constructor() {
    super(new AppDbContext().Groups());
  }
}
