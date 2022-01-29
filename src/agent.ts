import { HandleTransaction, TransactionEvent } from 'forta-agent'
import flashLoanAgent from './agents/flash.loan'
import referralCommissionRateAgent from './agents/referral.commission.rate'

type Agent = {
  handleTransaction: HandleTransaction
}

export const provideHandleTransaction = (
  flashLoanAgent:              Agent,
  referralCommissionRateAgent: Agent
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings = (
      await Promise.all([
        flashLoanAgent.handleTransaction(txEvent),
        referralCommissionRateAgent.handleTransaction(txEvent)
      ])
    ).flat()

    return findings
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    flashLoanAgent,
    referralCommissionRateAgent
  )
}
