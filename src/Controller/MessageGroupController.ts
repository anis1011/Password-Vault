import { Validation } from "../Lib/Common/Validation";
import { MessaageGroupService } from '../Service/MessageGroupService';
import { LogService } from './../Service/LogService';
import { UserService } from './../Service/UserService';

export class MessageGroupController {

    async getAllUsersAndMessageGroups(req, res) {
        try {
            const userid: number = res.locals.user.UserId;
            const name: string = req.query.name;
            const flag: number = parseInt(req.query.flag);
            let queryString: any = { datedeleted: null }
            if (name) {
                queryString.name = new MessaageGroupService().getQueryStringName(name.trim());
            }

            let users: any = await new UserService().getContext().findAll({ where: queryString, order: [['name', 'ASC']], attributes: ["guid", "name"] });

            queryString.creationuserid = userid;
            let messagegroups: any = await new MessaageGroupService().getContext().findAll({ where: queryString, order: [['name', 'ASC']], attributes: ["guid", "name"] });

            const responsedata = {
                users: users,
                messagegroups: messagegroups
            }
            return res.status(200).send(responsedata);

        } catch (error) {
            new LogService().Log('MessageGroups getAllUsersAndMessageGroups', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't get users and messagegroups" });
        }
    }

    async getMessagegroups(req, res) {

    }

    async getMessageGroupbyId(req, res) {
        try {
            const guid: string = req.params.guid;
            let messagegroup: any = await new MessaageGroupService().getContext().find({ where: { datedeleted: null, guid: guid }, attributes: ['name', 'members'] });
            if (!messagegroup) {
                new LogService().Log('MessageGroups getMessageGroupbyid', 'E', 'Rest Service', res.locals.user.UserId, null, 'MessageGroup not found', null);
                return res.status(404).send({ message: `No record not found` });
            }
            messagegroup = await new MessaageGroupService().getmessageGroupById(messagegroup);
            res.status(200).send(messagegroup);
        } catch (error) {
            new LogService().Log('MessageGroups getMessageGroupbyid', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't get messagegroup" })
        }
    }

    async addMessageGroups(req, res) {
        try {
            const messagegroups = req.body;
            let schema = Validation.getSchema({
                name: Validation.Joi.string().required(),
                members: Validation.Joi.array().items(Validation.Joi.string()).required()
            });

            let err = Validation.getError(messagegroups, schema);
            if (err) {
                new LogService().Log("Add messagegroup", "E", "Rest service", null, null, err.message, err.stack);
                res.status(422).send({ message: `Invalid request data` });
            } else {
                messagegroups.creationuserid = res.locals.user.UserId;
                await new MessaageGroupService().addEditMessageGroup(messagegroups)
                res.status(200).send({ message: "ok" });
            }
        } catch (error) {
            new LogService().Log('MessageGroups addMessageGroups', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't add messagegroup" });
        }
    }

    async updateMessageGroups(req, res) {
        try {
            const messagegroups = req.body;
            let schema = Validation.getSchema({
                guid: Validation.Joi.string().required(),
                name: Validation.Joi.string().max(100).required(),
                members: Validation.Joi.array().items(Validation.Joi.string()).required()
            });

            let err = Validation.getError(messagegroups, schema);
            if (err) {
                new LogService().Log("Update messagegroup", "E", "Rest service", null, null, err.message, err.stack);
                return res.status(422).send({ message: `Invalid request data` });
            }
            messagegroups.creationuserid = res.locals.user.UserId;
            await new MessaageGroupService().addEditMessageGroup(messagegroups);
            res.status(200).send({ message: "ok" })
        } catch (error) {
            new LogService().Log('MessageGroups updateMessageGroups', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't update messagegroup" })
        }
    }

    async deleteMessagegroups(req, res) {
        try {
            let guids = req.query.messagegroupids.split(',');
            const messageGroupService = new MessaageGroupService()
            await messageGroupService.deleteAll(guids);
            res.status(200).send({ message: "ok" })
        } catch (error) {
            new LogService().Log('MessageGroups deleteMessageGroups', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't delete messagegroups" })
        }
    }
}