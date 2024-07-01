import { getBalance } from "./cmdGetBalance";
import { sendBalance } from "./cmdSendBalance";
import { depositBalance } from "./cmdDeposit";

export const cmd = {
    balance: {
        getBalance,
        sendBalance,
        depositBalance
    }
}
