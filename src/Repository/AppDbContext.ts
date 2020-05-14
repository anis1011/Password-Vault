import * as sequelize from "sequelize";
import { Sequelize } from "./Sequelize";

export class AppDbContext {
  models: any;

  constructor() {
    this.models = {
      Entity: this.Entities(),
      EntityGroup: this.EntityGroup(),
      EntityProject: this.EntityProject(),
      EntityType: this.EntityTypes(),
      Group: this.Groups(),
      GroupUser: this.GroupUser(),
      Menu: this.MenuItems(),
      Project: this.Projects(),
      ProjectUser: this.ProjectUser(),
      Location: this.Locations(),
      LogAction: this.LogActions(),
      LogEntries: this.LogEntries(),
      Status: this.Status(),
      UserOwnedEntities: this.UserOwnedEntities(),
      User: this.Users(),
      Message: this.Messages(),
      MessageGroups: this.MessageGroups(),
      MessagePerUsers: this.MessagePerUsers()
    };
    this.associate();
  }

  //Establish entity relationships
  associate() {
    Object.keys(this.models).forEach(modelName => {
      if ("associate" in this.models[modelName]) {
        this.models[modelName].associate(this.models);
      }
    });
  }

  Entities() {
    let Entity = Sequelize.define(
      "entity",
      {
        entityid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        entitytypeid: sequelize.INTEGER,
        name: sequelize.STRING,
        masterencodedvalue: sequelize.STRING,
        ipvalue: sequelize.STRING,
        domainvalue: sequelize.STRING,
        usernamevalue: sequelize.STRING,
        passwordvalue: sequelize.STRING,
        urlvalue: sequelize.STRING,
        comment: sequelize.STRING,
        portvalue: sequelize.STRING,
        internalip1: sequelize.STRING,
        internalip2: sequelize.STRING,
        externalip1: sequelize.STRING,
        externalip2: sequelize.STRING,
        wanip1: sequelize.STRING,
        wanip2: sequelize.STRING,
        backuplocation: sequelize.STRING,
        locationid: sequelize.INTEGER,
        statusid: sequelize.INTEGER,
        dtinstallation: sequelize.STRING,
        member: sequelize.STRING,
        localusers: sequelize.STRING,
        mainboard: sequelize.STRING,
        ram: sequelize.STRING,
        harddrive: sequelize.STRING,
        housing: sequelize.STRING,
        brand: sequelize.STRING,
        pdu: sequelize.STRING,
        pduport: sequelize.STRING,
        sqlsrvversion: sequelize.STRING,
        liveapp: sequelize.STRING,
        testapp: sequelize.STRING,
        livedb: sequelize.STRING,
        testdb: sequelize.STRING,
        radmin: sequelize.INTEGER,
        vnc: sequelize.INTEGER,
        rdp: sequelize.INTEGER,
        ssh: sequelize.INTEGER,
        virtualhost: sequelize.STRING,
        assetid: sequelize.INTEGER,
        datecreated: sequelize.DATE,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1
        }
      },
      {
        tableName: "entity",
        timestamps: false
      }
    );
    Entity.associate = models => {
      Entity.belongsToMany(models.User, {
        through: models.UserOwnedEntities,
        foreignKey: "entityid"
      });

      Entity.belongsToMany(models.Project, {
        through: models.EntityProject,
        foreignKey: "entityid"
      });

      Entity.belongsToMany(models.Group, {
        through: models.EntityGroup,
        foreignKey: "entityid"
      });

      Entity.belongsTo(models.EntityType, {
        foreignKey: "entitytypeid"
      });
      Entity.belongsTo(models.Location, {
        foreignKey: "locationid"
      });
      Entity.belongsTo(models.Status, {
        foreignKey: "statusid"
      });
      Entity.belongsTo(models.Entity, {
        foreignKey: "radmin",
        as: "RadminEntity"
      });
      Entity.belongsTo(models.Entity, {
        foreignKey: "vnc",
        as: "VncEntity"
      });
      Entity.belongsTo(models.Entity, {
        foreignKey: "ssh",
        as: "SshEntity"
      });
      Entity.belongsTo(models.Entity, {
        foreignKey: "rdp",
        as: "RdpEntity"
      });
    };
    return Entity;
  }

  EntityGroup() {
    return Sequelize.define(
      "EntityGroup",
      {
        entitygroupid: {
          type: sequelize.INTEGER,
          autoIncrement: true
        },
        guid: {
          type: sequelize.UUIDV1,
          primaryKey: true,
          defaultValue: sequelize.UUIDV1
        },
        groupid: sequelize.INTEGER,
        entityid: sequelize.INTEGER,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "entitygroups",
        timestamps: false
      }
    );
  }

  EntityProject() {
    let entityProject = Sequelize.define(
      "EntityProject",
      {
        entityprojectid: {
          type: sequelize.INTEGER,
          autoIncrement: true
        },
        guid: {
          type: sequelize.UUIDV1,
          primaryKey: true,
          defaultValue: sequelize.UUIDV1
        },
        projectid: sequelize.INTEGER,
        entityid: sequelize.INTEGER,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "entityprojects",
        timestamps: false
      }
    );

    return entityProject;
  }

  EntityTypes() {
    return Sequelize.define(
      "EntityTypes",
      {
        entitytypeid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        name: sequelize.STRING,
        datecreated: sequelize.DATE,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1
        }
      },
      {
        tableName: "entitytypes",
        timestamps: false
      }
    );
  }

  Groups() {
    let Group = Sequelize.define(
      "Groups",
      {
        groupid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1
        },
        description: sequelize.STRING,
        datecreated: sequelize.DATE,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE
      },
      {
        tableName: "groups",
        timestamps: false
      }
    );
    Group.associate = models => {
      Group.belongsToMany(models.User, {
        through: models.GroupUser,
        foreignKey: "groupid"
      });

      Group.belongsToMany(models.Entity, {
        through: models.EntityGroup,
        foreignKey: "groupid"
      });
    };
    return Group;
  }

  GroupUser() {
    return Sequelize.define(
      "GroupUser",
      {
        groupuserid: {
          type: sequelize.INTEGER,
          autoIncrement: true
        },
        guid: {
          type: sequelize.UUIDV1,
          primaryKey: true,
          defaultValue: sequelize.UUIDV1
        },
        groupid: sequelize.INTEGER,
        userid: sequelize.INTEGER,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "groupusers",
        timestamps: false
      }
    );
  }

  Locations() {
    return Sequelize.define(
      "Locations",
      {
        locationid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        guid: {
          type: sequelize.UUIDV1,
          defaultValue: sequelize.UUIDV1
        },
        location: sequelize.STRING,
        datecreated: sequelize.DATE,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE
      },
      {
        tableName: "locations",
        timestamps: false
      }
    );
  }

  LogActions() {
    return Sequelize.define(
      "LogAction",
      {
        logactionid: {
          type: sequelize.INTEGER,
          autoIncrement: true
        },
        guid: {
          type: sequelize.UUIDV1,
          primaryKey: true,
          defaultValue: sequelize.UUIDV1
        },
        logactionname: sequelize.STRING,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "logactions",
        timestamps: false
      }
    );
  }

  LogEntries() {
    const LogEntries = Sequelize.define(
      "LogEntries",
      {
        logentriesid: {
          type: sequelize.INTEGER,
          autoIncrement: true
        },
        guid: {
          type: sequelize.UUIDV1,
          primaryKey: true,
          defaultValue: sequelize.UUIDV1
        },
        entityid: sequelize.INTEGER,
        logactionid: sequelize.INTEGER,
        userid: sequelize.INTEGER,
        memo: sequelize.STRING,
        datecreated: sequelize.DATE,
        datedeleted: sequelize.DATE
      },
      {
        timestamps: false,
        tableName: "logentries"
      }
    );

    LogEntries.associate = models => {
      LogEntries.belongsTo(models.Entity, {
        foreignKey: "entityid"
      });
      LogEntries.belongsTo(models.User, {
        foreignKey: "userid"
      });
      LogEntries.belongsTo(models.LogAction, {
        foreignKey: "logactionid"
      });
    };
    return LogEntries;
  }

  LogInfo() {
    return Sequelize.define(
      "LogInfo",
      {
        loginfoid: {
          type: sequelize.INTEGER,
          autoIncrement: true
        },
        guid: {
          type: sequelize.UUIDV1,
          primaryKey: true,
          defaultValue: sequelize.UUIDV1
        },
        message: sequelize.STRING,
        description: sequelize.STRING,
        stacktrace: sequelize.TEXT,
        severity: sequelize.STRING,
        userid: sequelize.INTEGER,
        runtimereference: sequelize.STRING,
        processname: sequelize.STRING,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "loginfo",
        timestamps: false
      }
    );
  }

  MenuItems() {
    const MenuItems = Sequelize.define(
      "MenuItems",
      {
        menuitemid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1
        },
        parentmenuid: sequelize.INTEGER,
        menuname: sequelize.STRING,
        sortorder: sequelize.STRING,
        path: sequelize.STRING,
        icon: sequelize.STRING,
        accesslabelid: sequelize.INTEGER,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "menuitems",
        timestamps: false
      }
    );

    MenuItems.associate = models => {
      MenuItems.hasMany(models.Menu, {
        foreignKey: "parentmenuid",
        as: "ChildMenu"
      });
    };
    return MenuItems;
  }

  Messages() {
    let Message = Sequelize.define(
      "Messages",
      {
        messageid: {
          type: sequelize.INTEGER,
          autoincrement: true
        },
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1,
          primaryKey: true
        },
        senderuserid: sequelize.INTEGER,
        subject: sequelize.STRING,
        message: sequelize.STRING,
        receivers: sequelize.STRING,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "messages",
        timestamps: false
      }
    );
    Message.associate = models => {
      Message.belongsTo(models.User, {
        foreignKey: "senderuserid"
      }),
        Message.belongsToMany(models.User, {
          through: models.MessagePerUsers,
          foreignKey: "messageid"
        })
    }
    return Message;
  }

  MessageGroups() {
    let MessageGroups = Sequelize.define(
      "MessageGroups", {
        messagegroupid: {
          type: sequelize.INTEGER,
          autoincrement: true
        },
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1,
          primaryKey: true
        },
        creationuserid: sequelize.INTEGER,
        name: sequelize.STRING,
        members: sequelize.ARRAY(sequelize.INTEGER),
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "messagegroups",
        timestamps: false
      }
    );
    MessageGroups.associate = models => {
      MessageGroups.belongsTo(models.User, {
        foreignKey: "creationuserid"
      })
    };
    return MessageGroups;
  }

  MessagePerUsers() {
    let MessagePerUser = Sequelize.define(
      "MessagePerUser", {
        messageperuserid: {
          type: sequelize.INTEGER,
          autoincrement: true
        },
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1,
          primaryKey: true
        },
        messageid: sequelize.INTEGER,
        userid: sequelize.INTEGER,
        isview: sequelize.BOOLEAN,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      }, {
        tableName: 'messageperusers',
        timestamps: false
      }
    );
    return MessagePerUser;
  }

  Projects() {
    let Project = Sequelize.define(
      "Projects",
      {
        projectid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        guid: {
          type: sequelize.UUIDV1,
          defaultValue: sequelize.UUIDV1
        },
        name: sequelize.STRING,
        description: sequelize.STRING,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "projects",
        timestamps: false
      }
    );

    Project.associate = models => {
      Project.belongsToMany(models.Entity, {
        through: models.EntityProject,
        foreignKey: "projectid"
      });
      Project.belongsToMany(models.User, {
        through: models.ProjectUser,
        foreignKey: "projectid"
      });
    };

    return Project;
  }

  ProjectUser() {
    return Sequelize.define(
      "ProjectUser",
      {
        projectuserid: {
          type: sequelize.INTEGER,
          autoIncrement: true
        },
        guid: {
          type: sequelize.UUIDV1,
          primaryKey: true,
          defaultValue: sequelize.UUIDV1
        },
        projectid: sequelize.INTEGER,
        userid: sequelize.INTEGER,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "projectusers",
        timestamps: false
      }
    );
  }

  Status() {
    return Sequelize.define(
      "Status",
      {
        statusid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        guid: {
          type: sequelize.UUIDV1,
          defaultValue: sequelize.UUIDV1
        },
        status: sequelize.STRING,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE
      },
      {
        tableName: "status",
        timestamps: false
      }
    );
  }

  UserLoginInfo() {
    return Sequelize.define(
      "UserLoginInfo",
      {
        userlogininfoid: {
          type: sequelize.INTEGER,
          autoIncrement: true
        },
        guid: {
          type: sequelize.UUIDV1,
          primaryKey: true,
          defaultValue: sequelize.UUIDV1
        },
        userid: sequelize.INTEGER,
        dateloggedout: sequelize.DATE,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        datecreated: sequelize.DATE,
        encryptedtoken: sequelize.STRING
      },
      {
        tableName: "userlogininfo",
        timestamps: false
      }
    );
  }

  UserOwnedEntities() {
    let UserOwnedEntities = Sequelize.define(
      "userownedentities",
      {
        userownedentitiesid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        entityid: sequelize.INTEGER,
        entitytypeid: sequelize.INTEGER,
        name: sequelize.STRING,
        masterencodedvalue: sequelize.STRING,
        ipvalue: sequelize.STRING,
        domainvalue: sequelize.STRING,
        usernamevalue: sequelize.STRING,
        passwordvalue: sequelize.STRING,
        urlvalue: sequelize.STRING,
        comment: sequelize.STRING,
        portvalue: sequelize.STRING,
        internalip1: sequelize.STRING,
        internalip2: sequelize.STRING,
        externalip1: sequelize.STRING,
        externalip2: sequelize.STRING,
        wanip1: sequelize.STRING,
        wanip2: sequelize.STRING,
        backuplocation: sequelize.STRING,
        locationid: sequelize.INTEGER,
        statusid: sequelize.INTEGER,
        dtinstallation: sequelize.STRING,
        member: sequelize.STRING,
        localusers: sequelize.STRING,
        mainboard: sequelize.STRING,
        ram: sequelize.STRING,
        harddrive: sequelize.STRING,
        housing: sequelize.STRING,
        brand: sequelize.STRING,
        pdu: sequelize.STRING,
        pduport: sequelize.STRING,
        sqlsrvversion: sequelize.STRING,
        liveapp: sequelize.STRING,
        testapp: sequelize.STRING,
        livedb: sequelize.STRING,
        testdb: sequelize.STRING,
        radmin: sequelize.INTEGER,
        vnc: sequelize.INTEGER,
        rdp: sequelize.INTEGER,
        ssh: sequelize.INTEGER,
        virtualhost: sequelize.STRING,
        assetid: sequelize.INTEGER,
        userid: sequelize.INTEGER,
        isproject: sequelize.BOOLEAN,
        isgroup: sequelize.BOOLEAN,
        isdirectassign: sequelize.BOOLEAN,
        isfavourite: sequelize.BOOLEAN,
        lastseenat: sequelize.DATE,
        datecreated: sequelize.DATE,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1
        }
      },
      {
        tableName: "userownedentities",
        timestamps: false
      }
    );
    UserOwnedEntities.associate = models => {
      UserOwnedEntities.belongsTo(models.Location, {
        foreignKey: "locationid"
      });
      UserOwnedEntities.belongsTo(models.Status, {
        foreignKey: "statusid"
      });
      UserOwnedEntities.belongsTo(models.Entity, {
        foreignKey: "radmin",
        as: "RadminEntity"
      });
      UserOwnedEntities.belongsTo(models.Entity, {
        foreignKey: "vnc",
        as: "VncEntity"
      });
      UserOwnedEntities.belongsTo(models.Entity, {
        foreignKey: "ssh",
        as: "SshEntity"
      });
      UserOwnedEntities.belongsTo(models.Entity, {
        foreignKey: "rdp",
        as: "RdpEntity"
      });
    };
    return UserOwnedEntities;
  }

  Users() {
    let User = Sequelize.define(
      "users",
      {
        userid: {
          type: sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        name: sequelize.STRING,
        encpassword: sequelize.STRING,
        isadminyesno: sequelize.INTEGER,
        masterencpassword: sequelize.STRING,
        datecreated: sequelize.DATE,
        datemodified: sequelize.DATE,
        datedeleted: sequelize.DATE,
        isactive: sequelize.INTEGER,
        guid: {
          type: sequelize.UUID,
          defaultValue: sequelize.UUIDV1
        },
        email: sequelize.STRING,
        saltkey: sequelize.STRING,
        masterpassword: sequelize.STRING
      },
      {
        tableName: "users",
        timestamps: false
      }
    );
    User.associate = models => {
      User.belongsToMany(models.Entity, {
        through: models.UserOwnedEntities,
        foreignKey: "userid"
      });

      User.belongsToMany(models.Group, {
        through: models.GroupUser,
        foreignKey: "userid"
      });
      User.belongsToMany(models.Project, {
        through: models.ProjectUser,
        foreignKey: "userid"
      });

      User.belongsToMany(models.Message, {
        through: models.MessagePerUsers,
        foreignKey: "userid"
      })
    };
    return User;
  }

}
