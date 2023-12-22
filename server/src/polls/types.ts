export type createPollFields = {
    name: string,
    votesPerVoter: number,
    topic: string,
}

export type joinPollFields = {
    pollID : string,
    name: string
}

export type rejoinPollFields = {
    pollID : string,
    userId : string,
    name: string
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



