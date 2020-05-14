import { AppDbContext } from "../Repository/AppDbContext";
import { BaseService } from "./BaseService";

export class StatusService extends BaseService {
  constructor() {
    super(new AppDbContext().Status());
  }
}
