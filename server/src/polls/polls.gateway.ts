import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { PollsService } from "./polls.service";
import { BadRequestException, Logger, UseFilters, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Namespace, Socket } from "socket.io";
import { SocketWithAuth } from "./types";
import { WsCatchAllFilter } from "src/exceptions/ws-catch-all-filters";
import { cli } from "webpack";
import { GatewayAdminGuard } from "./gateway-admin.guard";
import { createNominatinID } from "src/ids";
import { NominateDto, RemoveNomiationDto, SubmitParticipantRankingDto } from "./dtos";


@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({
    namespace: "polls"
})
export class PollsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(PollsGateway.name)
    @WebSocketServer() io: Namespace;
    constructor(private readonly pollService: PollsService){

    }

    afterInit(server: Socket) {
        this.logger.debug(`gateway connected...`)
    }

    async handleConnection(client: SocketWithAuth) {
        const sockets = this.io.sockets;

        this.logger.log(`Socket connected with client ID: ${client.id}, poll ID: ${client.pollID} and name ${client.name}`)
        this.logger.debug(`Number of connected sockets: ${sockets.size}`)

        const roomName = client.pollID;
        client.join(roomName)

        const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

        this.logger.debug(`user with userID ${client.userID} joined the room: ${roomName}`)
        this.logger.debug(`Total number of clients connected to room ${roomName} : ${connectedClients}`)
        
        
        const updatedPoll = await this.pollService.addParticipant({
            pollID: client.pollID,
            userID: client.userID,
            name: client.name
         })
        
        if(updatedPoll){
           this.io.to(roomName).emit('poll_updated', updatedPoll);
        }

    }

    async handleDisconnect(client: SocketWithAuth) {
        const sockets = this.io.sockets;
        const {pollID, userID} = client;

        this.logger.log(`WS Client with client id: ${client.id} is disconnected`)
        this.logger.debug(`Number of connected sockets: ${sockets.size}`)

        const roomName = client.pollID;
        client.leave(roomName)

        const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

        this.logger.debug(`user with userID ${client.userID} left the room: ${roomName}`)
        this.logger.debug(`Total number of clients connected to room ${roomName} : ${connectedClients}`)
        
        const updatedPoll = await this.pollService.removeParticipant({
            pollID,
            userID
         })
        if(updatedPoll){
            this.io.to(roomName).emit('poll_updated', updatedPoll);
        }

    }


    @SubscribeMessage('test')
    async test(){
        //throw new Error("Something went wrong")
        throw new WsException({msg: "Something went wrong"})
    }

    @UseGuards(GatewayAdminGuard)
    @SubscribeMessage("remove_participant")
    async removeParticipant(
        @MessageBody('id') id: string,
        @ConnectedSocket() client: SocketWithAuth
    ){
        this.logger.debug(`attempting to remove client with id: ${id} from poll: ${client.pollID}`)

        const updatedPoll = await this.pollService.removeParticipant({
            pollID: client.pollID,
            userID: id
        })

        this.logger.debug(`poll after remove participant: ${JSON.stringify(updatedPoll)}`)

        if(updatedPoll){
            this.io.to(client.pollID).emit('poll_updated', updatedPoll);
        }

       // this.io.to(client.pollID).emit('poll_updated', updatedPoll);
    }

    @UsePipes(new ValidationPipe())
    @SubscribeMessage("nominate")
    async addNomination(
        @MessageBody() nominate: NominateDto,
        @ConnectedSocket() client: SocketWithAuth
    ){
        this.logger.debug(`adding nomination: ${nominate.name} to pollID ${client.pollID}`)
        
        const updatedPoll = await this.pollService.addNomination({
            pollID: client.pollID,
            userID: client.userID,
            name: nominate.name 
        })

        this.logger.debug(`poll after add nominations: ${JSON.stringify(updatedPoll)}`)

        if(updatedPoll){
            this.io.to(client.pollID).emit('poll_updated', updatedPoll);
        }

    }

    @UseGuards(GatewayAdminGuard)
    @UsePipes(new ValidationPipe())
    @SubscribeMessage("remove_nomination")
    async removeNomination(
        @MessageBody() removeNominationDto : RemoveNomiationDto,
        @ConnectedSocket() client: SocketWithAuth
    ){
        this.logger.debug(`removing nominationID ${removeNominationDto.nominationID} from pollID ${client.pollID}`)
        
        
        const updatedPoll = await this.pollService.removeNomination({
            pollID: client.pollID,
            nominationID: removeNominationDto.nominationID
        })

        this.logger.debug(`poll after remove nominationID(${removeNominationDto.nominationID}): ${updatedPoll}`)

        if(updatedPoll){
            this.io.to(client.pollID).emit('poll_updated', updatedPoll);
        }

    }

    @UsePipes(new ValidationPipe())
    @SubscribeMessage("submit_ranking")
    async submitRankings(
        @MessageBody() submitParticipantRankingDto : SubmitParticipantRankingDto,
        @ConnectedSocket() client: SocketWithAuth
    ){
        this.logger.debug(`submiting rankings : ${submitParticipantRankingDto.rankings} for poll ${client.pollID}`)

        const poll = this.pollService.getPoll(client.pollID)
        if(!poll){
           throw new BadRequestException("Poll not opened for voting")
        }
        
        const updatedPoll = await this.pollService.submitParticipantRanking({
            pollID: client.pollID,
            userID: client.userID,
            rankings: submitParticipantRankingDto.rankings
        })

        this.logger.debug(`poll after submitting rankings (${submitParticipantRankingDto.rankings}): ${updatedPoll}`)

        if(updatedPoll){
            this.io.to(client.pollID).emit('poll_updated', updatedPoll);
        }

    }

    @UseGuards(GatewayAdminGuard)
    @UsePipes(new ValidationPipe())
    @SubscribeMessage("start_vote")
    async startVote(@ConnectedSocket() client: SocketWithAuth){
        this.logger.debug(`starting vote for poll ${client.pollID}`)
        
        const updatedPoll = await this.pollService.startVote(client.pollID)

        this.logger.debug(`After starting poll: ${updatedPoll}`)

        if(updatedPoll){
            this.io.to(client.pollID).emit('poll_updated', updatedPoll);
            this.io.to(client.pollID).emit('vote_started');
       }

    }


    @UseGuards(GatewayAdminGuard)
    @UsePipes(new ValidationPipe())
    @SubscribeMessage("delete_poll")
    async cancelPoll(@ConnectedSocket() client: SocketWithAuth){
        this.logger.debug(`delete poll ${client.pollID}`)
        
        const updatedPoll = await this.pollService.deletePoll(client.pollID)

        this.logger.debug(`After deleted poll`)

        
        this.io.to(client.pollID).emit('poll_deleted');
        
    }

    @UseGuards(GatewayAdminGuard)
    @UsePipes(new ValidationPipe())
    @SubscribeMessage("compute_result")
    async closePoll(
        @ConnectedSocket() client: SocketWithAuth){
      
        this.logger.debug(`close and comupte result for ${client.pollID}`)
        
        const updatedPoll = await this.pollService.computeResult(client.pollID)

        this.logger.debug(`After closing poll: ${updatedPoll}`)

        if(updatedPoll){
            this.io.to(client.pollID).emit('poll_updated', updatedPoll);
        }


    }

}