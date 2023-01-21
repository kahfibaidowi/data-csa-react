import create from 'zustand'
import { set_theme, set_sidebar, set_sidebar_collapsed } from '../config/config'

export const useTheme=create(set=>{
    return {
        theme:"light",
        sidebar:"dark",
        sidebar_collapsed:{
            is_open:false,
            is_folded:false
        },
        setTheme:(theme)=>{
            set((state)=>({theme:theme}))
            set_theme(theme)
        },
        setSidebar:(theme)=>{
            set((state)=>({sidebar:theme}))
            set_sidebar(theme)
        },
        setSidebarCollapsed:(theme)=>{
            set((state)=>({sidebar_collapsed:theme}))
            set_sidebar_collapsed(theme)
        }
    }
})