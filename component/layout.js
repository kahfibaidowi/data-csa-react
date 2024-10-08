import classNames from "classnames"
import Link from "next/link"
import Router, { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { Collapse, Dropdown } from "react-bootstrap"
import {FiArchive, FiBook, FiBookmark, FiChevronDown, FiCloudRain, FiColumns, FiEdit, FiEye, FiHelpCircle, FiHexagon, FiHome, FiLayers, FiLogOut, FiMail, FiMapPin, FiMeh, FiMenu, FiSettings, FiTruck, FiUser} from "react-icons/fi"
import {api} from "../config/api"
import { BASE_PATH, FRONTPAGE_URL, access_token, login_data as user_data } from "../config/config"
import Avatar from "./ui/avatar"
import { useTheme } from "../store/theme"

const Layout=(props)=>{
    const [login_data, setLoginData]=useState({})
    const [collapse, setCollapse]=useState("")
    const [show_setting, setShowSetting]=useState(false)
    const [sidebar_mobile_toggler, setSidebarMobileToggler]=useState(false)
    const [active_page, setActivePage]=useState("")
    const router=useRouter()
    const theme_store=useTheme()

    useEffect(()=>{
        setLoginData(user_data()!=null?user_data():{})
        setActivePage(router.pathname)

        //collapse
        if(["/admin/region/provinsi", "/admin/region/kabupaten_kota", "/admin/region/kecamatan"].includes(router.pathname)){
            setCollapse("region")
        }
        if(["/admin/ews/bawang_merah", "/admin/ews/cabai_besar", "/admin/ews/cabai_rawit"].includes(router.pathname)){
            setCollapse("ews")
        }
        if(['/admin/frontpage/widget/headline', '/admin/frontpage/widget/feature_column', '/admin/frontpage/widget/feature_row'].includes(router.pathname)){
            setCollapse("frontpage_widget")
        }
        if(['/admin/frontpage/post', '/admin/frontpage/post/add', '/admin/frontpage/post/edit'].includes(router.pathname)){
            setCollapse("frontpage_post")
        }
        if(['/admin/frontpage/footer/about', '/admin/frontpage/footer/menu', '/admin/frontpage/footer/partner'].includes(router.pathname)){
            setCollapse("frontpage_footer")
        }
        if(["/admin/curah_hujan", "/admin/curah_hujan/curah_hujan", "/admin/curah_hujan/curah_hujan_normal", "/admin/curah_hujan/curah_hujan_activity"].includes(router.pathname)){
            setCollapse("curah_hujan")
        }
    }, [])

    //sidebar toggler
    const toggleSidebar=()=>{
        if(theme_store.sidebar_collapsed.is_open){
            theme_store.setSidebarCollapsed({
                is_open:false,
                is_folded:false
            })
            setSidebarMobileToggler(!sidebar_mobile_toggler)
        }
        else{
            if(!sidebar_mobile_toggler){
                theme_store.setSidebarCollapsed({
                    is_open:true,
                    is_folded:false
                })
            }
            setSidebarMobileToggler(!sidebar_mobile_toggler)
        }
    }
    const toggleSidebarFolded=value=>{
        if(theme_store.sidebar_collapsed.is_open){
            theme_store.setSidebarCollapsed({
                is_open:true,
                is_folded:value
            })
        }
    }

    //logout
    const logout=()=>{
        api(access_token()).delete("/auth/logout")
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                window.location=FRONTPAGE_URL
            }
        })
    }
    

    return (
        <div 
            className={classNames(
                "main-wrapper", 
                {"sidebar-dark":theme_store.sidebar=="dark"},
                {"sidebar-folded":theme_store.sidebar_collapsed.is_open}, 
                {"open-sidebar-folded overflow-hidden":theme_store.sidebar_collapsed.is_folded},
                {"sidebar-open":sidebar_mobile_toggler}
            )}
        >
            <nav className="sidebar">
                <div className="sidebar-header">
                    <a href="#" className="sidebar-brand">
                        Admin <span>EWS</span>
                    </a>
                    <div 
                        className={classNames(
                            "sidebar-toggler", 
                            {"active":theme_store.sidebar_collapsed.is_open||sidebar_mobile_toggler}, 
                            {"not-active":!theme_store.sidebar_collapsed.is_open&&!sidebar_mobile_toggler}
                        )} 
                        onClick={e=>toggleSidebar()}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div className="sidebar-body ps" onMouseOver={e=>toggleSidebarFolded(true)} onMouseOut={e=>toggleSidebarFolded(false)}>
                    <ul className="nav">
                        <li className="nav-item nav-category">Main</li>
                        <li 
                            className={classNames(
                                "nav-item", 
                                {"active":active_page=="/admin"}
                            )}
                        >
                            <Link href="/admin" className="nav-link">
                                <FiHome className="link-icon"/>
                                <span className="link-title">Dashboard</span>
                            </Link>
                        </li>
                        <li 
                            className={classNames(
                                "nav-item", 
                                {"active":active_page=="/admin/prediksi_opt"}
                            )}
                        >
                            <Link href="/admin" className="nav-link">
                                <FiHelpCircle className="link-icon"/>
                                <span className="link-title">Prediksi OPT</span>
                            </Link>
                        </li>
                        <li 
                            className={classNames(
                                "nav-item", 
                                {"active":active_page=="/admin/sebaran_opt"}
                            )}
                        >
                            <Link href="/admin/sebaran_opt" className="nav-link">
                                <FiMeh className="link-icon"/>
                                <span className="link-title">Sebaran OPT</span>
                            </Link>
                        </li>
                        <li 
                            className={classNames(
                                "nav-item", 
                                {"active":active_page=="/admin/bantuan_dpi"}
                            )}
                        >
                            <Link href="/admin/bantuan_dpi" className="nav-link">
                                <FiColumns className="link-icon"/>
                                <span className="link-title">Bantuan DPI</span>
                            </Link>
                        </li>
                        <li 
                            className={classNames(
                                "nav-item",
                                {"active":["/admin/curah_hujan", "/admin/curah_hujan/curah_hujan", "/admin/curah_hujan/curah_hujan_normal", "/admin/curah_hujan/curah_hujan_activity"].includes(active_page)}
                            )}
                        >
                            <a 
                                className="nav-link cursor-pointer" 
                                onClick={e=>setCollapse(collapse=="curah_hujan"?"":"curah_hujan")} 
                                aria-expanded={collapse=="curah_hujan"}
                            >
                                <FiCloudRain className="link-icon"/>
                                <span className="link-title">Big Data Curah Hujan</span>
                                <FiChevronDown className="link-arrow"/>
                            </a>
                            <Collapse in={collapse=="curah_hujan"}>
                                <div>
                                    <ul className="nav sub-menu">
                                        <li className="nav-item">
                                            <Link 
                                                href="/admin/curah_hujan" 
                                                className={classNames("nav-link", {"active":active_page=="/admin/curah_hujan"})}
                                            >
                                                Detail Data Curah Hujan
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link 
                                                href="/admin/curah_hujan/curah_hujan" 
                                                className={classNames("nav-link", {"active":active_page=="/admin/curah_hujan/curah_hujan"})}
                                            >
                                                Update Curah Hujan Prediksi
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link 
                                                href="/admin/curah_hujan/curah_hujan_activity" 
                                                className={classNames("nav-link", {"active":active_page=="/admin/curah_hujan/curah_hujan_activity"})}
                                            >
                                                Activity Curah Hujan Prediksi
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link 
                                                href="/admin/curah_hujan/curah_hujan_normal" 
                                                className={classNames("nav-link", {"active":active_page=="/admin/curah_hujan/curah_hujan_normal"})}
                                            >
                                                Update Curah Hujan Normal
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </Collapse>
                        </li>
                        <li 
                            className={classNames(
                                "nav-item",
                                {"active":["/admin/ews/bawang_merah", "/admin/ews/cabai_besar", "/admin/ews/cabai_rawit"].includes(active_page)}
                            )}
                        >
                            <a 
                                className="nav-link cursor-pointer" 
                                onClick={e=>setCollapse(collapse=="ews"?"":"ews")} 
                                aria-expanded={collapse=="ews"}
                            >
                                <FiTruck className="link-icon"/>
                                <span className="link-title">Data Ews</span>
                                <FiChevronDown className="link-arrow"/>
                            </a>
                            <Collapse in={collapse=="ews"}>
                                <div>
                                    <ul className="nav sub-menu">
                                        <li className="nav-item">
                                            <Link 
                                                href="/admin/ews/bawang_merah" 
                                                className={classNames("nav-link", {"active":active_page=="/admin/ews/bawang_merah"})}
                                            >
                                                Bawang Merah
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link 
                                                href="/admin/ews/cabai_besar" 
                                                className={classNames("nav-link", {"active":active_page=="/admin/ews/cabai_besar"})}
                                            >
                                                Cabai Besar
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link 
                                                href="/admin/ews/cabai_rawit" 
                                                className={classNames("nav-link", {"active":active_page=="/admin/ews/cabai_rawit"})}
                                            >
                                                Cabai Rawit
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </Collapse>
                        </li>
                        {login_data.role=="admin"&&
                            <>
                                <li className="nav-item nav-category">Master Data</li>
                                    <li 
                                        className={classNames(
                                            "nav-item",
                                            {"active":["/admin/region/provinsi", "/admin/region/kabupaten_kota", "/admin/region/kecamatan"].includes(active_page)}
                                        )}
                                    >
                                        <a 
                                            className="nav-link cursor-pointer" 
                                            onClick={e=>setCollapse(collapse=="region"?"":"region")} 
                                            aria-expanded={collapse=="region"}
                                        >
                                            <FiMapPin className="link-icon"/>
                                            <span className="link-title">Region/Wilayah</span>
                                            <FiChevronDown className="link-arrow"/>
                                        </a>
                                        <Collapse in={collapse=="region"}>
                                            <div>
                                                <ul className="nav sub-menu">
                                                    <li className="nav-item">
                                                        <Link 
                                                            href="/admin/region/provinsi" 
                                                            className={classNames("nav-link", {"active":active_page=="/admin/region/provinsi"})}
                                                        >
                                                            Provinsi
                                                        </Link>
                                                    </li>
                                                    <li className="nav-item">
                                                        <Link 
                                                            href="/admin/region/kabupaten_kota" 
                                                            className={classNames("nav-link", {"active":active_page=="/admin/region/kabupaten_kota"})}
                                                        >
                                                            Kabupaten/Kota
                                                        </Link>
                                                    </li>
                                                    <li className="nav-item">
                                                        <Link 
                                                            href="/admin/region/kecamatan" 
                                                            className={classNames("nav-link", {"active":active_page=="/admin/region/kecamatan"})}
                                                        >
                                                            Kecamatan
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </Collapse>
                                    </li>
                                    <li 
                                        className={classNames(
                                            "nav-item",
                                            {"active":active_page=="/admin/users"}
                                        )}
                                    >
                                        <Link href="/admin/users" className="nav-link">
                                            <FiUser className="link-icon"/>
                                            <span className="link-title">Users</span>
                                        </Link>
                                    </li>
                            </>
                        }

                        {/* FRONTPAGE */}
                        <li className="nav-item nav-category">Frontpage</li>
                        <li 
                            className={classNames(
                                "nav-item",
                                {"active":active_page=="/admin/frontpage/geojson_kecamatan"}
                            )}
                        >
                            <Link href="/admin/frontpage/geojson_kecamatan" className="nav-link">
                                <FiBookmark className="link-icon"/>
                                <span className="link-title">Geojson Kecamatan</span>
                            </Link>
                        </li>
                        {login_data.role=="admin"&&
                            <>
                                <li 
                                    className={classNames(
                                        "nav-item",
                                        {"active":active_page=="/admin/frontpage/pengaturan"}
                                    )}
                                >
                                    <Link href="/admin/frontpage/pengaturan" className="nav-link">
                                        <FiSettings className="link-icon"/>
                                        <span className="link-title">Pengaturan</span>
                                    </Link>
                                </li>
                                <li 
                                    className={classNames(
                                        "nav-item",
                                        {"active":['/admin/frontpage/widget/headline', '/admin/frontpage/widget/feature_column', '/admin/frontpage/widget/feature_row'].includes(active_page)}
                                    )}
                                >
                                    <a 
                                        className="nav-link cursor-pointer" 
                                        onClick={e=>setCollapse(collapse=="frontpage_widget"?"":"frontpage_widget")} 
                                        aria-expanded={collapse=="frontpage_widget"}
                                    >
                                        <FiLayers className="link-icon"/>
                                        <span className="link-title">Widget</span>
                                        <FiChevronDown className="link-arrow"/>
                                    </a>
                                    <Collapse in={collapse=="frontpage_widget"}>
                                        <div>
                                            <ul className="nav sub-menu">
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/admin/frontpage/widget/headline" 
                                                        className={classNames("nav-link", {"active":active_page=="/admin/frontpage/widget/headline"})}
                                                    >
                                                        Headline
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/admin/frontpage/widget/feature_column" 
                                                        className={classNames("nav-link", {"active":active_page=="/admin/frontpage/widget/feature_column"})}
                                                    >
                                                        Fitur Kolom
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/admin/frontpage/widget/feature_row" 
                                                        className={classNames("nav-link", {"active":active_page=="/admin/frontpage/widget/feature_row"})}
                                                    >
                                                        Fitur Baris
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </Collapse>
                                </li>
                                <li 
                                    className={classNames(
                                        "nav-item",
                                        {"active":['/admin/frontpage/post', '/admin/frontpage/post/add', '/admin/frontpage/post/edit'].includes(active_page)}
                                    )}
                                >
                                    <a 
                                        className="nav-link cursor-pointer" 
                                        onClick={e=>setCollapse(collapse=="frontpage_post"?"":"frontpage_post")} 
                                        aria-expanded={collapse=="frontpage_post"}
                                    >
                                        <FiArchive className="link-icon"/>
                                        <span className="link-title">Post</span>
                                        <FiChevronDown className="link-arrow"/>
                                    </a>
                                    <Collapse in={collapse=="frontpage_post"}>
                                        <div>
                                            <ul className="nav sub-menu">
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/admin/frontpage/post" 
                                                        className={classNames("nav-link", {"active":active_page=="/admin/frontpage/post"})}
                                                    >
                                                        Semua Post
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/admin/frontpage/post/add" 
                                                        className={classNames("nav-link", {"active":active_page=="/admin/frontpage/post/add"})}
                                                    >
                                                        Tambah
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </Collapse>
                                </li>
                                <li 
                                    className={classNames(
                                        "nav-item",
                                        {"active":['/admin/frontpage/footer/copyright', '/admin/frontpage/footer/about', '/admin/frontpage/footer/menu', '/admin/frontpage/footer/partner'].includes(active_page)}
                                    )}
                                >
                                    <a 
                                        className="nav-link cursor-pointer" 
                                        onClick={e=>setCollapse(collapse=="frontpage_footer"?"":"frontpage_footer")} 
                                        aria-expanded={collapse=="frontpage_footer"}
                                    >
                                        <FiBook className="link-icon"/>
                                        <span className="link-title">Footer</span>
                                        <FiChevronDown className="link-arrow"/>
                                    </a>
                                    <Collapse in={collapse=="frontpage_footer"}>
                                        <div>
                                            <ul className="nav sub-menu">
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/admin/frontpage/footer/about" 
                                                        className={classNames("nav-link", {"active":active_page=="/admin/frontpage/footer/about"})}
                                                    >
                                                        About
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/admin/frontpage/footer/menu" 
                                                        className={classNames("nav-link", {"active":active_page=="/admin/frontpage/footer/menu"})}
                                                    >
                                                        Menu
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/admin/frontpage/footer/partner" 
                                                        className={classNames("nav-link", {"active":active_page=="/admin/frontpage/footer/partner"})}
                                                    >
                                                        Link Partner
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </Collapse>
                                </li>
                            </>
                        }
                    </ul>
                </div>
            </nav>
            <nav 
                className="settings-sidebar"
                style={{
                    right:show_setting?"0":"-232px"
                }}
            >
                <div className="sidebar-body">
                    <a 
                        href="#" 
                        className="settings-sidebar-toggler" 
                        onClick={e=>{
                            e.preventDefault()
                            setShowSetting(!show_setting)
                        }}
                    >
                        <FiSettings/>
                    </a>
                    <h6 className="text-muted mb-2">Sidebar:</h6>
                    <div className="mb-3 pb-3 border-bottom">
                        <div className="form-check form-check-inline">
                            <input 
                                type="radio" 
                                className="form-check-input" 
                                name="sidebarThemeSettings" 
                                id="sidebarLight" 
                                value="sidebar-light" 
                                checked={theme_store.sidebar=="light"?true:false}
                                onChange={e=>theme_store.setSidebar("light")}
                            />
                            <label className="form-check-label" htmlFor="sidebarLight">
                            Light
                            </label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input 
                                type="radio" 
                                className="form-check-input" 
                                name="sidebarThemeSettings" 
                                id="sidebarDark" 
                                value="sidebar-dark"
                                checked={theme_store.sidebar=="dark"?true:false}
                                onChange={e=>theme_store.setSidebar("dark")}
                            />
                            <label className="form-check-label" htmlFor="sidebarDark">
                                Dark
                            </label>
                        </div>
                    </div>
                    <div className="theme-wrapper">
                        <h6 className="text-muted mb-2">Light Theme:</h6>
                        <button 
                            className={classNames("theme-item", {"active":theme_store.theme=="light"})}
                            type="button"
                            onClick={e=>theme_store.setTheme("light")}
                        >
                            <img src={`${BASE_PATH}/images/light.jpg`} alt="light theme"/>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="page-wrapper">
                <nav className="navbar">
                    <a 
                        href="#" 
                        className="sidebar-toggler"
                        onClick={e=>{
                            e.preventDefault()
                            setSidebarMobileToggler(true)
                        }}
                    >
                        <FiMenu/>
                    </a>
                    <div className="navbar-content">
                        <ul className="navbar-nav">
                            <Dropdown className="dropdown nav-item" as="li">
                                <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                    <span className="avatar text-secondary rounded-circle bg-gray-300">
                                        <Avatar data={login_data}/>
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="p-0" style={{minWidth:"233px", marginRight:"-20px", marginTop:"59px"}}>
                                    <div className="d-flex flex-column align-items-center border-bottom px-5 py-3">
                                        <div className="mb-3">
                                            <span className="avatar avatar-lg text-secondary rounded-circle bg-gray-300">
                                                <Avatar data={login_data} size="lg"/>
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <p className="tx-16 fw-bolder">{login_data.nama_lengkap}</p>
                                            <p className="tx-12 text-muted">{login_data.role}</p>
                                        </div>
                                    </div>
                                    <ul className="list-unstyled p-1">
                                        <li className="dropdown-item py-2">
                                            <a href="" className="text-body ms-0">
                                                <FiUser className="me-2 icon-md"/>
                                                <span>Profile</span>
                                            </a>
                                        </li>
                                        <li className="dropdown-item py-2">
                                            <a href="javascript:;" className="text-body ms-0">
                                                <FiEdit className="me-2 icon-md"/>
                                                <span>Edit Profile</span>
                                            </a>
                                        </li>
                                        <li className="dropdown-item py-2">
                                            <a className="text-body ms-0 cursor-pointer" onClick={e=>logout()}>
                                                <FiLogOut className="me-2 icon-md"/>
                                                <span>Log Out</span>
                                            </a>
                                        </li>
                                    </ul>
                                </Dropdown.Menu>
                            </Dropdown>
                        </ul>
                    </div>
                </nav>

                <div className="page-content">
                    {props.children}
                </div>
            </div>
        </div>
    )
}

export default Layout