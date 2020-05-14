import { Request, Response } from "express";
import { Validation } from "../Lib/Common/Validation";
import { EntityService } from "../Service/EntityService";
import { LogService } from "../Service/LogService";
import { StatusService } from "../Service/StatusService";

export class StatusController {

  async getStatuses(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const logService = new LogService();
      const statusService = new StatusService();

      let queryString: any = {};

      if (req.query.status.trim()) {
        queryString.status = statusService.getQueryStringName(req.query.status.trim());
      }

      let status = await statusService
        .finds(page, pagesize, queryString, Object.keys(req.query)[2], ["guid", "status"])

      if (!status) {
        logService.Log("Status get Statuses", "I", "Rest Service", res.locals.user.UserId, null, "status not added yet !", null);
        return res.status(404).send({ message: "No record found" });
      }
      res.header("x-page-totalcount", `${status.totalcount}`);
      res.json(status.data);
    } catch (error) {
      new LogService().Log('Get statuses', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get status" });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      let guid = req.params.guid;

      const logService = new LogService();
      const statusService = new StatusService();
      let status = await statusService.findById(guid)
      if (!status) {
        logService.Log("Status get Statuses", "I", "Rest Service", res.locals.user.UserId, null, "status not found", null);
        return res.status(404).send({ message: "No record found" });
      }

      res.json({ guid: status["guid"], status: status["status"] });
    } catch (error) {
      new LogService().Log('Get status', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get status" });
    }
  }

  async addStatus(req: Request, res: Response) {
    try {
      let status = req.body;

      const statusService = new StatusService();
      let schema = Validation.getSchema({
        status: Validation.Joi.string().required()
      });

      let err = Validation.getError(status, schema);
      if (err) {
        new LogService().Log("Add status", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      let Status: any = await statusService.create(status)
      res.status(200).send({ guid: Status.guid });
    } catch (error) {
      new LogService().Log('Add status', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add status" });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      let status = req.body;

      const statusService = new StatusService();
      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required(),
        status: Validation.Joi.string().required()
      });

      let err = Validation.getError(status, schema);
      if (err) {
        new LogService().Log("Add status", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        res.status(422).send({ message: `Invalid request data` });
      } else {
        await statusService.update(status)
        res.status(200).send({ message: "ok" });
      }
    } catch (error) {
      new LogService().Log('Update status', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't update status" });
    }
  }

  async deleteStatus(req: Request, res: Response) {
    try {
      let guids = req.query.statusids.split(',');

      let statusService = new StatusService();
      let statusIds: any[] = [];

      for (let index = 0; index < guids.length; index++) {
        let id = await statusService.getId(guids[index], "statusid")
        statusIds.push({ statusid: id, datedeleted: null })
      }

      let entityService = new EntityService();
      let existOnEntity = await entityService.checkExisting(statusIds);

      if (existOnEntity) {
        throw { message: "Couldn't delete status" };
      }
      await statusService.deleteAll(guids)
      res.status(200).send({ message: "ok" });

    } catch (error) {
      new LogService().Log('Delete status', 'E', 'Rest Service', res.locals.user.UserId, null, error.message, error.stack)
      res.status(500).send({ message: "Couldn't delete status" });
    }
  }
}
