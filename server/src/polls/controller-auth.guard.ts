import { Controller, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common/interfaces";
import { JwtService } from "@nestjs/jwt";


@Injectable()
export class ControllerAuthGuard implements CanActivate {
    logger = new Logger(ControllerAuthGuard.name);
    constructor(private readonly jwtService: JwtService){}


    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        context.switchToHttp().getRequest();
        const request = context.switchToHttp().getRequest();
        
        this.logger.debug(`checking for auth token on request body ${request.body}`)

         console.log(request.body.toString());
        const {accessToken} = request.body;
        //console.log(`token: ${JSON.parse(request.body)}`)
        this.logger.error(`access token: ${accessToken}`)
        if(!accessToken){
            throw new ForbiddenException("No token provided")
        }
        
        try{
            const {pollID, name, userID} = this.jwtService.verify(accessToken)
            request.pollID = pollID;
            request.name = name;
            request.userID = userID;
    
            return true;

        }
        catch(e){
            this.logger.error(`Error verifying token: ${e}`)
            throw new ForbiddenException("Invalid token signature")
        }

    }

}