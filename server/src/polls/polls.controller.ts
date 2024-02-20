import { Body, Controller, Get, Logger, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { CreatePollDto, JoinPollDto } from "./dtos";
import { PollsService } from "./polls.service";
import { ControllerAuthGuard } from "./controller-auth.guard";
import { RequestWithAuth } from "./types";


@Controller("polls")
@UsePipes(new ValidationPipe())
export class PollsController {
    constructor(private pollService: PollsService){}

    @Post()
    async create(@Body() createPollDto: CreatePollDto){

        Logger.log("Create Poll");
        let result = this.pollService.createPoll(createPollDto);
        return result;
        
    }


    @Post('/join')
    async join(@Body() joinPollDto: JoinPollDto){
        Logger.log("Join Poll");
        let result = await this.pollService.joinPoll(joinPollDto);
        return result;
       

    }

    @UseGuards(ControllerAuthGuard)
    @Post('/rejoin')
    async rejoin(@Req() req: RequestWithAuth){
        Logger.log("Rejoin poll");
        return await this.pollService.rejoinPoll({
            pollID: req.pollID,
            userId: req.userID,
            name: req.name
        });
    }
   
}