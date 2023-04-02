import '../styles/light/style.min.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import 'react-toastify/dist/ReactToastify.css'
import 'react-data-grid/lib/styles.css'
// import 'mapbox-gl/dist/mapbox-gl.css'
import 'leaflet/dist/leaflet.css'
import 'react-quill/dist/quill.snow.css'
import "../styles/globals.css"

import { ToastContainer } from "react-toastify"
import Head from "next/head"
import { QueryClient, QueryClientProvider } from "react-query"
import { useTheme } from '../store/theme'
import { useEffect } from 'react'
import { get_sidebar, get_sidebar_collapsed, get_theme } from '../config/config'

export default function App({Component, pageProps}) {
    const theme_store=useTheme()
    
    useEffect(()=>{
        let theme=get_theme()
        let sidebar=get_sidebar()
        let sidebar_collapsed=get_sidebar_collapsed()
        theme_store.setTheme(theme)
        theme_store.setSidebar(sidebar)
        theme_store.setSidebarCollapsed(sidebar_collapsed)
    }, [])

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
