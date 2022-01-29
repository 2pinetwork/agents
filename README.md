# 2PI Network protocol agent

## Description

This agent detects suspicious transactions to the 2PI network protocol contracts.

## Supported Chains

- Polygon

## Alerts

This alerts can be fired by the agent

- 2PI-REFERRAL-COMMISSION-RATE
  - Fired when the referrals reward fee is changed
  - Severity is always set to "info"
  - Type is always set to "info"
- 2PI-FLASH-LOAN
  - Fired when a transaction has a flash loan involving a loss for an interested protocol
  - Severity is always set to "high"
  - Type is always set to "suspicious"
  - Metadata fields
      - "protocolAddress": the address of the affected protocol
      - "balanceDiff": the resulting loss in wei
      - "pid": the targeted pool ID
      - "loans": list of flash loan events in the transaction

## Test Data

The agent behavior can be verified with the following transactions:

- 2PI-REFERRAL-COMMISSION-RATE
  - 0xdc83ed95a1f8897f0f54d5d41a16dcc0efa09378f6f38fb8eaf2fdab8f31fb26 (set to 20 on Mumbai)
- 2PI-FLASH-LOAN
  - To be done on chain
