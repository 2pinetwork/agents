/* eslint-disable @typescript-eslint/no-explicit-any */

import { provideHandleTransaction } from './agent'
import { HandleTransaction, TransactionEvent } from 'forta-agent'

describe('2pi agent', () => {
  let handleTransaction: HandleTransaction

  const mockAdminEvents                 = { handleTransaction: jest.fn() }
  const mockReferralCommissionRateAgent = { handleTransaction: jest.fn() }
  const mockFlashLoanAgent              = { handleTransaction: jest.fn() }
  const mockTxEvent: TransactionEvent   = { some: 'event' } as any

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      mockAdminEvents,
      mockFlashLoanAgent,
      mockReferralCommissionRateAgent
    )
  })

  describe('handleTransaction', () => {
    it('invokes referral commission rate agent and returns their findings', async () => {
      const mockFinding = { some: 'finding' }

      mockAdminEvents.handleTransaction.mockReturnValueOnce([mockFinding])
      mockFlashLoanAgent.handleTransaction.mockReturnValueOnce([mockFinding])
      mockReferralCommissionRateAgent.handleTransaction.mockReturnValueOnce(
        [mockFinding]
      )

      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([mockFinding, mockFinding, mockFinding])
      expect(
        mockAdminEvents.handleTransaction
      ).toHaveBeenCalledTimes(1)
      expect(
        mockAdminEvents.handleTransaction
      ).toHaveBeenCalledWith(mockTxEvent)
      expect(
        mockFlashLoanAgent.handleTransaction
      ).toHaveBeenCalledTimes(1)
      expect(
        mockFlashLoanAgent.handleTransaction
      ).toHaveBeenCalledWith(mockTxEvent)
      expect(
        mockReferralCommissionRateAgent.handleTransaction
      ).toHaveBeenCalledTimes(1)
      expect(
        mockReferralCommissionRateAgent.handleTransaction
      ).toHaveBeenCalledWith(mockTxEvent)
    })
  })
})
