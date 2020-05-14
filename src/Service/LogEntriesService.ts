import { reject } from "bluebird";
import { Sequelize } from "../Repository/Sequelize";
import { AppDbContext } from "./../Repository/AppDbContext";
import { BaseService } from "./BaseService";
import { LogActionService } from "./LogActionService";

export class LogEntriesService extends BaseService {
  private readonly page: number;
  private readonly pagesize: number;
  private readonly entityname: string;
  private readonly userguid: string;
  private readonly entitytypeguid: string;
  private readonly projectguid: string;
  private readonly groupguid: string;
  private readonly actionguid: string;

  constructor(queryString?) {
    super(new AppDbContext().LogEntries());
    if (queryString) {
      this.page = queryString.page;
      this.pagesize = parseInt(queryString.pagesize);
      this.entityname = queryString.entityname.trim();
      this.userguid = queryString.userguid;
      this.entitytypeguid = queryString.entitytypeguid;
      this.projectguid = queryString.projectguid;
      this.groupguid = queryString.groupguid;
      this.actionguid = queryString.actionguid;
    }
  }

  //Save logentry
  async log(entityids: any[], action: string, userid, memo?: string) {
    try {
      const logActionService = new LogActionService();
      const logActionId = await logActionService.getLogActionId(action);

      let logEntries = [];

      entityids.forEach((entityId) => {
        let logEntry: any = {
          entityid: entityId,
          logactionid: logActionId,
          userid: userid
        };
        if (memo) {
          logEntry.memo = memo;
        }
        logEntries.push(logEntry)
      })

      return await this.createAll(logEntries);
    } catch (error) {
      return reject(error);
    }
  }

  //Get all log entries
  async getAllLogEntries() {
    try {
      let query: string;
      query = `SELECT e.name,et.name as entitytype,la.logactionname as action,u.name as user,le.datecreated
                    FROM logentries le
                    INNER JOIN entity e ON e.entityid = le.entityid
                    INNER JOIN users u ON u.userid = le.userid
                    INNER JOIN logactions la ON la.logactionid = le.logactionid
                    INNER JOIN entitytypes et ON et.entitytypeid = e.entitytypeid `;

      if (this.projectguid) {
        query += `INNER JOIN entityprojects ep ON ep.entityid = le.entityid
                    INNER JOIN projects p ON p.projectid = ep.projectid `;
      }
      if (this.groupguid) {
        query += `INNER JOIN entitygroups eg ON eg.entityid = le.entityid
                    INNER JOIN groups g ON g.groupid = eg.groupid `;
      }
      query += ` WHERE `;

      if (this.entityname) {
        query += `e.name ILIKE '%${this.entityname}%' AND`;
      }
      if (this.userguid) {
        query += ` u.guid = '${this.userguid}' AND`;
      }
      if (this.entitytypeguid) {
        query += ` et.guid = '${this.entitytypeguid}' AND`;
      }
      if (this.projectguid) {
        query += ` p.guid = '${this.projectguid}' AND`;
      }
      if (this.groupguid) {
        query += ` g.guid = '${this.groupguid}' AND`;
      }
      if (this.actionguid) {
        query += ` la.guid = '${this.actionguid}' AND`;
      }

      query += ` le.datedeleted IS NULL AND e.datedeleted IS NULL AND u.datedeleted IS NULL 
                            AND la.datedeleted IS NULL AND et.datedeleted IS NULL `;

      if (this.projectguid) {
        query += ` AND ep.datedeleted IS NULL AND p.datedeleted IS NULL `;
      }
      if (this.groupguid) {
        query += ` AND eg.datedeleted IS NULL AND g.datedeleted IS NULL `;
      }

      query += ` ORDER BY le.datecreated DESC`;

      return await Sequelize.query(query)
        .then(data => {
          let offset = this.pagesize * (this.page - 1);
          let totalcount = data[1].rows.length;
          return {
            data: data[0].slice(offset, offset + this.pagesize),
            totalcount: totalcount
          };
        })
    } catch (error) {
      return reject(error);
    }

  }
}
