import * as sequelize from "sequelize";
import { AppSettings } from "../AppSettings";

//#region LoguserConnection
const SequelizeLogUser = new sequelize(
  AppSettings.database,
  AppSettings.ppwsLogUserName,
  AppSettings.ppwsLogUserPassword,
  {
    host: AppSettings.host,
    dialect: AppSettings.dialect,
    operatorsAliases: false,
    logging:false,
    pool: {
      max: AppSettings.maxNoOfPool,
      min: AppSettings.minNoOfPool,
      acquire: AppSettings.acquire,
      idle: AppSettings.idle
    },
    dialectOptions: {
      useUTC: false //for reading from database
    },
    timezone: "Europe/Amsterdam"
   
  }
)
//#endregion LoguserConnection

//#region AdminuserConnection
const SequelizeAdmin = new sequelize(
  AppSettings.database,
  AppSettings.usernameDbAdmin,
  AppSettings.passwordDbAdmin,
  {
    host: AppSettings.host,
    dialect: AppSettings.dialect,
    operatorsAliases: false,
    logging:false,
    pool: {
      max: AppSettings.maxNoOfPool,
      min: AppSettings.minNoOfPool,
      acquire: AppSettings.acquire,
      idle: AppSettings.idle
    },
    dialectOptions: {
      useUTC: false //for reading from database
    },
    // timezone: "Asia/Kathmandu" //for writing to database
    timezone: "Europe/Amsterdam"
  }
);
//#endregion AdminuserConnection

//#region NormaluserConnection
const SequelizeUser = new sequelize(
  AppSettings.database,
  AppSettings.usernameDbUser,
  AppSettings.passwordDbUser,
  {
    host: AppSettings.host,
    dialect: AppSettings.dialect,
    operatorsAliases: false,
    logging:false,
    pool: {
      max: AppSettings.maxNoOfPool,
      min: AppSettings.minNoOfPool,
      acquire: AppSettings.acquire,
      idle: AppSettings.idle
    },
    dialectOptions: {
      useUTC: false //for reading from database
    },
    // timezone: "Asia/Kathmandu" //for writing to database
    timezone: "Europe/Amsterdam"
  }
);
//#endregion NormaluserConnection


//Sequelize Connections
export const SequelizeLists = {
  SequelizeAdmin: SequelizeAdmin,
  SequelizeUser: SequelizeUser,
  SequelizeLogUser: SequelizeLogUser
};

export function changeSequelize(sequelize: any) {
  Sequelize = sequelize;
}

export let Sequelize: any = {};

//Testing the connection
SequelizeAdmin.authenticate()
  .then(() => {
    console.log("Connection has been established successfully for admin.");
  })
  .catch(err => {
    console.log("Unable to connect to the database:", err);
  });

SequelizeUser.authenticate()
  .then(() => {
    console.log("Connection has been established successfully for user.");
  })
  .catch(err => {
    console.log("Unable to connect to the database:", err);
  });

SequelizeLogUser.authenticate()
  .then(() => {
    console.log("Connection has been established successfully for loguser.");
  })
  .catch(err => {
    console.log("Unable to connect to the database:", err);
  });
