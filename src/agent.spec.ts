/* eslint-disable @typescript-eslint/no-explicit-any */

import { provideHandleTransaction } from './agent'
import { HandleTransaction, TransactionEvent } from 'forta-agent'

describe('2pi agent', () => {
  let handleTransaction: HandleTransaction

  const mockReferralCommissionRateAgent = { handleTransaction: jest.fn() }
  const mockTxEvent: TransactionEvent   = { some: 'event' } as any

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      mockReferralCommissionRateAgent
    )
  })

  describe('handleTransaction', () => {
    it('invokes referral commission rate agent and returns their findings', async () => {
      const mockFinding = { some: 'finding' }

      mockReferralCommissionRateAgent.handleTransaction.mockReturnValueOnce(
        [mockFinding]
      )

      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([mockFinding])
      expect(
        mockReferralCommissionRateAgent.handleTransaction
      ).toHaveBeenCalledTimes(1)
      expect(
        mockReferralCommissionRateAgent.handleTransaction
      ).toHaveBeenCalledWith(mockTxEvent)
    })
  })
})
