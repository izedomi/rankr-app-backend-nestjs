import { Controller, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common/interfaces";
import { JwtService } from "@nestjs/jwt";
import { PollsService } from "./polls.service";


@Injectable()
export class GatewayAdminGuard implements CanActivate {
    logger = new Logger(GatewayAdminGuard.name);
    constructor(private readonly jwtService: JwtService,
    private readonly pollService: PollsService){}


    async canActivate(context: ExecutionContext): Promise<boolean> {
    

        const socket = context.switchToWs().getClient();

        const token =
        socket.handshake.auth.token || socket.handshake.headers['token'];
  
       // this.logger.debug(`checking for auth token on request body ${request.body}`)
        console.log(`token header ${token}`)
        if(!token){
            throw new ForbiddenException("No token provided")
        }
        
        try{
            console.log(`verifying token: ${token}`)
           
            const {pollID, name, sub} =  this.jwtService.verify(token)
            // socket.pollID = pollID;
            // socket.name = name;
            // socket.userID = userID;
            this.logger.log(`Token Verification: Attempting to get poll: ${pollID}`)
            const poll = await this.pollService.getPoll(pollID);

            if(poll){
               
                if(poll.adminID !== sub){
                     throw new ForbiddenException("Unauthorized request")
                     
                }
                console.log(poll.adminID)
                console.log(sub)
                console.log("90909009")
        
                return true;

            }

            throw new ForbiddenException(`Poll with ID: ${pollID} not found`)


        }
        catch(e){
            this.logger.error(`Error verifying token: ${e}`)
            throw new ForbiddenException("Unauthorized request")
        }

    }

}