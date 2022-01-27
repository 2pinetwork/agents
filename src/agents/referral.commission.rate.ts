import config from '../config.json'
import archimedesAbi from '../abis/archimedes.json'
import { ethers } from 'ethers'
import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent
} from 'forta-agent'

type Addresses = {
  [key: string]: Record<string, string>
}

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Array<Finding> = []
  const addresses: Addresses     = config.addresses
  const archimedesAddress        = addresses[txEvent.network]?.archimedes

  // All addresses on txEvent are in lower case
  if (archimedesAddress && txEvent.transaction.to === archimedesAddress?.toLowerCase()) {
    const iface         = new ethers.utils.Interface(archimedesAbi)
    const txDescription = iface.parseTransaction(txEvent.transaction)

    if (txDescription.name === 'setReferralCommissionRate') {
      findings.push(
        Finding.fromObject({
          name:        'Referral commission rate changed',
          description: `New rate: ${txDescription.args[0]}`,
          alertId:     '2PI-1',
          severity:    FindingSeverity.Info,
          type:        FindingType.Info
        })
      )
    }
  }

  return findings
}

export default {
  handleTransaction
}
