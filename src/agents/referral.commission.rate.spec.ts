/* eslint-disable @typescript-eslint/no-explicit-any */

import agent from './referral.commission.rate'
import config from '../config.json'
import archimedesAbi from '../abis/archimedes.json'
import {
  createTransactionEvent,
  ethers,
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction
} from 'forta-agent'

describe('referral commission rate', () => {
  let handleTransaction: HandleTransaction

  const network = '80001'
  const iface   = new ethers.utils.Interface(archimedesAbi)

  const createTxEventWithReferralCommissionRate = (rate: number) => createTransactionEvent({
    type:            {} as any,
    traces:          {} as any,
    contractAddress: {} as any,
    block:           {} as any,
    addresses:       {} as any,
    logs:            {} as any,
    network:         network as any,
    transaction: {
      to:   config.addresses[network].archimedes.toLowerCase(),
      data: iface.encodeFunctionData('setReferralCommissionRate', [rate])
    } as any
  })

  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })

  describe('handleTransaction', () => {
    it('returns empty findings if other function is invoked', async () => {
      const txEvent  = createTransactionEvent({
        type:            {} as any,
        transaction:     {} as any,
        traces:          {} as any,
        contractAddress: {} as any,
        block:           {} as any,
        addresses:       {} as any,
        logs:            {} as any
      })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it('returns a finding if setReferralCommissionRate was invoked', async () => {
      const rate     = 20
      const txEvent  = createTxEventWithReferralCommissionRate(rate)
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name:        'Referral commission rate changed',
          description: `New rate: ${rate}`,
          alertId:     '2PI-REFERRAL-COMMISSION-RATE',
          type:        FindingType.Info,
          severity:    FindingSeverity.Info
        })
      ])
    })
  })
})
