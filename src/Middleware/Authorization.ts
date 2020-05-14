import { changeSequelize, SequelizeLists } from "../Repository/Sequelize";
import { AuthService } from "../Service/AuthService";
import { LogService } from "../Service/LogService";
import { UserService } from "../Service/UserService";
import { UserLoginInfoService } from "../Service/UserLoginInfoService";

//Authorization middleware
export async function isAuthorized(req, res, next) {
    try {
        let user = res.locals.user;

        changeSequelize(SequelizeLists.SequelizeAdmin);

        let userFromDb: any = await new UserService().getContext()
            .find({
                attributes: ['masterpassword', 'email', 'isadminyesno'],
                where: { userid: user.UserId, datedeleted: null }
            });

        if (!user.isAdmin && !userFromDb.isadminyesno) {
            throw ({ message: "Unauthorized", description: `UnAuthorized userid: ${res.locals.user.UserId}` });
        }

        const authService = new AuthService();
        if (userFromDb.masterpassword && !authService.verifyAdmin(user, userFromDb)) {
            throw ({ message: "Unauthorized", description: `UnAuthorized userid: ${res.locals.user.UserId}` });
        }

        res.locals.user = user;
        return next();
    } catch (error) {
        res.clearCookie("Authkey");
        new LogService().fileLog("Authorization Checks", error.description, error.stack);
        res.status(401).send({ message: `UnAuthorized` });
    }
}