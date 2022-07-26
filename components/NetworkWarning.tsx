import useEnvChain from 'hooks/useEnvChain'
import React from 'react'
import { useNetwork, useSigner, useSwitchNetwork } from 'wagmi'

const chainId = process.env.NEXT_PUBLIC_CHAIN_ID

function NetworkWarning() {
  const { chain: activeChain } = useNetwork()
  const { data: signer } = useSigner()
  const chain = useEnvChain()
  const { switchNetworkAsync } = useSwitchNetwork({
    chainId: chainId ? +chainId : undefined,
  })

  const chainName = `${chain?.name} ${chain?.testnet ? 'Testnet' : ''}`

  if (chainId && signer && activeChain?.id !== +chainId) {
    return (
      <div className="flex w-screen items-center justify-center gap-2 bg-yellow-200 p-4 text-black">
        <span>You are connected to the wrong network.</span>
        <button
          onClick={() => {
            if (switchNetworkAsync) {
              switchNetworkAsync()
            }
          }}
          className="btn-primary-outline rounded-full border-transparent bg-gray-100 normal-case focus:ring-0 dark:border-neutral-600 dark:bg-neutral-900 dark:ring-primary-900 dark:focus:ring-4"
        >
          Switch to{' '}
          <strong>{+chainId === 1 ? 'Ethereum Mainnet' : chainName}</strong>
        </button>
      </div>
    )
  }
  return null
}

export default NetworkWarning
