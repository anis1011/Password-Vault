import { reject } from 'bluebird';
import { AppDbContext } from '../Repository/AppDbContext';
import { AppSettings } from './../AppSettings';
import { Crypto } from './../Lib/Security/Crypto';
import { Sequelize } from './../Repository/Sequelize';
import { BaseService } from './BaseService';
import { MessaageGroupService } from './MessageGroupService';
import { MessageperUsers } from './MessageperUsersService';
import { UserService } from './UserService';

export class MessageService extends BaseService {
    constructor() {
        super(new AppDbContext().Messages());
    }

    async sendMessage(messages) {
        try {
            await Sequelize.transaction(async t => {
                let userIds = [];
                let userguids: string[] = messages.recipentguids.userguids;
                let messagegroupguids: string = messages.recipentguids.messagegroupguids;
                let receivers: string = "";


                delete messages["recipentguids"];



                if (messagegroupguids) {
                    for (let index = 0; index < messagegroupguids.length; index++) {
                        let messagegroupguid = messagegroupguids[index];

                        let messagegroup: any = await new MessaageGroupService().getContext()
                            .find({
                                attributes: ['members', 'name'],
                                where: { datedeleted: null, guid: messagegroupguid, creationuserid: messages.senderuserid }
                            })

                        receivers = (receivers == "") ? (receivers + messagegroup.name) : (receivers + "," + messagegroup.name);

                        let members = messagegroup["members"];

                        members = members.replace("{", "[").replace("}", "]").replace(/\[|\]/g, "").split(",").map(str => parseInt(str.trim()));
                        userIds = [...new Set([...userIds, ...members])];
                    }
                }

                if (userguids) {
                    for (let index = 0; index < userguids.length; index++) {
                        const userguid = userguids[index];
                        let user: any = await new UserService().getContext()
                            .find({ where: { datedeleted: null, guid: userguid }, attributes: ['userid', 'name'] });
                        userIds.push(user.userid);
                        receivers = (receivers == "") ? (receivers + user.name) : (receivers + "," + user.name);

                    }
                }


                userIds = [...new Set([...userIds])];

                messages.message = new Crypto().encrypt(AppSettings.messageEncriptionKey, messages.body);
                messages.subject = messages.subject.trim();
                messages.receivers = receivers;

                const message = await new MessageService().getContext().create(messages, { transaction: t })
                let messageid = message["messageid"];


                for (let index = 0; index < userIds.length; index++) {
                    let userid = userIds[index];
                    await new MessageperUsers().getContext().create({ messageid: messageid, userid: userid }, { transaction: t })
                }

                // if (receivers) {
                //     await new MessageperUsers().getContext().create({ messageid: messageid, receivers: receivers }, { transaction: t });
                // }
            })

        } catch (error) {
            return reject(error);
        }
    }

    async getMessage(page: number, pagesize: number, userid: number, searchstring: string) {
        try {
            let query = `SELECT mpu.guid, u.name as from, m.subject, mpu.isview, to_char(m.datecreated, 'yyyy-mm-dd HH24:MI:SS') as date
                        FROM messages m
                        INNER JOIN users u ON u.userid = m.senderuserid
                        INNER JOIN messageperusers mpu ON m.messageid = mpu.messageid WHERE `
            if (searchstring) {
                query += ` ( m.subject ilike '%${searchstring}%') AND `
            }

            query += ` m.datedeleted IS NULL AND mpu.datedeleted IS NULL AND u.datedeleted IS NULL
                        AND mpu.userid =${userid}
                        ORDER BY m.datecreated DESC`;

            let messages = await Sequelize.query(query)
                .then(data => data[0]);
            const offset: number = pagesize * (page - 1);
            const totalcount: number = messages.length;
            return {
                data: messages.slice(offset, offset + pagesize),
                totalcount: totalcount
            };
            // return messages
        } catch (error) {
            return reject(error);
        }
    }

    async getSentMessages(page: number, pagesize: number, userid: number, searchstring: string) {
        try {
            let query = `SELECT m.guid, m.subject,m.receivers as receivers, to_char(m.datecreated, 'yyyy-mm-dd HH24:MI:SS') as date
                        FROM messages m
                        INNER JOIN users su ON su.userid = m.senderuserid WHERE `;
            if (searchstring) {
                query += ` ( m.subject ilike '%${searchstring}%' OR m.receivers ilike '%${searchstring}%' ) AND `
            }
            query += ` m.datedeleted IS NULL 
                        AND su.datedeleted IS NULL 
                        AND m.senderuserid =${userid}
                        ORDER BY m.datecreated DESC`;
            let sentmessages = await Sequelize.query(query)
                .then(data => {
                    return data[0]
                });
            // return sentmessages;

            const offset: number = pagesize * (page - 1);
            const totalcount: number = sentmessages.length;
            return {
                data: sentmessages.slice(offset, offset + pagesize),
                totalcount: totalcount
            };
        }
        catch (error) {
            return reject(error);
        }
    }

    async getMessageById(guid: string) {
        try {
            const query = `SELECT mpu.guid, u.name as from, m.subject, m.message, to_char(mpu.datecreated, 'yyyy-mm-dd HH24:MI:SS') as date
                            FROM messages m
                            INNER JOIN users u ON u.userid = m.senderuserid
                            INNER JOIN messageperusers mpu ON m.messageid = mpu.messageid
                            WHERE m.datedeleted IS NULL AND mpu.datedeleted IS NULL AND u.datedeleted IS NULL
                            AND mpu.guid ='${guid}'`;

            let data = await Sequelize.query(query)
                .then(data => {
                    return data[0][0];
                });

            await new MessageperUsers().update({ isview: true, guid: guid });
            data.message = new Crypto().decrypt(AppSettings.messageEncriptionKey, data.message);
            return data;
        } catch (error) {
            return reject(error);
        }
    }

    async getSentMessageById(guid) {
        try {
            const query = `SELECT m.guid, su.name as from, m.receivers as to, m.subject, m.message, to_char(m.datecreated, 'yyyy-mm-dd HH24:MI:SS') as date
                            FROM messages m
                            INNER JOIN users su ON su.userid = m.senderuserid
                            WHERE m.datedeleted IS NULL 
                            AND su.datedeleted IS NULL
                            AND m.guid ='${guid}'`;
            let data = await Sequelize.query(query)
                .then(data => {
                    return data[0][0];
                });
            data.message = new Crypto().decrypt(AppSettings.messageEncriptionKey, data.message);
            return data;

        } catch (error) {
            return reject(error);
        }
    }
}