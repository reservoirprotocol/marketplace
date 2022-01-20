import Layout from 'components/Layout'
import { paths } from 'interfaces/apiTypes'
import fetcher from 'lib/fetcher'
import { optimizeImage } from 'lib/optmizeImage'
import setParams from 'lib/params'
import {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from 'next'
import { useRouter } from 'next/router'
import EthAccount from 'components/EthAccount'
import useSWR from 'swr'
import { FC, useEffect, useState } from 'react'
import { formatBN } from 'lib/numbers'
import { useAccount, useNetwork, useSigner } from 'wagmi'
import ListModal from 'components/ListModal'
import OfferModal from 'components/OfferModal'
import { acceptOffer } from 'lib/acceptOffer'
import { instantBuy } from 'lib/buyToken'
import cancelOrder from 'lib/cancelOrder'

const apiBase = process.env.NEXT_PUBLIC_API_BASE
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_ID
const collectionImage = process.env.NEXT_PUBLIC_COLLECTION_IMAGE

type Props = InferGetStaticPropsType<typeof getStaticProps>

const Index: NextPage<Props> = ({ fallback }) => {
  const [{ data: accountData }] = useAccount()
  const [{ data: signer }] = useSigner()
  const [waitingTx, setWaitingTx] = useState<boolean>(false)
  const [{ data: network }] = useNetwork()
  const router = useRouter()

  let url = new URL('/tokens/details', apiBase)

  let query: paths['/tokens/details']['get']['parameters']['query'] = {
    contract: router.query?.contract?.toString(),
    tokenId: router.query?.tokenId?.toString(),
  }

  setParams(url, query)

  const { data, error, mutate } = useSWR<
    paths['/tokens/details']['get']['responses']['200']['schema']
  >(url.href, fetcher, {
    fallbackData: fallback.token,
  })

  if (error || !apiBase || !chainId) {
    console.debug({ apiBase }, { chainId })
    return <div>There was an error</div>
  }

  const token = data?.tokens?.[0]
  const collection = fallback.collection
  const isOwner =
    token?.token?.owner?.toLowerCase() === accountData?.address.toLowerCase()
  const isTopBidder =
    token?.market?.topBuy?.maker?.toLowerCase() ===
    accountData?.address.toLowerCase()
  const isInTheWrongNetwork = network.chain?.id !== +chainId

  return (
    <Layout
      title={collection.collection?.collection?.name ?? 'HOME'}
      image={collectionImage ?? ''}
    >
      <div className="grid gap-10 grid-cols-2 mt-8 justify-items-center">
        <img
          className="w-[500px]"
          src={optimizeImage(token?.token?.image, {
            sm: 500,
            md: 500,
            lg: 500,
            xl: 500,
            '2xl': 500,
          })}
        />
        <div>
          <div className="text-lg mb-4">{token?.token?.collection?.name}</div>
          <div className="text-xl font-bold mb-3">{token?.token?.name}</div>
          <div className="mb-10">
            {token?.token?.owner && <EthAccount address={token.token.owner} />}
          </div>
          <div className="bg-white rounded-md shadow-md p-5">
            <div className="grid gap-8 grid-cols-2">
              <Price
                title="list price"
                price={formatBN(token?.market?.floorSell?.value, 2)}
              >
                {isOwner ? (
                  <ListModal
                    apiBase={apiBase}
                    chainId={+chainId}
                    signer={signer}
                    maker={accountData?.address}
                    collection={collection}
                    tokens={data}
                    mutate={mutate}
                  />
                ) : (
                  <button
                    disabled={
                      !signer ||
                      token?.market?.floorSell?.value === null ||
                      waitingTx ||
                      isInTheWrongNetwork
                    }
                    onClick={async () => {
                      const tokenId = token?.token?.tokenId

                      if (!tokenId) {
                        console.debug({ tokenId })
                        return
                      }

                      const query: paths['/orders/fill']['get']['parameters']['query'] =
                        {
                          contract: token?.token?.contract,
                          tokenId,
                          side: 'sell',
                        }

                      try {
                        setWaitingTx(true)
                        await instantBuy(apiBase, +chainId, signer, query)
                        await mutate()
                        setWaitingTx(false)
                      } catch (error) {
                        setWaitingTx(false)
                        console.error(error)
                        return
                      }
                    }}
                    className="btn-blue-fill w-full justify-center"
                  >
                    {waitingTx ? 'Waiting...' : 'Buy Now'}
                  </button>
                )}
              </Price>
              <Price
                title="top offer"
                price={formatBN(token?.market?.topBuy?.value, 2)}
              >
                {isOwner ? (
                  <button
                    disabled={
                      waitingTx ||
                      !token?.market?.topBuy?.value ||
                      isInTheWrongNetwork
                    }
                    onClick={async () => {
                      const tokenId = token?.token?.tokenId
                      const contract = token?.token?.contract

                      if (!tokenId || !contract) {
                        console.debug({ tokenId, contract })
                        return
                      }

                      const query: Parameters<typeof acceptOffer>[3] = {
                        tokenId,
                        contract,
                        side: 'buy',
                      }

                      try {
                        setWaitingTx(true)
                        await acceptOffer(apiBase, +chainId, signer, query)
                        await mutate()
                        setWaitingTx(false)
                      } catch (error) {
                        setWaitingTx(false)
                        console.error(error)
                      }
                    }}
                    className="btn-green-fill w-full justify-center"
                  >
                    {waitingTx ? 'Waiting...' : 'Accept Offer'}
                  </button>
                ) : (
                  <OfferModal
                    apiBase={apiBase}
                    chainId={+chainId}
                    signer={signer}
                    maker={accountData?.address}
                    collection={collection}
                    tokens={data}
                    mutate={mutate}
                  />
                )}
              </Price>
            </div>
            {signer && isTopBidder && (
              <button
                disabled={waitingTx || isInTheWrongNetwork}
                onClick={async () => {
                  const tokenId = token?.token?.tokenId
                  if (tokenId) {
                    const query: Parameters<typeof cancelOrder>[3] = {
                      contract: token?.token?.contract,
                      tokenId,
                      side: 'buy',
                    }

                    try {
                      setWaitingTx(true)
                      await cancelOrder(apiBase, +chainId, signer, query)
                      await mutate()
                      setWaitingTx(false)
                    } catch (error) {
                      setWaitingTx(false)
                      console.error(error)
                    }
                  }
                }}
                className="col-span-2 mx-auto btn-red-ghost mt-8"
              >
                {waitingTx ? 'Waiting...' : 'Cancel your offer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Index

const Price: FC<{ title: string; price: string }> = ({
  title,
  price,
  children,
}) => (
  <div className="grid space-y-5">
    <div className="uppercase font-medium opacity-75 text-center">{title}</div>
    <div className="text-3xl font-bold text-center">{price}</div>
    {children}
  </div>
)

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<{
  fallback: {
    token: paths['/tokens/details']['get']['responses']['200']['schema']
    collection: paths['/collections/{collection}']['get']['responses']['200']['schema']
  }
}> = async ({ params }) => {
  try {
    if (!apiBase) {
      throw 'Environment variable NEXT_PUBLIC_API_BASE is undefined.'
    }
    if (!collectionId) {
      throw 'Environment variable NEXT_PUBLIC_COLLECTION_ID is undefined.'
    }

    // -------------- COLLECTION --------------
    let url1 = new URL(`/collections/${collectionId}`, apiBase)

    const res1 = await fetch(url1.href)
    const collection: Props['fallback']['collection'] = await res1.json()

    // -------------- TOKENS --------------
    let url = new URL('/tokens', apiBase)

    let query: paths['/tokens/details']['get']['parameters']['query'] = {
      contract: params?.contract?.toString(),
      tokenId: params?.tokenId?.toString(),
    }

    setParams(url, query)

    const res = await fetch(url.href)
    const token: Props['fallback']['token'] = await res.json()

    return {
      props: {
        fallback: {
          token,
          collection,
        },
      },
    }
  } catch (error) {
    console.error(error)
    return {
      notFound: true,
    }
  }
}