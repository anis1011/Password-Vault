import * as bodyParser from "body-parser";
import * as cookieEncrypter from "cookie-encrypter";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as fs from "fs";
import * as https from "https";
import { AppSettings } from "./AppSettings";
import { EntityController } from "./Controller/EntityController";
import { EntityGroupController } from "./Controller/EntityGroupController";
import { EntityProjectController } from "./Controller/EntityProjectController";
import { EntityTypeController } from "./Controller/EntityTypeController";
import { EntityUserController } from "./Controller/EntityUserController";
import { GroupController } from "./Controller/GroupController";
import { GroupUserController } from "./Controller/GroupUserController";
import { LocationController } from "./Controller/LocationController";
import { LogActionController } from "./Controller/LogActionController";
import { LogEntriesController } from "./Controller/LogEntriesController";
import { LoginController } from "./Controller/LoginController";
import { MenuItemController } from "./Controller/MenuItemController";
import { MessageController } from './Controller/MessageController';
import { MessageGroupController } from './Controller/MessageGroupController';
import { ProjectController } from "./Controller/ProjectController";
import { ProjectUserController } from "./Controller/ProjectUserController";
import { StatusController } from "./Controller/StatusController";
import { UserController } from "./Controller/UserController";
import { UserEntityController } from "./Controller/UserEntityController";
import { UserOwnedEntitiesController } from "./Controller/UserOwnedEntitiesController";
import { IsAuthenticate } from "./Middleware/Authentication";
import { isAuthorized } from "./Middleware/Authorization";



// create express application
const app: express.Application = express();

// let express support JSON bodies
app.use(bodyParser.json());

//#region CORS
app.use((req, res, next) => {
  let allowedOrigins = [
    "https://ppws3.procit.com"
  ];
  let origin: any = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,OPTIONS,PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Expose-Headers",
    "Link,x-page-index,x-page-totalcount,x-page-pagesize,EntityLink,UserLink,GroupLink,ProjectLink"
  );
  next();
});
//#endregion CORS

//#region Cookie
const cookieKey = AppSettings.cookieSignKey;
app.use(cookieParser(cookieKey));
app.use(cookieEncrypter(cookieKey));

//#endregion Cookie

//#region test apis
app.get("/api/ping", (req, res) => {
  res.send("Ping successful");

});
//#endregion test apis

//#region Message
app.get("/api/messages", IsAuthenticate, (req, res) => {
  new MessageController().getMessages(req, res);
})

app.get("/api/countmessage", IsAuthenticate, (req, res) => {
  new MessageController().messagecount(req, res);
})

app.get("/api/messages/:guid", IsAuthenticate, (req, res) => {
  new MessageController().getMessageById(req, res);
})

app.post("/api/messages", IsAuthenticate, (req, res) => {
  new MessageController().sendMessage(req, res);
})

app.delete("/api/messages", IsAuthenticate, (req, res) => {
  new MessageController().deletemessages(req, res)
})
//#endregion Message

//#region sentmessage
app.get("/api/sentmessages", IsAuthenticate, (req, res) => {
  new MessageController().getSentMessages(req, res);
})

app.get("/api/sentmessages/:guid", IsAuthenticate, (req, res) => {
  new MessageController().getSentMessageById(req, res);
})

app.delete("/api/sentmessages", IsAuthenticate, (req, res) => {
  new MessageController().deleteSentmessages(req, res)
})
//#endregion sentmessage

//#region MyEntities
app.get("/api/myentities", IsAuthenticate, (req, res) => {
  new UserOwnedEntitiesController().getmyentities(req, res);
})
//#endregion MyEntities

//#region MessageGroups
app.get("/api/getallusersandmessagegroups", IsAuthenticate, (req, res) => {
  new MessageGroupController().getAllUsersAndMessageGroups(req, res);
})

app.get("/api/messagegroups/:guid", IsAuthenticate, (req, res) => {
  new MessageGroupController().getMessageGroupbyId(req, res);
})

app.post("/api/messagegroups", IsAuthenticate, (req, res) => {
  new MessageGroupController().addMessageGroups(req, res);
})

app.put("/api/messagegroups", IsAuthenticate, (req, res) => {
  new MessageGroupController().updateMessageGroups(req, res);
})

app.delete("/api/messagegroups", IsAuthenticate, (req, res) => {
  new MessageGroupController().deleteMessagegroups(req, res);
})
//#endregion MessageGroups

//#region Entity
app.get("/api/entities", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityController().getEntities(req, res);
});

app.get("/api/entities/:guid", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityController().getEntityById(req, res);
});

app.post("/api/entities", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityController().addEntity(req, res);
});

app.put("/api/entities", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityController().updateEntity(req, res);
});

app.delete("/api/entities", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityController().deleteEntity(req, res);
});

