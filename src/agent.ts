import { ethers } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import config from './config.json'
import referralCommissionRateAgent from './agents/referral.commission.rate'
import {
  BlockEvent,
  EventType,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  createTransactionEvent
} from 'forta-agent'

type Agent = {
  handleTransaction: HandleTransaction
}

const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl)

let lastCheckedBlock: number
let processing:       number | undefined

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

const handleTransaction = provideHandleTransaction(referralCommissionRateAgent)

const extractReceipt = async (tx: TransactionResponse) => {
  return tx.wait().then(receipt => {
    return receipt
  }).catch(error => {
    return error.receipt
  })
}

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Array<Finding> = []

  if (! processing) {
    try {
      const currentBlock                      = await provider.getBlockNumber()
      const network                           = await provider.getNetwork()
      const txEvents: Array<TransactionEvent> = []

      if (! lastCheckedBlock) {
        lastCheckedBlock = currentBlock - 1
      }

      while (lastCheckedBlock < currentBlock) {
        processing = lastCheckedBlock++

        const blockInfo = await provider.getBlockWithTransactions(lastCheckedBlock)

        for (const tx of blockInfo.transactions) {
          const receipt     = await extractReceipt(tx)
          const transaction = {
            ...tx,
            gas:      receipt.gasUsed.toString(),
            gasPrice: `${tx.gasPrice?.toString()}`,
            r:        `${tx.r}`,
            s:        `${tx.s}`,
            to:       `${tx.to}`,
            v:        `${tx.v}`,
            value:    tx.value.toString()
          }

          const receiptx = {
            ...receipt,
            status:            !! receipt.status,
            root:              `${receipt.root}`,
            gasUsed:           `${receipt.gasUsed?.toString()}`,
            cumulativeGasUsed: `${receipt.cumulativeGasUsed?.toString()}`
          }

          const event = createTransactionEvent({
            type:    EventType.BLOCK,
            network: network.chainId,
            receipt: receiptx,
            block:   blockInfo,
            transaction
          })

          txEvents.push(event)
        }
      }
    } catch (error) {
      if (processing) {
        lastCheckedBlock = processing
      }

      console.error(error)
    } finally {
      processing = undefined
    }
  }

  return findings
}

export default {
  handleBlock
}
