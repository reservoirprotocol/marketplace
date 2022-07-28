import 'styles/globals.css'
import 'styles/inter.css'
import 'styles/druk.css'
import 'styles/montserrat.css'
import 'styles/open-sans.css'
import 'styles/playfair-display.css'
import 'styles/roboto.css'
import 'styles/chalkboard.css'
import 'styles/frankruhllibre.css'
import 'styles/gazpacho.css'
import 'styles/editorialnew.css'
import 'styles/lucidagrande.css'
import 'styles/nunitosans.css'
import 'styles/styreneb.css'
import 'styles/gothicusroman.css'
import 'styles/roobert.css'
import 'styles/rodger.css'
import type { AppProps } from 'next/app'
import { WagmiConfig, createClient, allChains, configureChains } from 'wagmi'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { GlobalProvider } from 'context/GlobalState'
import AnalyticsProvider from 'components/AnalyticsProvider'
import { ThemeProvider } from 'next-themes'
import { RecoilRoot } from 'recoil'
import {
  darkTheme,
  lightTheme,
  ReservoirKitProvider,
  ReservoirKitTheme,
} from '@reservoir0x/reservoir-kit-ui'
import { useEffect, useState } from 'react'

// Select a custom ether.js interface for connecting to a network
// Reference = https://wagmi-xyz.vercel.app/docs/provider#provider-optional
// OPTIONAL
const infuraId = process.env.NEXT_PUBLIC_INFURA_ID

// API key for Ethereum node
// Two popular services are Alchemy (alchemy.com) and Infura (infura.io)
const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID

const THEME_SWITCHING_ENABLED = process.env.NEXT_PUBLIC_THEME_SWITCHING_ENABLED
const DARK_MODE_ENABLED = process.env.NEXT_PUBLIC_DARK_MODE
const PROXY_API_BASE = process.env.NEXT_PUBLIC_PROXY_API_BASE
const BODY_FONT_FAMILY = process.env.NEXT_PUBLIC_BODY_FONT_FAMILY || 'Inter'
const FONT_FAMILY = process.env.NEXT_PUBLIC_FONT_FAMILY || 'Inter'
const PRIMARY_COLOR = process.env.NEXT_PUBLIC_PRIMARY_COLOR || 'default'
const DISABLE_POWERED_BY_RESERVOIR =
  process.env.NEXT_PUBLIC_DISABLE_POWERED_BY_RESERVOIR
import presetColors from '../colors'

// Set up chains
const { chains, provider } = configureChains(allChains, [
  alchemyProvider({ alchemyId }),
  publicProvider(),
])

// Set up connectors
const client = createClient({
  autoConnect: true,
  provider,
  connectors: [
    new InjectedConnector({
      chains,
      options: { name: 'Injected' },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'reservoir.market',
      },
    }),
  ],
})

function MyApp({ Component, pageProps }: AppProps) {
  const defaultTheme = DARK_MODE_ENABLED ? 'dark' : 'light'
  const [reservoirKitTheme, setReservoirKitTheme] = useState<
    ReservoirKitTheme | undefined
  >()

  useEffect(() => {
    const primaryColor = (PRIMARY_COLOR as string) || 'default'
    const primaryColorPalette = (
      presetColors as Record<string, Record<string, string>>
    )[primaryColor]
    if (defaultTheme == 'dark') {
      setReservoirKitTheme(
        darkTheme({
          headlineFont: FONT_FAMILY,
          font: BODY_FONT_FAMILY,
          primaryColor: primaryColorPalette['700'],
          primaryHoverColor: primaryColorPalette['900'],
        })
      )
    } else {
      setReservoirKitTheme(
        lightTheme({
          headlineFont: FONT_FAMILY,
          font: BODY_FONT_FAMILY,
          primaryColor: primaryColorPalette['700'],
          primaryHoverColor: primaryColorPalette['900'],
        })
      )
    }
    console.log(PROXY_API_BASE)
  }, [defaultTheme])

  return (
    <ReservoirKitProvider
      options={{
        apiBase:
          typeof window !== 'undefined'
            ? `${window.location.origin}${PROXY_API_BASE}`
            : '',
        disablePoweredByReservoir:
          DISABLE_POWERED_BY_RESERVOIR != undefined &&
          DISABLE_POWERED_BY_RESERVOIR != null,
      }}
      theme={reservoirKitTheme}
    >
      <GlobalProvider>
        <RecoilRoot>
          <WagmiConfig client={client}>
            <AnalyticsProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme={defaultTheme}
                forcedTheme={
                  !THEME_SWITCHING_ENABLED ? defaultTheme : undefined
                }
              >
                <Component {...pageProps} />
              </ThemeProvider>
            </AnalyticsProvider>
          </WagmiConfig>
        </RecoilRoot>
      </GlobalProvider>
    </ReservoirKitProvider>
  )
}

export default MyApp
