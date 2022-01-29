import BigNumber from 'bignumber.js'
import archimedesAbi from '../abis/archimedes.json'
import config from '../config.json'
import {
  ethers,
  getEthersProvider,
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  LogDescription,
  TransactionEvent
} from 'forta-agent'

type Addresses = {
  [key: string]: Record<string, string>
}

type ContractConstructor = (
  address:  string,
  abi:      ethers.ContractInterface,
  provider: ethers.providers.JsonRpcProvider
) => ethers.Contract

type Threshold = {
  [key: string]: Array<{
    pid:       number
    token:     string
    threshold: string
  }>
}

const contractConstructor: ContractConstructor = (
  address:  string,
  abi:      ethers.ContractInterface,
  provider: ethers.providers.JsonRpcProvider
) => {
  return new ethers.Contract(address, abi, provider)
}

const ethersProvider = getEthersProvider()

const checkBalances = async (
  contractConstructor: ContractConstructor,
  txEvent:             TransactionEvent,
  flashLoanEvents:     Array<LogDescription>,
  archimedesAddress:   string
): Promise<Array<Finding>> => {
  const findings: Array<Finding> = []
  const blockNumber              = txEvent.blockNumber
  const thresholds: Threshold    = config.balanceDiffThresholds
  const archimedes               = contractConstructor(
    archimedesAddress,
    archimedesAbi,
    ethersProvider
  )

  for (const thresholdData of thresholds[txEvent.network] || []) {
    const currentBalanceBN  = await archimedes.balance(thresholdData.pid)
    const previousBalanceBN = await archimedes.balance(thresholdData.pid, { blockTag: blockNumber - 1 })
    const currentBalance    = new BigNumber(currentBalanceBN.toString())
    const previousBalance   = new BigNumber(previousBalanceBN.toString())
    const balanceDiff       = previousBalance.minus(currentBalance)

    // if balance of affected contract address has not changed by threshold
    if (balanceDiff.isGreaterThan(thresholdData.threshold)) {
      const diff  = balanceDiff.toString()
      const token = thresholdData.token

      findings.push(
        Finding.fromObject({
          name:        'Flash loan with loss',
          description: `Flash loan with loss of ${diff} detected for ${archimedesAddress} on ${token} pool`,
          alertId:     '2PI-FLASH-LOAN',
          protocol:    'Aave',
          type:        FindingType.Suspicious,
          severity:    FindingSeverity.High,
          metadata:    {
            protocolAddress: archimedesAddress,
            balanceDiff:     diff,
            pid:             `${thresholdData.pid}`,
            loans:           JSON.stringify(flashLoanEvents)
          }
        })
      )
    }
  }

  return findings
}

const provideHandleTransaction = (
  ethersProvider:      ethers.providers.JsonRpcProvider,
  contractConstructor: ContractConstructor
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Array<Finding> = []
    const addresses: Addresses     = config.addresses
    const archimedesAddress        = addresses[txEvent.network]?.archimedes?.toLowerCase()
    const aaveV2Address            = addresses[txEvent.network]?.aaveV2LendingPool?.toLowerCase()

    if (! txEvent.addresses[aaveV2Address]) return findings

    const flashLoanEvents = txEvent.filterLog(config.events.flashLoan)

    if (! flashLoanEvents.length) return findings

    if (! txEvent.addresses[archimedesAddress]) return findings

    return await checkBalances(
      contractConstructor,
      txEvent,
      flashLoanEvents,
      archimedesAddress
    )
  }
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(
    ethersProvider,
    contractConstructor
  )
}
