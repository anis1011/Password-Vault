import { Validation } from '../Lib/Common/Validation';
import { LogService } from './../Service/LogService';
import { MessageperUsers } from './../Service/MessageperUsersService';
import { MessageService } from './../Service/MessageService';

export class MessageController {

    async messagecount(req, res) {
        try {
            const userid = res.locals.user.UserId;
            const count = await new MessageperUsers().getContext().count({ where: { userid: userid, datedeleted: null, isview: false } })
            res.status(200).send({ count: count })
        } catch (error) {
            new LogService().Log('Message messagecount', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't get message count" });
        }
    }

    async getMessages(req, res) {
        try {
            const userid: number = res.locals.user.UserId;
            const page: number = parseInt(req.query.page);
            const pagesize: number = parseInt(req.query.pagesize);
            let searchstring: string = "";

            if (req.query.subject && req.query.subject.trim()) {
                searchstring = req.query.subject.trim();
            }

            let messages = await new MessageService().getMessage(page, pagesize, userid, searchstring);
            res.header("x-page-totalcount", `${messages.totalcount}`);
            res.status(200).send(messages.data);
        } catch (error) {
            new LogService().Log('Message getMessage', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't get messages" });
        }
    }

    async getMessageById(req, res) {
        try {
            const guid: string = req.params.guid;
            let data = await new MessageService().getMessageById(guid);
            res.status(200).send(data);
        } catch (error) {
            new LogService().Log('Message getMessageById', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "couldn't get message" });
        }
    }

    async getSentMessages(req, res) {
        try {

            const userid: number = res.locals.user.UserId;
            const page: number = parseInt(req.query.page);
            const pagesize: number = parseInt(req.query.pagesize);
            let searchstring: string = "";

            if (req.query.subject.trim()) {
                searchstring = req.query.subject.trim();
            }
            let sentmessages = await new MessageService().getSentMessages(page, pagesize, userid, searchstring);
            if (!sentmessages) {
                return res.send(404).send({ message: "No record found" });
            }
            res.header("x-page-totalcount", `${sentmessages.totalcount}`);
            res.status(200).send(sentmessages.data);
        } catch (error) {
            new LogService().Log('Message getSentMessage', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't get sent messages" });
        }
    }

    async getSentMessageById(req, res) {
        try {
            const guid: string = req.params.guid;
            let sentmessage = await new MessageService().getSentMessageById(guid);
            if (!sentmessage) {
                return res.send(404).send({ message: "No record found" });
            }
            res.status(200).send(sentmessage);
        } catch (error) {
            new LogService().Log('Message getSentMessageById', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't get sent message" });
        }
    }

    async sendMessage(req, res) {
        try {
            let messages = req.body;

            const schema = Validation.getSchema({
                recipentguids: Validation.Joi.object({ userguids: Validation.Joi.array().items(Validation.Joi.string()), messagegroupguids: Validation.Joi.array().items(Validation.Joi.string()) }).required(),
                subject: Validation.Joi.string().max(50, 'utf8').required(),
                body: Validation.Joi.string().max(1000, 'utf8')
            });

            const err = Validation.getError(messages, schema);
            if (err) {
                new LogService().Log("send message", "E", "Rest service", null, null, err.message, err.stack);
                res.status(422).send({ message: `Invalid request data` });
            } else {
                messages.senderuserid = res.locals.user.UserId;
                await new MessageService().sendMessage(messages)
                res.status(200).send({ message: "ok" })
            }
        } catch (error) {
            new LogService().Log('Message sendMessage', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't send message" });
        }
    }

    async deletemessages(req, res) {
        try {
            let guids = req.query.messageids.split(',');
            const messageperservice = new MessageperUsers();
            await messageperservice.deleteAll(guids);
            res.status(200).send({ message: "ok" });
        } catch (error) {
            new LogService().Log('Message delete message', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Couldn't delete messages" });
        }
    }

    async deleteSentmessages(req, res) {
        try {
            let guids = req.query.sentmessageids.split(',');
            const messageservice = new MessageService();
            await messageservice.deleteAll(guids);
            res.status(200).send({ message: "ok" });
        } catch (error) {
            new LogService().Log('Message delete sentmessage', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
            res.status(500).send({ message: "Cou;dn't delete sent messages" });
        }
    }
}