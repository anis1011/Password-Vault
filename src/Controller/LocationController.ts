import { Request, Response } from "express";
import { Validation } from "../Lib/Common/Validation";
import { EntityService } from "../Service/EntityService";
import { LocationService } from "../Service/LocationService";
import { LogService } from "../Service/LogService";

export class LocationController {

  async getLocations(req: Request, res: Response) {
    try {
      const page: number = parseInt(req.query.page);
      const pagesize: number = parseInt(req.query.pagesize);

      const locationService = new LocationService();
      const logService = new LogService();

      let queryString: any = {};
      if (req.query.location.trim()) {
        queryString.location = locationService.getQueryStringName(req.query.location.trim());
      }

      const locations = await locationService
        .finds(page, pagesize, queryString, Object.keys(req.query)[2], ["guid", "location"])
      if (!locations) {
        logService.Log("Get locations", "I", "Rest Service", res.locals.user.UserId, null, "location not added yet !", null);
        res.status(404).send({ message: "No record found" });

      } else {
        res.header("x-page-totalcount", `${locations.totalcount}`);
        res.json(locations.data);
      }
    } catch (error) {
      new LogService().Log("Get locations", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get locations" });
    }
  }

  async getLocation(req: Request, res: Response) {
    try {
      let guid = req.params.guid;

      const locationService = new LocationService();
      const logService = new LogService();
      const location = await locationService.findById(guid)
      if (!location) {
        logService.Log("Location get Location", "I", "Rest Service", res.locals.user.UserId, null, "location not added yet !", null);
        res.status(404).send({ message: "No record found" });

      } else
        res.json({ guid: location["guid"], location: location["location"] });
    } catch (error) {
      new LogService().Log("Get location", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't get location" });
    }
  }

  async addLocation(req: Request, res: Response) {
    try {
      let location = req.body;

      const locationService = new LocationService();
      let schema = Validation.getSchema({
        location: Validation.Joi.string().required()
      });

      let err = Validation.getError(location, schema);
      if (err) {
        new LogService().Log("Add location", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        res.status(422).send({ message: `Invalid request data` });
      } else {
        const Location: any = await locationService.create(location)
        res.status(200).send({ guid: Location.guid });
      }
    } catch (error) {
      new LogService().Log("Add location", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't add location" });
    }
  }

  async updateLocation(req: Request, res: Response) {
    try {
      let location = req.body;
      const locationService = new LocationService();

      let schema = Validation.getSchema({
        guid: Validation.Joi.string().required(),
        location: Validation.Joi.string().required()
      });

      let err = Validation.getError(location, schema);

      if (err) {
        new LogService().Log("Add group", "E", "Rest service", res.locals.user.UserId, null, err.message, err.stack);
        return res.status(422).send({ message: `Invalid request data` });
      }
      await locationService.update(location);
      return res.status(200).send({ message: "ok" });
    } catch (error) {
      new LogService().Log("Update location", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't update location" });
    }
  }

  async deleteLocation(req: Request, res: Response) {
    try {
      let guids = req.query.locationids.split(',');

      let entityService = new EntityService();
      let locationService = new LocationService();
      let locationIds: any[] = [];

      for (let index = 0; index < guids.length; index++) {
        let locationid = await locationService.getId(guids[index], "locationid")
        locationIds.push({ locationid: locationid, datedeleted: null })
      }

      let existOnEntity = await entityService.checkExisting(locationIds);
      if (existOnEntity) {
        throw { message: "Couldn't delete location" };
      }

      await locationService.deleteAll(guids)
      res.status(200).send({ message: "ok" })

    } catch (error) {
      new LogService().Log("Delete location", "E", "Rest service", res.locals.user.UserId, null, error.message, error.stack);
      res.status(500).send({ message: "Couldn't Delete locations" });
    }
  }
}
