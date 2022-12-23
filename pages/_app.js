import "../styles/light/style.min.css"
import 'react-bootstrap-typeahead/css/Typeahead.css'
import 'react-toastify/dist/ReactToastify.css'
import 'react-data-grid/lib/styles.css'
import 'leaflet/dist/leaflet.css'
import "../styles/globals.css"

import { ToastContainer } from "react-toastify"
import Head from "next/head"
import { QueryClient, QueryClientProvider } from "react-query"

export default function App({Component, pageProps}) {
    return (
        <>
            <Head>
                <title>Data CSA</title>
            </Head>
            <QueryClientProvider client={new QueryClient()}>
                <Component {...pageProps} />
            </QueryClientProvider>
            
            <ToastContainer
                position="top-center"
                autoClose={2000}
                hideProgressBar
                newestOnTop={false}
                closeButton={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover
                theme="colored"
                limit={1}
            />
        </>
    )
}
