import App from 'next/app'
import React from 'react'
import { NextGithubMediaStore } from 'next-tinacms-github'
import { TinaCMS, TinaProvider, ModalProvider } from 'tinacms'
import { GlobalStyles, FontLoader } from '@tinacms/styles'
import {
  GithubClient,
  TinacmsGithubProvider,
  GithubMediaStore,
} from 'react-tinacms-github'


const github = new GithubClient({
  proxy: '/api/proxy-github',
  authCallbackRoute: '/api/create-github-access-token',
  clientId: process.env.GITHUB_CLIENT_ID, //process.env.GITHUB_CLIENT_ID,
  baseRepoFullName: process.env.REPO_FULL_NAME, //process.env.REPO_FULL_NAME, // e.g: tinacms/tinacms.org,
  baseBranch: process.env.BASE_BRANCH, // e.g. 'master' or 'main' on newer repos
  //authScope: 'repo' // normally defaults to 'public_repo'
})

const MainLayout = ({ Component, pageProps }) => {
  const tinaConfig = {
    enabled: pageProps.preview,
    toolbar: pageProps.preview,
    sidebar: pageProps.preview,
    apis: {
      github
    },
    media: new NextGithubMediaStore(github),
  }
  const cms = React.useMemo(() => new TinaCMS(tinaConfig), [])

  const enterEditMode = async () => {
    const token = localStorage.getItem('tinacms-github-token') || null
    const headers = new Headers()

    if (token) {
      headers.append('Authorization', 'Bearer ' + token)
    }

    const response = await fetch(`/api/preview`, { headers })
    const data = await response.json()

    if (response.status === 200) {
      window.location.reload()
    } else {
      throw new Error(data.message)
    }
  }

  const exitEditMode = () => {
    fetch(`/api/reset-preview`).then(() => {
      window.location.reload()
    })
  }
  const loadFonts = useShouldLoadFont(cms)
  return (
    <TinaProvider cms={cms} styled={false}>
      <GlobalStyles />
      {loadFonts && <FontLoader />}
      <ModalProvider>
        <TinacmsGithubProvider
          onLogin={enterEditMode}
          onLogout={exitEditMode}
          error={pageProps.error}
        >
          <EditLink cms={cms} />
          <Component {...pageProps} />
        </TinacmsGithubProvider>
      </ModalProvider>
    </TinaProvider>
  )
}

function useShouldLoadFont(cms: TinaCMS) {
  const [enabled, setEnabled] = React.useState(cms.enabled)

  React.useEffect(() => {
    if (cms.enabled) return
    return cms.events.subscribe('cms:enable', () => {
      setEnabled(true)
    })
  }, [])

  return enabled
}

class Site extends App {
  componentDidMount() {
    if (process.env.NODE_ENV === 'production') {
    }
  }

  render() {
    const { Component, pageProps } = this.props
    return <MainLayout Component={Component} pageProps={pageProps} />
  }
}

export interface EditLinkProps {
  cms: TinaCMS
}

export const EditLink = ({ cms }: EditLinkProps) => {
  return (
    <button onClick={() => cms.toggle()}>
      {cms.enabled ? 'Exit Edit Mode' : 'Edit This Site'}
    </button>
  )
}

export default Site