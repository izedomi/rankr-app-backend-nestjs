export type Participants = {
    [participantID: string]: string;
}


export type NominationID = string
  
export type Poll = {
  id: string;
  topic: string;
  votesPerVoter: number;
  participants: Participants;
  adminID: string;
  nominations: Nominations;
  rankings: Rankings;
  results: Results;
  hasStarted: boolean;
}

export type Nominations = {
  [nominationID: NominationID] : Nomination
}

export type Nomination = {
  userID: string,
  name: string
}

export type Rankings = {
  [userID: string]: NominationID[]
}

export type Results = Result[]

export type Result = {
  score: number,
  nominationID: string,
  nominationText: string
}