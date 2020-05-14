import { AppDbContext } from './../Repository/AppDbContext';
import { BaseService } from "./BaseService";

export class MessageperUsers extends BaseService {
    constructor() {
        super(new AppDbContext().MessagePerUsers())
    }
}