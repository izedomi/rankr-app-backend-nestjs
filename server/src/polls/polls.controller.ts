import { Body, Controller, Logger, Post } from "@nestjs/common";
import { CreatePollDto, JoinPollDto } from "./dtos";
import { PollsService } from "./polls.service";

@Controller("polls")
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
        let result = this.pollService.joinPoll(joinPollDto);
        return result;
       

    }

    @Post('/rejoin')
    async rejoin(){
        Logger.log("Rejoin poll");
    }
    
}