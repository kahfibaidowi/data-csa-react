import classNames from "classnames"
import Link from "next/link"
import Router, { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { Collapse, Dropdown } from "react-bootstrap"
import {FiChevronDown, FiCloudRain, FiEdit, FiEye, FiHelpCircle, FiHome, FiLogOut, FiMail, FiMapPin, FiMenu, FiTruck, FiUser} from "react-icons/fi"
import {api} from "../config/api"
import { access_token, login_data as user_data } from "../config/config"
import Avatar from "./ui/avatar"

const Layout=(props)=>{
    const [login_data, setLoginData]=useState({})
    const [collapse, setCollapse]=useState("")
    const [sidebar_toggler, setSidebarToggler]=useState({
        is_open:false,
        is_folded:false
    })
    const [sidebar_mobile_toggler, setSidebarMobileToggler]=useState(false)
    const [active_page, setActivePage]=useState("")
    const router=useRouter()

    useEffect(()=>{
        setLoginData(user_data()!=null?user_data():{})
        setActivePage(router.pathname)

        //collapse
        if(["/admin/region/provinsi", "/admin/region/kabupaten_kota", "/admin/region/kecamatan"].includes(router.pathname)){
            setCollapse("region")
        }
        if(['/admin/ews/bawang_merah', '/admin/ews/cabai_besar', '/admin/ews/cabai_rawit'].includes(router.pathname)){
            setCollapse("ews")
        }
    }, [])

    //sidebar toggler
    const toggleSidebar=()=>{
        if(sidebar_toggler.is_open){
            setSidebarToggler({
                is_open:false,
                is_folded:false
            })
            setSidebarMobileToggler(!sidebar_mobile_toggler)
        }
        else{
            if(!sidebar_mobile_toggler){
                setSidebarToggler({
                    is_open:true,
                    is_folded:false
                })
            }
            setSidebarMobileToggler(!sidebar_mobile_toggler)
        }
    }
    const toggleSidebarFolded=value=>{
        if(sidebar_toggler.is_open){
            setSidebarToggler({
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
                Router.push("/")
            }
        })
    }
    

    return (
        <div 
            className={classNames(
                "main-wrapper sidebar-dark", 
                {"sidebar-folded":sidebar_toggler.is_open}, 
                {"open-sidebar-folded overflow-hidden":sidebar_toggler.is_folded},
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
                            {"active":sidebar_toggler.is_open||sidebar_mobile_toggler}, 
                            {"not-active":!sidebar_toggler.is_open&&!sidebar_mobile_toggler}
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
                                {"active":active_page=="/admin/curah_hujan"}
                            )}
                        >
                            <Link href="/admin/curah_hujan" className="nav-link">
                                <FiCloudRain className="link-icon"/>
                                <span className="link-title">Input Curah Hujan</span>
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
                                {"active":["/admin/ews/bawang_merah"].includes(active_page)}
                            )}
                        >
                            <a 
                                className="nav-link cursor-pointer" 
                                onClick={e=>setCollapse(collapse=="ews"?"":"ews")} 
                                aria-expanded={collapse=="ews"}
                            >
                                <FiTruck className="link-icon"/>
                                <span className="link-title">Rekap EWS</span>
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
                    </ul>
                <div className="ps__rail-x" style={{left:0,bottom:0}}><div className="ps__thumb-x" tabindex="0" style={{left:0,width:0}}></div></div><div className="ps__rail-y" style={{top:0,right:0}}><div className="ps__thumb-y" tabindex="0" style={{top:0,height:0}}></div></div></div>
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