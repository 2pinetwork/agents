import { HandleTransaction, TransactionEvent } from 'forta-agent'
import referralCommissionRateAgent from './agents/referralCommissionRate'

type Agent = {
  handleTransaction: HandleTransaction
}

const provideHandleTransaction = (
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
