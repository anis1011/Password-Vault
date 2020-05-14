import { Cookie } from "../Lib/Common/Cookie";
import { changeSequelize, SequelizeLists } from "../Repository/Sequelize";
import { LogService } from "../Service/LogService";
import { UserLoginInfoService } from "../Service/UserLoginInfoService";

//Authentication middleware
export async function IsAuthenticate(req, res, next) {
    try {

        changeSequelize(SequelizeLists.SequelizeUser);

        const cookies = Cookie.get(req, res, "Authkey", { signed: true });
        if (!cookies) {
            changeSequelize(SequelizeLists.SequelizeLogUser);
            throw ({ message: "Unauthenticated" ,description:"Unknown api call"});
        }

        const authkey: {} = JSON.parse(cookies);

        let schedulerequest = false;
        if (req.path == "/api/countmessage" && req.method == "GET") {
            schedulerequest = true;
        }

        const user: any = await new UserLoginInfoService().checkSession(authkey, schedulerequest);

        res.locals.user = user;
        return next();
    } catch (error) {
        res.clearCookie("Authkey");
        new LogService().fileLog("Session Checks", error.description, error.stack);
        res.status(401).send({ message: error.message });
    }
}