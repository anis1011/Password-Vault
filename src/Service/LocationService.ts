import { BaseService } from "./BaseService";
import { AppDbContext } from "../Repository/AppDbContext";

export class LocationService extends BaseService {
  constructor() {
    super(new AppDbContext().Locations());
  }
}
