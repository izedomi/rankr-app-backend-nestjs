import { Injectable } from "@nestjs/common";
import { createPollFields, joinPollFields, rejoinPollFields} from "./types";
import { CreatePollDto } from "./dtos";
import { createPollID, createUserID } from "src/ids";
import { nanoid } from "nanoid";
import { PollsRepository } from "./polls.repository";


@Injectable()
export class PollsService {

    constructor(private readonly pollRepository: PollsRepository){}

    async createPoll(field: createPollFields){

        const userID = createUserID();
        const pollID = createPollID();


        const poll = await this.pollRepository.createPoll({
            ...field,
            userID,
            pollID
        });

        return poll;
       
    }

    async joinPoll(field: joinPollFields){
        const userID = createUserID()

        const poll = await this.pollRepository.getPoll(field.pollID);

        return {
            poll: poll
        }

    }

    rejoinPoll(field: rejoinPollFields){
        return field;
    }
}