export class AppSettings {
  public static logpath = "log";
  public static sessionTimeoutTime = 24 * 60 * 60 * 1000;  //24 hours
  public static loginDuration = 10 * 60 * 60* 1000; //10 hours
  public static cookieTimeoutTime = null; //place date value
  public static IsCookieSecure = true; //Cookie sent over https only 
  public static cookieSignKey = "739b2438)ca37f080!cba48c@9b5fc#d"; // 32bit key that will sign the cookie
  public static pagesize = 10;

  //update message encryption key
  public static messageEncriptionKey = 'thisisamessageencryptionkey';

  public static certificatePath = "Certificates";

  //Postgresql credential
  public static database = "ppws_dev";
  public static usernameDbAdmin = "ppwsadmin";
  public static passwordDbAdmin = "ppws@2019!#";
  public static usernameDbUser = "ppwsuser";
  public static passwordDbUser = "ppws@2019!#";
  public static ppwsLogUserName = "ppwsloguser";
  public static ppwsLogUserPassword = "loguser@2019!#";
  public static host = "172.20.70.80";
  public static dialect = "postgres"; // Database choice : mssql , mysql, sqllite
  public static maxNoOfPool = 30; //Maximum number of connection in pool
  public static minNoOfPool = 0; //Minimum number of connection in pool
  public static acquire = 30000; //The maximum time, in milliseconds, that pool will try to get connection before throwing error
  public static idle = 10000; //The maximum time, in milliseconds, that a connection can be idle before being released.

  //ppws2 > 597277121235-edse4soa019po1jdl59kv3g0bpmh5h7j.apps.googleusercontent.com
  //ppws3 > 509111707779-td02hbq4c0d7g1aevf6ceq8rd6jcjrmm.apps.googleusercontent.com
  public static googleClientId = "509111707779-td02hbq4c0d7g1aevf6ceq8rd6jcjrmm.apps.googleusercontent.com";
}
