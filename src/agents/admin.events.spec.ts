/* eslint-disable @typescript-eslint/no-explicit-any */

import agent from './admin.events'
import config from '../config.json'
import {
  createTransactionEvent,
  ethers,
  FindingType,
  FindingSeverity,
  Finding,
} from 'forta-agent'

const network = '80001'

const defaultTypeMap: Record<any, any> = {
  uint256:     0,
  'uint256[]': [0],
  address:     ethers.constants.AddressZero,
  'address[]': [ethers.constants.AddressZero],
  bytes:       '0xff',
  'bytes[]':   ['0xff'],
  bytes32:     '0x0000000000000000000000000000000000000000000000000000000000000001',
  'bytes32[]': ['0x0000000000000000000000000000000000000000000000000000000000000001'],
  string:      'test',
  'string[]':  ['test']
}

const createTxEvent = ({ logs, addresses }: any) => createTransactionEvent({
  network:     network as any,
  transaction: {} as any,
  receipt:     { logs } as any,
  block:       { number: 100 } as any,
  addresses
})

const createEventLogs = (
  eventObject: ethers.utils.EventFragment,
  iface:       ethers.utils.Interface
): any => {
  const args:        Record<any, any> = {}
  const topics:      Array<any>       = []
  const eventTypes:  Array<any>       = []
  const defaultData: Array<any>       = []
  const fragment                      = iface.getEvent(eventObject.name)

  topics.push(iface.getEventTopic(fragment))

  eventObject.inputs.forEach(entry => {
    const value = defaultTypeMap[entry.type]

    // push the values into the correct array, indexed arguments go into topics,
    // otherwise they go into data
    if (entry.indexed) {
      topics.push(value)
    } else {
      eventTypes.push(entry.type)
      defaultData.push(value)
    }

    args[entry.name] = value
  })

  const data = ethers.utils.defaultAbiCoder.encode(eventTypes, defaultData)

  return { args, topics, data }
}

describe('admin event', () => {
  const archimedesAddress = config.addresses[network].archimedes
  const eventIface        = new ethers.utils.Interface([
    'event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)'
  ])

  const eventFragment          = eventIface.getEvent('RoleAdminChanged')
  const { args, topics, data } = createEventLogs(eventFragment, eventIface)

  const logsMatchEvent = [
    {
      address: archimedesAddress,
      args,
      data,
      topics
    }
  ]

  const logsNoMatchEvent = [
    {
      address: archimedesAddress,
      topics:  [
        ethers.constants.HashZero
      ]
    }
  ]

  const logsNoMatchAddress = [
    {
      address: ethers.constants.AddressZero,
      topics: [
        ethers.constants.HashZero
      ]
    }
  ]

  describe('handleTransaction', () => {
    it('returns empty findings if contract address does not match', async () => {
      const txEvent = createTxEvent({
        logs:      logsNoMatchAddress,
        addresses: {
          [ethers.constants.AddressZero]: true
        }
      })

      const findings = await agent.handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it('returns empty findings if contract address matches but not event', async () => {
      const txEvent = createTxEvent({
        logs:      logsNoMatchEvent,
        addresses: {
          [archimedesAddress]: true
        }
      })

      const findings = await agent.handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it('returns a finding if a target contract emits an event from its watchlist', async () => {
      const contractName = 'archimedes'
      const eventName    = 'RoleAdminChanged'
      const txEvent      = createTxEvent({
        logs:      logsMatchEvent,
        addresses: {
          [archimedesAddress]: true
        }
      })

      const findings = await agent.handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name:        '2PI Network admin event',
          description: `${eventName} was emitted by the ${contractName} contract`,
          alertId:     '2PI-ADMIN-EVENT',
          type:        FindingType.Suspicious,
          severity:    FindingSeverity.Low,
          metadata:    {
            address:  archimedesAddress.toLowerCase(),
            contract: contractName,
            hash:     txEvent.transaction.hash,
            event:    eventName
          }
        })
      ])
    })
  })
})
