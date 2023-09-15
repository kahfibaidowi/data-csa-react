import { Formik } from "formik"
import dynamic from "next/dynamic"
import React, { useState } from "react"
import * as yup from "yup"
import {TfiArrowRight} from "react-icons/tfi"
import { toast } from "react-toastify"
import { api } from "../config/api"
import Router from "next/router"
import CreatableSelect from "react-select/creatable"
import { isUndefined, random_rgba } from "../config/config"
import NumberFormat from "react-number-format"
import Link from "next/link"
import { Navbar } from "react-bootstrap"

const Chart=dynamic(()=>import("../component/modules/frontpage/chart"), {ssr:false})
const Map=dynamic(()=>import("../component/modules/frontpage/map_windy"), {ssr:false})

class Frontpage extends React.Component{
    state={
        tahun:"",
        provinsi_form:[],
        summary_ews_produksi:{
            bawang_merah:0,
            cabai_besar:0,
            cabai_rawit:0
        },
        map_curah_hujan:[],
        banjir:[],
        kekeringan:[]
    }

    componentDidMount=()=>{
        const tahun=(new Date()).getFullYear()

        this.setState({
            tahun:tahun
        }, ()=>{
            // this.fetchSummaryEwsProduksi()
            this.fetchSummarySifatHujanKecamatan()
            // this.fetchProvinsiForm()
        })
    }
    
    //REQUEST, QUERY, MUTATION
    request={
        apiGetSummaryEwsProduksi:async(tahun)=>{
            return await api().get("/frontpage/summary/type/ews_produksi", {
                params:{
                    tahun:tahun
                }
            })
            .then(res=>res.data)
        },
        apiGetSummarySifatHujanKabupatenKota:async(tahun)=>{
            return await api().get("/frontpage/summary/type/sifat_hujan_kabupaten_kota", {
                params:{
                    tahun:tahun
                }
            })
            .then(res=>res.data)
        },
        apiGetSummarySifatHujanKecamatan:async(tahun)=>{
            return await api().get("/frontpage/summary/type/sifat_hujan_kecamatan", {
                params:{
                    tahun:tahun
                }
            })
            .then(res=>res.data)
        },
        apiGetProvinsiForm:async()=>{
            return await api().get("/frontpage/region/type/provinsi")
            .then(res=>res.data)
        }
    }
    //--data
    fetchSummaryEwsProduksi=async()=>{
        const {tahun}=this.state

        await this.request.apiGetSummaryEwsProduksi(tahun)
        .then(data=>{
            const bawang_merah=data.data.find(f=>f.type=="bawang_merah")
            const cabai_besar=data.data.find(f=>f.type=="cabai_besar")
            const cabai_rawit=data.data.find(f=>f.type=="cabai_rawit")

            this.setState({
                summary_ews_produksi:{
                    bawang_merah:!isUndefined(bawang_merah)?bawang_merah.total_produksi:0,
                    cabai_besar:!isUndefined(cabai_besar)?cabai_besar.total_produksi:0,
                    cabai_rawit:!isUndefined(cabai_rawit)?cabai_rawit.total_produksi:0
                }
            })
        })
        .catch(err=>{
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    fetchSummarySifatHujanKecamatan=async()=>{
        const {tahun}=this.state

        await this.request.apiGetSummarySifatHujanKecamatan(tahun)
        .then(data=>{
            //map
            const geo_features=data.data.map(d=>{
                //curah hujan
                let curah_hujan=[]
                this.months_year().map(month=>{
                    for(var i=1; i<=3; i++){
                        const find_curah_hujan=d.curah_hujan.find(f=>f.bulan.toString()==month.toString() && f.input_ke.toString()==i.toString())
                        if(!isUndefined(find_curah_hujan)){
                            curah_hujan=curah_hujan.concat([find_curah_hujan])
                        }
                        else{
                            const data_curah_hujan={
                                id_region:d.id_region,
                                tahun:tahun,
                                bulan:month,
                                curah_hujan:"",
                                curah_hujan_normal:"",
                                sifat:""
                            }
                            curah_hujan=curah_hujan.concat([data_curah_hujan])
                        }
                    }
                })

                return {
                    type:"Feature",
                    properties:{
                        region:d.region,
                        curah_hujan:curah_hujan
                    },
                    geometry:!isUndefined(d.geo_json.graph)?d.geo_json.graph:{type:"MultiPolygon", coordinates:[]}
                }
            })

            this.setState({
                map_curah_hujan:geo_features
            })
        })
        .catch(err=>{
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    fetchProvinsiForm=async()=>{
        await this.request.apiGetProvinsiForm()
        .then(data=>{
            this.setState({
                provinsi_form:data.data
            })
        })
        .catch(err=>{
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }

    //VALUES
    months_year=()=>{
        let months=[]
        for(var i=1; i<=12; i++){
            months=months.concat([i])
        }

        return months
    }
    valueBanjir=(str_value)=>{
        const value=str_value.toString().trim()!=""?Number(str_value):""
        
        if(value=="") return ""

        if(value<=150){
            return "Aman"
        }
        else if(value>150 && value<=200){
            return "Waspada"
        }
        else if(value>200){
            return "Rawan"
        }
    }
    valueKekeringan=(str_value)=>{
        const value=str_value.toString().trim()!=""?Number(str_value):""
        
        if(value=="") return ""

        if(value<60){
            return "Rawan"
        }
        else if(value>=60 && value<75){
            return "Waspada"
        }
        else if(value>=75){
            return "Aman"
        }

        return ""
    }

    //ACTIONS
    typeTahun=e=>{
        this.setState({
            tahun:e.value
        }, ()=>{
            if(this.state.tahun.toString()!=""){
                this.fetchSummaryEwsProduksi()
                this.fetchSummarySifatHujanKecamatan()
            }
        })
    }

    render(){
        const {tahun, summary_ews_produksi, banjir, kekeringan, map_curah_hujan, provinsi_form}=this.state

        return (
            <>
                <Navbar expand="lg" style={{left:0, top:0, width:"100%", zIndex:99999999, height:"auto"}}>
                    <div className="container d-flex">
                        <Navbar.Toggle aria-controls="nav-collapse" />
                        <a href="#" className="navbar-brand me-auto ms-3 ms-lg-0">
                            <span className="text-primary">EWS</span>
                        </a>
                        <Link href="/login" className="btn btn-primary btn-pill order-lg-1">
                            Login Admin
                        </Link>
                        <Navbar.Collapse id="nav-collapse">
                            <ul class="navbar-nav mx-auto mt-2 mt-lg-0">
                                <li class="nav-item">
                                    <Link class="nav-link link-dark fs-15px fw-medium" href="/">Dashboard</Link>
                                </li>
                                <li class="nav-item">
                                    <Link class="nav-link link-dark fs-15px fw-medium" href="/peringatan_dini">Peringatan Dini</Link>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link link-dark fs-15px fw-medium" href="#">Opt Utama</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link link-dark fs-15px fw-medium" href="#">Jadwal Tanam</a>
                                </li>
                            </ul>
                        </Navbar.Collapse>
                    </div>
                </Navbar>
            </>
        )
    }
}

//test

export default Frontpage