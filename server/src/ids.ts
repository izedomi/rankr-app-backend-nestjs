import { customAlphabet, nanoid } from "nanoid";

export const createPollID =   customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    6
)


export const createUserID = () => nanoid()
export const createNominatinID = () => nanoid(8)