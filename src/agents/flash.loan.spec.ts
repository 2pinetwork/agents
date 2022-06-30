/* eslint-disable @typescript-eslint/no-explicit-any */

import agent from './flash.loan'
import config from '../config.json'
import {
  createTransactionEvent,
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction
} from 'forta-agent'

describe('flash loan agent', () => {
  let handleTransaction: HandleTransaction

  const network        = '80001'
  const flashLoanEvent = {
    topics: [
      '0x631042c832b07452973831137f2d73e395028b44b250dedc5abb0ee766e168ac'
    ]
  }

  const mockEthersProvider = {} as any

  const mockContract = {
    balance: jest.fn()
  } as any

  const mockContractConstructor = jest.fn().mockReturnValue(mockContract)

  const createTxEvent = ({ addresses, logs, blockNumber }: any) => createTransactionEvent({
    type:            {} as any,
    transaction:     {} as any,
    traces:          {} as any,
    contractAddress: {} as any,
    network:         network as any,
    block:           { number: blockNumber } as any,
    addresses,
    logs
  })

  beforeAll(() => {
    handleTransaction = agent.provideHandleTransaction(
      mockEthersProvider,
      mockContractConstructor
    )
  })

  describe('handleTransaction', () => {
    it('returns empty findings if flash loan attack is done in another address', async () => {
      const protocolAddress        = '0x0000000000000000000000000000000000000000'
      const aaveLendingPoolAddress = config.addresses[network].aaveV2LendingPool.toLowerCase()
      const txEvent                = createTxEvent({
        blockNumber: 100,
        addresses:   {
          [aaveLendingPoolAddress]: true,
          [protocolAddress]:        true
        }
      })

      txEvent.filterLog = jest.fn().mockReturnValue([flashLoanEvent])

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it('returns empty findings if flash loan does not alter the balance above threshold', async () => {
      const protocolAddress        = config.addresses[network].archimedes.toLowerCase()
      const aaveLendingPoolAddress = config.addresses[network].aaveV2LendingPool.toLowerCase()
      const blockNumber            = 1000 // we need different block numbers to properly assert the calls
      const txEvent                = createTxEvent({
        addresses: {
          [aaveLendingPoolAddress]: true,
          [protocolAddress]:        true
        },
        blockNumber
      })

      txEvent.filterLog = jest.fn().mockReturnValue([flashLoanEvent])

      const currentBalance  = Promise.resolve('200000000000000000000')
      const previousBalance = Promise.resolve('200000000000000000001')

      config.balanceDiffThresholds[network].forEach(() => {
        mockContract.balance.mockReturnValueOnce(currentBalance)
        mockContract.balance.mockReturnValueOnce(previousBalance)
      })

      const findings = await handleTransaction(txEvent)

      config.balanceDiffThresholds[network].forEach(thresholdData => {
        expect(mockContract.balance).toHaveBeenCalledWith(thresholdData.pid)
        expect(mockContract.balance).toHaveBeenCalledWith(
          thresholdData.pid,
          { blockTag: blockNumber - 1 }
        )
      })

      expect(findings).toStrictEqual([])
    })

    it('returns a finding if a flash loan attack is detected', async () => {
      const token                  = 'ETH'
      const pid                    = 4
      const addresses              = config.addresses[network]
      const protocolAddress        = addresses.archimedes.toLowerCase()
      const aaveLendingPoolAddress = addresses.aaveV2LendingPool.toLowerCase()
      const blockNumber            = 100 // we need different block numbers to properly assert the calls
      const txEvent                = createTxEvent({
        addresses: {
          [aaveLendingPoolAddress]: true,
          [protocolAddress]:        true
        },
        blockNumber
      })

      txEvent.filterLog = jest.fn().mockReturnValue([flashLoanEvent])

      const currentBalance  = '1'
      const previousBalance = '200000000000000000002'
      const balanceDiff     = '200000000000000000001'

      config.balanceDiffThresholds[network].forEach(thresholdData => {
        const prevBalance = thresholdData.token === token ? previousBalance : currentBalance

        mockContract.balance.mockReturnValueOnce(Promise.resolve(currentBalance))
        mockContract.balance.mockReturnValueOnce(Promise.resolve(prevBalance))
      })

      const findings = await handleTransaction(txEvent)

      config.balanceDiffThresholds[network].forEach(thresholdData => {
        expect(mockContract.balance).toHaveBeenCalledWith(thresholdData.pid)
        expect(mockContract.balance).toHaveBeenCalledWith(
          thresholdData.pid,
          { blockTag: blockNumber - 1 }
        )
      })

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name:        'Flash loan with loss',
          description: `Flash loan with loss of ${balanceDiff} detected for ${protocolAddress} on ${token} pool`,
          alertId:     '2PI-FLASH-LOAN',
          protocol:    'Aave',
          type:        FindingType.Suspicious,
          severity:    FindingSeverity.High,
          metadata:    {
            protocolAddress,
            balanceDiff,
            pid:   `${pid}`,
            loans: JSON.stringify([flashLoanEvent])
          }
        })
      ])
    })
  })
})
