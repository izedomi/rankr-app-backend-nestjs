import { IsInt, IsNotEmpty, IsString, Length, Max, Min } from "class-validator";

export class CreatePollDto {

    @IsString()
    @Length(1, 100)
    @IsNotEmpty()
  
    topic: string

    @IsInt()
    @Min(1)
    @Max(5)
    votesPerVoter: number

    @IsString()
    @Length(1, 20)
    name: string
}



export class JoinPollDto {

    @IsString()
    @Length(6, 6)
    pollID: string

    @IsString()
    @Length(1, 25)
    name: string
}