app.get("/api/getdropdownforuser", IsAuthenticate, (req, res) => {
  new EntityController().getDropDownListForUser(req, res);
})

app.get("/api/getdropdownforadmin", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityController().getDropDownListForAdmin(req, res);
})
//#endregion Entity

//#region EntitiesByEntityType
app.get("/api/EntitiesByEntityType", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityController().getEntitiesByEntityType(req, res);
});
//#endregion EntitiesByEntityType

//#region EntityGroups
app.get("/api/entitygroups", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityGroupController().getEntityGroups(req, res);
});

app.post("/api/entitygroups", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityGroupController().addEntityGroup(req, res);
});

app.delete("/api/entitygroups", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityGroupController().deleteEntityGroup(req, res);
});
//#endregion EntityGroups

//#region EntityProjects
app.get("/api/entityprojects", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityProjectController().getEntityProjects(req, res);
});

app.post("/api/entityprojects", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityProjectController().addProjectEntity(req, res);
});

app.delete("/api/entityprojects", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityProjectController().deleteEntityProject(req, res);
});
//#endregion EntityProjects

//#region EntityTypes
app.get("/api/entitytypes", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityTypeController().getEntityTypes(req, res);
});

app.get("/api/entitytypes/:guid", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityTypeController().getEntityType(req, res);
});

app.post("/api/entitytypes/", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityTypeController().addEntityType(req, res);
});

app.put("/api/entitytypes/", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityTypeController().updateEntityType(req, res);
});

app.delete("/api/entitytypes/", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityTypeController().deleteEntityType(req, res);
});
//#endregion EntityTypes

//#region EntityUserV2
app.get("/api/entityusers", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityUserController().getEntityUsers(req, res);
});

app.post("/api/entityusers", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityUserController().addEntityUser(req, res);
});

app.delete("/api/entityusers", IsAuthenticate, isAuthorized, (req, res) => {
  new EntityUserController().deleteEntityUser(req, res);
});
//#endregion EntityUserV2

//#region Groups
app.get("/api/Groups", IsAuthenticate, isAuthorized, (req, res) => {
  new GroupController().getGroups(req, res);
});

app.get("/api/Groups/:guid", IsAuthenticate, isAuthorized, (req, res) => {
  new GroupController().getGroup(req, res);
});

app.post("/api/Groups", IsAuthenticate, isAuthorized, (req, res) => {
  new GroupController().addGroups(req, res);
});

app.put("/api/Groups", IsAuthenticate, isAuthorized, (req, res) => {
  new GroupController().updateGroup(req, res);
});

app.delete("/api/Groups", IsAuthenticate, isAuthorized, (req, res) => {
  new GroupController().deleteGroup(req, res);
});
//#endregion Groups

//#region GroupUsers
app.get("/api/groupusers", IsAuthenticate, isAuthorized, (req, res) => {
  new GroupUserController().getGroupUsers(req, res);
});

app.post("/api/groupusers", IsAuthenticate, isAuthorized, (req, res) => {
  new GroupUserController().addGroupUser(req, res);
});

app.delete("/api/groupusers", IsAuthenticate, isAuthorized, (req, res) => {
  new GroupUserController().deleteGroupUser(req, res);
});
//#endregion GroupUsers

//#region Locations
app.get("/api/locations/:guid", IsAuthenticate, isAuthorized, (req, res) => {
  new LocationController().getLocation(req, res);
})
app.get("/api/locations", IsAuthenticate, isAuthorized, (req, res) => {
  new LocationController().getLocations(req, res);
});

app.post("/api/locations", IsAuthenticate, isAuthorized, (req, res) => {
  new LocationController().addLocation(req, res);
});

app.put("/api/locations", IsAuthenticate, isAuthorized, (req, res) => {
  new LocationController().updateLocation(req, res);
});

app.delete("/api/locations", IsAuthenticate, isAuthorized, (req, res) => {
  new LocationController().deleteLocation(req, res);
});
//#endregion Locations

//#region LogActions
app.get("/api/logactions", IsAuthenticate, isAuthorized, (req, res) => {
  new LogActionController().getLogActions(req, res);
});
//#endregion LogActions

//#region LogEntries
app.get("/api/logEntries", IsAuthenticate, isAuthorized, (req, res) => {
  new LogEntriesController().getAllLogEntries(req, res);
});
//#endregion LogEntries

//#region Login
app.post("/api/login", (req, res) => {
  new LoginController().Login(req, res);
});
//#endregion Login

//#region Logout
app.patch("/api/logout", IsAuthenticate, (req, res) => {
  new LoginController().Logout(req, res);
});
//#endregion Logout

