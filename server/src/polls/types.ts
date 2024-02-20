import { Request } from "@nestjs/common"
import { Nomination, NominationID } from "shared"
import { Socket } from "socket.io"

export type CreatePollFields = {
    name: string,
    votesPerVoter: number,
    topic: string,
}

export type JoinPollFields = {
    pollID : string,
    name: string
}

export type RejoinPollFields = {
    pollID : string,
    userId : string,
    name: string
}

export type AddParticipantFields = {
  pollID: string;
  userID: string;
  name: string;
};

export type AddNominationtFields = {
  pollID: string;
  userID: string;
  name: string;
};

export type AddParticipantRankingFields = {
  pollID: string,
  userID: string,
  rankings: NominationID[]
};

export type RemoveParticipantFields = {
  pollID: string;
  userID: string
}




// repository types
export type CreatePollData = {
    pollID: string;
    topic: string;
    votesPerVoter: number;
    userID: string;
  };
  
  export type AddParticipantData = {
    pollID: string;
    userID: string;
    name: string;
  };

  export type AddNominationData = {
    pollID: string;
    nominationID: string;
    nomination: Nomination;
  };

  export type RemoveNominationData = {
    pollID: string;
    nominationID: string;
  };

  export type AddParticipantRankingData = {
    pollID: string,
    userID: string,
    rankings: NominationID[];
  };


  type AuthPayload = {
    userID: string,
    pollID: string,
    name: string
  }

  export type RequestWithAuth = Request & AuthPayload;
  export type SocketWithAuth = Socket & AuthPayload;



