import { HandleTransaction, TransactionEvent } from 'forta-agent'
import referralCommissionRateAgent from './agents/referral.commission.rate'

type Agent = {
  handleTransaction: HandleTransaction
}

export const provideHandleTransaction = (
  referralCommissionRateAgent: Agent
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings = (
      await Promise.all([
        referralCommissionRateAgent.handleTransaction(txEvent)
      ])
    ).flat()

    return findings
  }
}

export default {
  handleTransaction: provideHandleTransaction(referralCommissionRateAgent)
}