//#region MenuItems
app.get("/api/menuitems", IsAuthenticate, (req, res) => {
  new MenuItemController().getMenuItems(req, res);
});
//#endregion MenuItems

//#region Projects
app.get("/api/projects", IsAuthenticate, isAuthorized, (req, res) => {
  new ProjectController().getProjects(req, res);
});
app.get("/api/projects/:guid", IsAuthenticate, isAuthorized, (req, res) => {
  new ProjectController().getProject(req, res);
});
app.post("/api/projects", IsAuthenticate, isAuthorized, (req, res) => {
  new ProjectController().addProject(req, res);
});
app.put("/api/projects", IsAuthenticate, isAuthorized, (req, res) => {
  new ProjectController().updateProject(req, res);
});
app.delete("/api/projects", IsAuthenticate, isAuthorized, (req, res) => {
  new ProjectController().deleteProject(req, res);
});
//#endregion Projects

//#region ProjectUsers
app.get("/api/projectusers", IsAuthenticate, isAuthorized, (req, res) => {
  new ProjectUserController().getProjectUsers(req, res);
});

app.post("/api/projectusers", IsAuthenticate, isAuthorized, (req, res) => {
  new ProjectUserController().addProjectUser(req, res);
});

app.delete("/api/projectusers", IsAuthenticate, isAuthorized, (req, res) => {
  new ProjectUserController().deleteProjectUser(req, res);
});
//#endregion ProjectUsers

//#region Status
app.get("/api/statuses", IsAuthenticate, isAuthorized, (req, res) => {
  new StatusController().getStatuses(req, res);
});
app.get("/api/statuses/:guid", IsAuthenticate, isAuthorized, (req, res) => {
  new StatusController().getStatus(req, res);
});
app.post("/api/statuses", IsAuthenticate, isAuthorized, (req, res) => {
  new StatusController().addStatus(req, res);
});
app.put("/api/statuses", IsAuthenticate, isAuthorized, (req, res) => {
  new StatusController().updateStatus(req, res);
});
app.delete("/api/statuses", IsAuthenticate, isAuthorized, (req, res) => {
  new StatusController().deleteStatus(req, res);
});
//#endregion Status 

//#region UserOwnedEntities
app.get("/api/userownedentities", IsAuthenticate, (req, res) => {
  new UserOwnedEntitiesController().getUserOwnedEntity(req, res);
});

app.get("/api/userownedentities/:guid", IsAuthenticate, (req, res) => {
  new UserOwnedEntitiesController().getSingleEntity(req, res);
});

app.post("/api/userownedentities", IsAuthenticate, (req, res) => {
  new UserOwnedEntitiesController().addFavourite(req, res);
});
//#endregion UserOwnedEntities

//#region UserEntities
app.post("/api/userentities", IsAuthenticate, (req, res) => {
  new UserEntityController().addUserEntity(req, res);
});

app.put("/api/userentities", IsAuthenticate, (req, res) => {
  new UserEntityController().updateUserEntity(req, res);
});

app.delete("/api/userentities/:guid", IsAuthenticate, (req, res) => {
  new UserEntityController().DeleteUserEntity(req, res);
});
//#endregion UserEntities

//#region Users
app.get("/api/users", IsAuthenticate, isAuthorized, (req, res) => {
  new UserController().getUsers(req, res);
});

app.get("/api/users/:guid", IsAuthenticate, isAuthorized, (req, res) => {
  new UserController().getUser(req, res);
});

app.post("/api/users", IsAuthenticate, isAuthorized, (req, res) => {
  new UserController().addUser(req, res);
});

app.put("/api/users", IsAuthenticate, isAuthorized, (req, res) => {
  new UserController().updateUser(req, res);
});

app.put("/api/users/changepassword", IsAuthenticate, isAuthorized, (req, res) => {
  new UserController().changePassword(req, res);
});

app.delete("/api/users", IsAuthenticate, isAuthorized, (req, res) => {
  new UserController().deleteUser(req, res);
});
//#endregion Users



//start https server and exit handlers
let httpsOptions = {
  key: fs.readFileSync(`${AppSettings.certificatePath}\\privatekey.key`),
  cert: fs.readFileSync(`${AppSettings.certificatePath}\\certificate.crt`)
}

var server = https.createServer(httpsOptions, app)
server.listen(7777, function () {
  console.log("Listening on port 7777!");
  console.log('PID: ', process.pid);
});

process.on('SIGINT', function () {
  console.log('Naughty SIGINT-handler');
  process.exit();
});

process.on('exit', function () {
  console.log('exit handler');
  process.exit();
});

process.on('SIGINT', function () {
  console.log('Nice SIGINT-handler');
  var listeners = process.listeners('SIGINT');
  for (var i = 0; i < listeners.length; i++) {
    console.log(listeners[i].toString());
  }

  process.exit();
});