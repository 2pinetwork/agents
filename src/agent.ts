import { HandleTransaction, TransactionEvent } from 'forta-agent'
import adminEvents from './agents/admin.events'
import flashLoanAgent from './agents/flash.loan'
import referralCommissionRateAgent from './agents/referral.commission.rate'

type Agent = {
  handleTransaction: HandleTransaction
}

export const provideHandleTransaction = (
  adminEvents:                 Agent,
  flashLoanAgent:              Agent,
  referralCommissionRateAgent: Agent
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings = (
      await Promise.all([
        adminEvents.handleTransaction(txEvent),
        flashLoanAgent.handleTransaction(txEvent),
        referralCommissionRateAgent.handleTransaction(txEvent)
      ])
    ).flat()

    return findings
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    adminEvents,
    flashLoanAgent,
    referralCommissionRateAgent
  )
}
