import config from '../config.json'
import {
  Finding,
  FindingSeverity,
  FindingType,
  TransactionEvent
} from 'forta-agent'

type Addresses = {
  [key: string]: Record<string, string>
}

type EventRecord = {
  [key: string]: Record<string, Array<string>>
}

const handleTransaction = async (
  txEvent: TransactionEvent
): Promise<Array<Finding>> => {
  const findings: Array<Finding> = []
  const network                  = `${txEvent.network}`
  const addresses: Addresses     = config.addresses
  const contracts                = addresses[network] || []

  Object.entries(contracts).forEach(([contract, address]) => {
    const adminEvents: EventRecord = config.adminEvents
    const events                   = adminEvents[network] || {} as Event

    if (txEvent.addresses[address]) {
      (events[contract] || []).forEach(event => {
        const eventLog  = txEvent.filterLog(event)
        const eventName = event.replace(/event\s+/, '').replace(/\(.*\)/, '')

        if (eventLog.length) {
          findings.push(
            Finding.fromObject({
              name:        '2PI Network admin event',
              description: `${eventName} was emitted by the ${contract} contract`,
              alertId:     '2PI-ADMIN-EVENT',
              type:        FindingType.Suspicious,
              severity:    FindingSeverity.Low,
              metadata:    {
                address: address.toLowerCase(),
                event:   eventName,
                hash:    txEvent.transaction.hash,
                contract
              }
            })
          )
        }
      })
    }
  })

  return findings
}

export default {
  handleTransaction
}
