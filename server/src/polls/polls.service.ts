import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { AddNominationtFields, AddParticipantFields, AddParticipantRankingFields, CreatePollFields, JoinPollFields, RejoinPollFields, RemoveNominationData, RemoveParticipantFields} from "./types";
import { createNominatinID, createPollID, createUserID } from "src/ids";
import { PollsRepository } from "./polls.repository";
import { JwtService } from "@nestjs/jwt";
import { Poll } from "shared/poll-types";
import getResults from "./getResults";


@Injectable()
export class PollsService {

    constructor(private readonly pollRepository: PollsRepository,
        private readonly jwtService: JwtService){}
    logger = new Logger(PollsService.name)

    async createPoll(field: CreatePollFields){

        const userID = createUserID();
        const pollID = createPollID();


        const poll = await this.pollRepository.createPoll({
            ...field,
            userID,
            pollID
        });

        this.logger.debug(`creating accessing token for pollID: ${poll.id} and  user ${userID}`)

        const signedString = this.jwtService.sign({
            pollID: poll.id,
            name: field.name
        },
        {
            subject: userID
        })

        return {poll, accessToken: signedString};
       
    }

   

    async joinPoll(field: JoinPollFields){
        this.logger.debug(`joining poll`)

        const userID = createUserID()


        this.logger.debug(`fetching poll to join ${field.pollID}`)

        // const poll = await this.pollRepository.getPoll(field.pollID);

        const poll = await this.getPoll(field.pollID);

        if(!poll){
            throw new BadRequestException(`Poll with ${field.pollID} does not exist`);
        }

        this.logger.debug(`creating accessing token for pollID: ${poll.id} and  user ${userID}`)

        const signedString = this.jwtService.sign({
            pollID: poll.id,
            name: field.name
        },
        {
            subject: userID
        })

        return {
            poll,
            accessToken: signedString
        }

    }

    async getPoll(pollID: string){
        const poll =  this.pollRepository.getPoll(pollID);


        if(!poll){
            throw new BadRequestException(`Poll with ${pollID} does not exist`);
        }
        return poll;

    }

    async rejoinPoll(field: RejoinPollFields){
        
        this.logger.debug(`Fetching poll with ${field.pollID} to rejoin`)
        const poll = await this.pollRepository.getPoll(field.pollID);


        if(!poll){
            throw new BadRequestException();
        }

        return poll;

    }

    async addParticipant(field: AddParticipantFields): Promise<Poll> {

        const poll =await this.getPoll(field.pollID);
        if(!poll){
            throw new BadRequestException(`Poll with ID ${field.pollID} not found`)
        }
        return await this.pollRepository.addParticipant(field);
    }

    async removeParticipant(field: RemoveParticipantFields): Promise<Poll>{


        const poll =  await this.getPoll(field.pollID);

        if(!poll){
            throw new BadRequestException(`Poll with ID ${field.pollID} not found`)
        }
       

        // if(poll.hasStarted){
        //     throw new BadRequestException('Poll already started')
        // }

        const updatedPoll = await this.pollRepository.removeParticipant(field);
        return updatedPoll
    }

    async addNomination({pollID, userID, name}: AddNominationtFields): Promise<Poll> {

        return await this.pollRepository.addNomination({
            pollID,
            nominationID: createNominatinID(),
            nomination: {
                userID,
                name: name
            }
        });
    }

    async removeNomination(field: RemoveNominationData): Promise<Poll> {

        return await this.pollRepository.removeNomination(field);
    }


    async submitParticipantRanking(rankingData: AddParticipantRankingFields): Promise<Poll> {

        return await this.pollRepository.submitParticipantRanking(rankingData);
    }

    async startVote(pollID: string): Promise<Poll> {
        return await this.pollRepository.startVote(pollID);
    }

    async deletePoll(pollID: string): Promise<Poll> {
        return await this.pollRepository.deletePoll(pollID);
    }

    async computeResult(pollID: string): Promise<Poll> {

        const poll = await this.getPoll(pollID)
        if(!poll){
            throw new BadRequestException(`Poll with id ${pollID} not found`)
        }

        // if(!poll.hasStarted){
        //     throw new BadRequestException( `Poll with id ${pollID} already closed`)
        // }
    
        const results =  getResults(poll.rankings, poll.nominations, poll.votesPerVoter)

        return await this.pollRepository.computeResult(pollID, results);
    }


}