import { reject } from 'bluebird';
import { AppDbContext } from './../Repository/AppDbContext';
import { BaseService } from "./BaseService";
import { UserService } from './UserService';

export class MessaageGroupService extends BaseService {
    constructor() {
        super(new AppDbContext().MessageGroups())
    }

    async getmessageGroupById(messagegroup) {
        try {
            const memberUserIds = messagegroup.members.replace("{","").replace("}","").split(",").map((str)=>parseInt(str))
            let userguids: any = [];
            for (let index = 0; index < memberUserIds.length; index++) {
                const userid = memberUserIds[index];
                const user: any = await new UserService().getContext().find({ where: { datedeleted: null, userid: userid }, attributes: ['guid'] });
                userguids.push(user.guid);
            }

            messagegroup.members = userguids;
            return messagegroup;
        } catch (error) {
            return reject(error);
        }
    }

    async addEditMessageGroup(messagegroups) {
        try {
            let userIds = [];
            userIds.push(messagegroups.creationuserid);

            let memberuserguids =messagegroups.members;
            for (let index = 0; index < memberuserguids.length; index++) {
                const userguid = memberuserguids[index];
                const userid = await new UserService().getId(userguid, "userid");
                userIds.push(userid);
            }

            messagegroups.members = userIds;
            delete messagegroups.userguids;
            if (messagegroups.guid) {
                return await this.update(messagegroups);
            }
            return await this.getContext().create(messagegroups);
        } catch (error) {
            return reject(error);
        }
    }
}