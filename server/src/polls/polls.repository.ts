import { BadRequestException, Inject, InternalServerErrorException } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IORedisKey } from 'src/redis.module';
import { AddNominationData, AddParticipantData, AddParticipantRankingData, CreatePollData, RemoveNominationData } from './types';
import {Poll, Results} from 'shared';
import path from 'path';


@Injectable()
export class PollsRepository {
  // to use time-to-live from configuration
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    this.ttl = configService.get('POLL_DURATION');
  }

  async createPoll({
    votesPerVoter,
    topic,
    pollID,
    userID,
  }: CreatePollData): Promise<Poll> {
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      nominations: {},
      rankings: {},
      results: [],
      adminID: userID,
      hasStarted: false
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );

    const key = `polls:${pollID}`;

    try {
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec();
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

 

  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Attempting to get poll with: ${pollID}`);

    const key = `polls:${pollID}`;

    // if(! await this.redisClient.exists(key)){
    //   throw new BadRequestException(`Poll with id ${pollID} does not exist or it has been closed.`)
    // }

      const keys = await this.redisClient.keys(key);
      if(keys.length == 0){
       
        throw new BadRequestException(`Poll with id ${pollID} does not exist or it has been closed.`)
        //return null;
      }

    try {
      const currentPoll = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );
      
      this.logger.verbose(`Current pollx: ${currentPoll}`);
      if(!currentPoll){
        throw new InternalServerErrorException(`Poll with ${pollID} does not exist.`)
      }


      this.logger.verbose(`Current poll: ${currentPoll}`);
  
      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The poll has already started');
      // }
      return JSON.parse(currentPoll);
    } catch (e) {
      this.logger.error(`Failed to get pollID: ${pollID}`);
      throw new InternalServerErrorException(`Unable to get poll with ID: ${pollID}`)

    }
  }

  async addParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
     
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );


      return await this.getPoll(pollID);

      
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
      );
      throw new InternalServerErrorException("Failed to add participant")
    }
  }

  async removeParticipant({
    pollID,
    userID,
  }): Promise<Poll> {
    this.logger.log(
      `Attempting to remove a participant with userID/name: ${userID} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
     
      await this.redisClient.send_command(
        'JSON.DEL',
        key,
        participantPath,
      );


      const poll = await this.getPoll(pollID);
      return poll;

    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userID/name: ${userID} to pollID: ${pollID}`,
      );
      throw new InternalServerErrorException("Failed to remove participant")
    }
  }

  async addNomination({
    pollID,
    nominationID,
    nomination,
  }: AddNominationData): Promise<Poll> {
    this.logger.log(
      `Adding nomination ${nominationID}\\${nomination.name} to poll with id: ${pollID}`
    );

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
     
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );


      return await this.getPoll(pollID);

     
    } catch (e) {
      this.logger.error(
        `Failed to add a nomination with ID/name: ${nominationID}/${nomination.name} to pollID: ${pollID}`,
      );
      throw new InternalServerErrorException("Failed to add nomination")
    }
  }

  async removeNomination({
    pollID,
    nominationID,
  }: RemoveNominationData): Promise<Poll> {
    this.logger.log(
      `removing nomination with id ${nominationID} from poll with id: ${pollID}`
    );

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
     
      await this.redisClient.send_command(
        'JSON.DEL',
        key,
        nominationPath,
      );

      return await this.getPoll(pollID);

    } catch (e) {
      this.logger.error(
        `Failed to remove nomination with ID ${nominationID} to pollID: ${pollID}`,
      );
      throw new InternalServerErrorException("Failed to remove nomination")
    }
  }


  async startVote(pollID: string): Promise<Poll> {
    this.logger.log(`starting poll with ID: ${pollID}`);

    const key = `polls:${pollID}`;
    const startedPath = `.hasStarted`;

    try {
     
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        startedPath,
        JSON.stringify(true)
      );

      return await this.getPoll(pollID);

    } catch (e) {
      this.logger.error(
        `Failed to start poll: ${pollID}`,
      );
      throw new InternalServerErrorException(`Failed to start Poll: ${pollID}`)
    }
  }

  async submitParticipantRanking({
    pollID, userID, rankings
  }: AddParticipantRankingData): Promise<Poll> {
    this.logger.log(`submiting ranking: ${rankings} by user ${userID} for poll: ${pollID}`);

    const key = `polls:${pollID}`;
    const rankingsPath = `.rankings.${userID}`;

    try {
     
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        rankingsPath,
        JSON.stringify(rankings)
      );

      return await this.getPoll(pollID);

    } catch (e) {
      this.logger.error(
        `Failed to start poll: ${pollID}`,
      );
      throw new InternalServerErrorException(`Failed to start Poll: ${pollID}`)
    }
  }

  async computeResult(
    pollID:string, results:Results
  ): Promise<Poll> {

    this.logger.log(`Attempting to close and calculate results for poll: ${pollID}`)

    const key = `polls:${pollID}`;
    const resultPath = `.results`;

    try {
     
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        resultPath,
        JSON.stringify(results)
      );

      return await this.getPoll(pollID);

    } catch (e) {
      this.logger.error(
        `Failed to close poll: ${pollID}`,
      );
      throw new InternalServerErrorException(`Failed to close Poll: ${pollID}`)
    }
  }

  async deletePoll(pollID: string): Promise<any> {
    this.logger.log(`Attempting to cancel poll: ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      await this.redisClient.send_command(
        'JSON.DEL',
        key,
      );

    } catch (e) {
      this.logger.error(
        `Failed to cancel poll: ${pollID}`,
      );
      throw new InternalServerErrorException(`Failed to cancel Poll: ${pollID}`)
    }
  }


}