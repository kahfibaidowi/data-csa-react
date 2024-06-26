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
            // this.fetchSummarySifatHujanKecamatan()
            // this.fetchProvinsiForm()
            this.fetchSummarySifatHujanKabupatenKota()
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
    fetchSummarySifatHujanKabupatenKota=async()=>{
        const {tahun}=this.state

        await this.request.apiGetSummarySifatHujanKabupatenKota(tahun)
        .then(data=>{
            //map
            const geo_features=data.data.map(d=>{
                const kecamatan=d.kecamatan.map(k=>{
                    //curah hujan
                    let curah_hujan=[]
                    this.months_year().map(month=>{
                        for(var i=1; i<=3; i++){
                            const find_curah_hujan=k.curah_hujan.find(f=>f.bulan.toString()==month.toString() && f.input_ke.toString()==i.toString())
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
                        region:k.region,
                        curah_hujan:curah_hujan
                    }
                })

                const curah_hujan_kabkota=this.valueKabupatenKotaCurahHujan({kecamatan})

                return {
                    type:"Feature",
                    properties:{
                        region:d.region,
                        curah_hujan:curah_hujan_kabkota
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
    // fetchSummarySifatHujanKecamatan=async()=>{
    //     const {tahun}=this.state

    //     await this.request.apiGetSummarySifatHujanKecamatan(tahun)
    //     .then(data=>{
    //         //map
    //         const geo_features=data.data.map(d=>{
    //             //curah hujan
    //             let curah_hujan=[]
    //             this.months_year().map(month=>{
    //                 for(var i=1; i<=3; i++){
    //                     const find_curah_hujan=d.curah_hujan.find(f=>f.bulan.toString()==month.toString() && f.input_ke.toString()==i.toString())
    //                     if(!isUndefined(find_curah_hujan)){
    //                         curah_hujan=curah_hujan.concat([find_curah_hujan])
    //                     }
    //                     else{
    //                         const data_curah_hujan={
    //                             id_region:d.id_region,
    //                             tahun:tahun,
    //                             bulan:month,
    //                             curah_hujan:"",
    //                             curah_hujan_normal:"",
    //                             sifat:""
    //                         }
    //                         curah_hujan=curah_hujan.concat([data_curah_hujan])
    //                     }
    //                 }
    //             })

    //             return {
    //                 type:"Feature",
    //                 properties:{
    //                     region:d.region,
    //                     curah_hujan:curah_hujan
    //                 },
    //                 geometry:!isUndefined(d.geo_json.graph)?d.geo_json.graph:{type:"MultiPolygon", coordinates:[]}
    //             }
    //         })

    //         this.setState({
    //             map_curah_hujan:geo_features
    //         })
    //     })
    //     .catch(err=>{
    //         toast.error("Gets Data Failed!", {position:"bottom-center"})
    //     })
    // }
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

    //HELPERS
    valueKabupatenKotaCurahHujanColumn=(data_kabkota, idx_column)=>{
        let curah_hujan=[]

        data_kabkota.kecamatan.map(kec=>{
            if(!isUndefined(kec.curah_hujan[idx_column].id_curah_hujan)){
                curah_hujan=curah_hujan.concat([kec.curah_hujan[idx_column]])
            }
        })

        return curah_hujan
    }
    valueKabupatenKotaCurahHujan=(data_kabkota)=>{
        let curah_hujan=[]

        for(var i=0; i<36; i++){
            const ch_kabupaten_kota_column=this.valueKabupatenKotaCurahHujanColumn(data_kabkota, i)

            if(ch_kabupaten_kota_column.length>0){
                const ch=ch_kabupaten_kota_column.reduce((carry, item)=>{
                    return Number(carry)+Number(item.curah_hujan)
                }, 0)
                const ch_normal=ch_kabupaten_kota_column.reduce((carry, item)=>{
                    return Number(carry)+Number(item.curah_hujan_normal)
                }, 0)

                curah_hujan=curah_hujan.concat([{
                    curah_hujan:ch/ch_kabupaten_kota_column.length,
                    curah_hujan_normal:ch_normal/ch_kabupaten_kota_column.length
                }])
            }
            else{
                curah_hujan=curah_hujan.concat([{
                    curah_hujan:"",
                    curah_hujan_normal:""
                }])
            }
        }

        return curah_hujan
    }

    render(){
        const {tahun, map_curah_hujan}=this.state

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
                <div className="container-fluid px-0 overflow-hidden">
                    <div className="row" style={{height:"calc(100vh - 50px)", marginTop:"50px"}}>
                        <div className="col-12 h-100">
                            <div class="card h-100">
                                <div class="card-body px-0" style={{height:"100%"}}>
                                    <Map 
                                        data={map_curah_hujan} 
                                        className="map-responsive-2"
                                        typeTahun={this.typeTahun}
                                        tahun={tahun}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

// class Frontpage extends React.Component{
//     state={
//         tahun:"",
//         provinsi_form:[],
//         summary_ews_produksi:{
//             bawang_merah:0,
//             cabai_besar:0,
//             cabai_rawit:0
//         },
//         map_curah_hujan:[],
//         banjir:[],
//         kekeringan:[]
//     }

//     componentDidMount=()=>{
//         const tahun=(new Date()).getFullYear()

//         this.setState({
//             tahun:tahun
//         }, ()=>{
//             // this.fetchSummaryEwsProduksi()
//             this.fetchSummarySifatHujanKabupatenKota()
//             // this.fetchProvinsiForm()
//         })
//     }
    
//     //REQUEST, QUERY, MUTATION
//     request={
//         apiGetSummaryEwsProduksi:async(tahun)=>{
//             return await api().get("/frontpage/summary/type/ews_produksi", {
//                 params:{
//                     tahun:tahun
//                 }
//             })
//             .then(res=>res.data)
//         },
//         apiGetSummarySifatHujanKabupatenKota:async(tahun)=>{
//             return await api().get("/frontpage/summary/type/sifat_hujan_kabupaten_kota", {
//                 params:{
//                     tahun:tahun
//                 }
//             })
//             .then(res=>res.data)
//         },
//         apiGetProvinsiForm:async()=>{
//             return await api().get("/frontpage/region/type/provinsi")
//             .then(res=>res.data)
//         }
//     }
//     //--data
//     fetchSummaryEwsProduksi=async()=>{
//         const {tahun}=this.state

//         await this.request.apiGetSummaryEwsProduksi(tahun)
//         .then(data=>{
//             const bawang_merah=data.data.find(f=>f.type=="bawang_merah")
//             const cabai_besar=data.data.find(f=>f.type=="cabai_besar")
//             const cabai_rawit=data.data.find(f=>f.type=="cabai_rawit")

//             this.setState({
//                 summary_ews_produksi:{
//                     bawang_merah:!isUndefined(bawang_merah)?bawang_merah.total_produksi:0,
//                     cabai_besar:!isUndefined(cabai_besar)?cabai_besar.total_produksi:0,
//                     cabai_rawit:!isUndefined(cabai_rawit)?cabai_rawit.total_produksi:0
//                 }
//             })
//         })
//         .catch(err=>{
//             toast.error("Gets Data Failed!", {position:"bottom-center"})
//         })
//     }
//     fetchSummarySifatHujanKabupatenKota=async()=>{
//         const {tahun}=this.state

//         await this.request.apiGetSummarySifatHujanKabupatenKota(tahun)
//         .then(data=>{
//             //banjir
//             const banjir=data.data.map(d=>{
//                 let db=[]
//                 this.months_year().map(month=>{
//                     const curah_hujan=d.curah_hujan.find(f=>f.bulan.toString()==month.toString())

//                     if(!isUndefined(curah_hujan)){
//                         db=db.concat([this.valueBanjir(curah_hujan.curah_hujan)])
//                     }
//                     else{
//                         db=db.concat([""])
//                     }
//                 })

//                 return {
//                     region:d.region,
//                     provinsi:d.parent,
//                     data:db,
//                     rgb:random_rgba()
//                 }
//             })
//             //kekeringan
//             const kekeringan=data.data.map(d=>{
//                 let db=[]
//                 this.months_year().map(month=>{
//                     const curah_hujan=d.curah_hujan.find(f=>f.bulan.toString()==month.toString())
                    
//                     if(!isUndefined(curah_hujan)){
//                         db=db.concat([this.valueKekeringan(curah_hujan.curah_hujan)])
//                     }
//                     else{
//                         db=db.concat([""])
//                     }
//                 })

//                 return {
//                     region:d.region,
//                     provinsi:d.parent,
//                     data:db,
//                     rgb:random_rgba()
//                 }
//             })
//             //map
//             const geo_features=data.data.map(d=>{
//                 //curah hujan
//                 let curah_hujan=[]
//                 this.months_year().map(month=>{
//                     const find_curah_hujan=d.curah_hujan.find(f=>f.bulan.toString()==month.toString())
//                     if(!isUndefined(find_curah_hujan)){
//                         curah_hujan=curah_hujan.concat([find_curah_hujan])
//                     }
//                     else{
//                         const data_curah_hujan={
//                             id_region:d.id_region,
//                             tahun:tahun,
//                             bulan:month,
//                             curah_hujan:"",
//                             curah_hujan_normal:"",
//                             sifat:""
//                         }
//                         curah_hujan=curah_hujan.concat([data_curah_hujan])
//                     }
//                 })

//                 return {
//                     type:"Feature",
//                     properties:{
//                         region:d.region,
//                         curah_hujan:curah_hujan
//                     },
//                     geometry:!isUndefined(d.geo_json.graph)?d.geo_json.graph:{type:"MultiPolygon", coordinates:[]}
//                 }
//             })

//             this.setState({
//                 banjir:banjir,
//                 kekeringan:kekeringan,
//                 map_curah_hujan:geo_features
//             })
//         })
//         .catch(err=>{
//             toast.error("Gets Data Failed!", {position:"bottom-center"})
//         })
//     }
//     fetchProvinsiForm=async()=>{
//         await this.request.apiGetProvinsiForm()
//         .then(data=>{
//             this.setState({
//                 provinsi_form:data.data
//             })
//         })
//         .catch(err=>{
//             toast.error("Gets Data Failed!", {position:"bottom-center"})
//         })
//     }

//     //VALUES
//     tahun_options=()=>{
//         const year=(new Date()).getFullYear()

//         let years=[]
//         for(var i=year-2; i<=year+2; i++){
//             years=years.concat([{value:i, label:i}])
//         }

//         return [{value:"", label:"Pilih Tahun"}].concat(years)
//     }
//     months_year=()=>{
//         let months=[]
//         for(var i=1; i<=12; i++){
//             months=months.concat([i])
//         }

//         return months
//     }
//     valueBanjir=(str_value)=>{
//         const value=str_value.toString().trim()!=""?Number(str_value):""
        
//         if(value=="") return ""

//         if(value<=150){
//             return "Aman"
//         }
//         else if(value>150 && value<=200){
//             return "Waspada"
//         }
//         else if(value>200){
//             return "Rawan"
//         }
//     }
//     valueKekeringan=(str_value)=>{
//         const value=str_value.toString().trim()!=""?Number(str_value):""
        
//         if(value=="") return ""

//         if(value<60){
//             return "Rawan"
//         }
//         else if(value>=60 && value<75){
//             return "Waspada"
//         }
//         else if(value>=75){
//             return "Aman"
//         }

//         return ""
//     }

//     //ACTIONS
//     typeTahun=e=>{
//         this.setState({
//             tahun:e.value
//         }, ()=>{
//             if(this.state.tahun.toString()!=""){
//                 this.fetchSummaryEwsProduksi()
//                 this.fetchSummarySifatHujanKabupatenKota()
//             }
//         })
//     }

//     render(){
//         const {tahun, summary_ews_produksi, banjir, kekeringan, map_curah_hujan, provinsi_form}=this.state

//         return (
//             <>
//                 <Navbar expand="lg" style={{left:0, top:0, width:"100%", zIndex:99999999, height:"auto"}}>
//                     <div className="container d-flex">
//                         <Navbar.Toggle aria-controls="nav-collapse" />
//                         <a href="#" className="navbar-brand me-auto ms-3 ms-lg-0">
//                             <span className="text-primary">EWS</span>
//                         </a>
//                         <Link href="/login" className="btn btn-primary btn-pill order-lg-1">
//                             Login Admin
//                         </Link>
//                         <Navbar.Collapse id="nav-collapse">
//                             <ul class="navbar-nav mx-auto mt-2 mt-lg-0">
//                                 <li class="nav-item">
//                                     <a class="nav-link link-dark fs-15px fw-medium" href="#">Dashboard</a>
//                                 </li>
//                                 <li class="nav-item">
//                                     <a class="nav-link link-dark fs-15px fw-medium" href="#">Peringatan Dini</a>
//                                 </li>
//                                 <li class="nav-item">
//                                     <a class="nav-link link-dark fs-15px fw-medium" href="#">Opt Utama</a>
//                                 </li>
//                                 <li class="nav-item">
//                                     <a class="nav-link link-dark fs-15px fw-medium" href="#">Jadwal Tanam</a>
//                                 </li>
//                             </ul>
//                         </Navbar.Collapse>
//                     </div>
//                 </Navbar>
//                 <div className="d-flex" style={{marginTop:"70px"}}>
//                     <div className="container">
//                         <div className="row mt-3">
//                             <div className="col-12">
//                                 <div className="d-flex justify-content-between align-items-center flex-wrap grid-margin">
//                                     <div>
//                                         <h4 className="mb-3 mb-md-0">Welcome to Frontpage</h4>
//                                     </div>
//                                     <div className="d-flex align-items-center flex-wrap text-nowrap">
//                                         <div className="ms-2" style={{minWidth:"150px"}}>
//                                             <CreatableSelect
//                                                 options={this.tahun_options()}
//                                                 onChange={e=>this.typeTahun(e)}
//                                                 value={this.tahun_options().find(f=>f.value==tahun)}
//                                                 placeholder="Pilih Tahun"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         {/* <div className="row flex-grow-1 mt-3">
//                             <div className="col-md-4 grid-margin stretch-card">
//                                 <div className="card">
//                                     <div className="card-body">
//                                         <div className="d-flex justify-content-between align-items-baseline">
//                                             <h6 className="card-title mb-1">Bawang Merah</h6>
//                                         </div>
//                                         <div className="row">
//                                             <div className="col-6 col-md-12 col-xl-5">
//                                                 <h3 className="mb-1" style={{fontWeight:"700"}}>
//                                                     <NumberFormat
//                                                         displayType="text"
//                                                         thousandSeparator
//                                                         value={summary_ews_produksi.bawang_merah}
//                                                     />
//                                                 </h3>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="col-md-4 grid-margin stretch-card">
//                                 <div className="card">
//                                     <div className="card-body">
//                                         <div className="d-flex justify-content-between align-items-baseline">
//                                             <h6 className="card-title mb-1">Cabai Besar</h6>
//                                         </div>
//                                         <div className="row">
//                                             <div className="col-6 col-md-12 col-xl-5">
//                                                 <h3 className="mb-1" style={{fontWeight:"700"}}>
//                                                     <NumberFormat
//                                                         displayType="text"
//                                                         thousandSeparator
//                                                         value={summary_ews_produksi.cabai_besar}
//                                                     />
//                                                 </h3>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="col-md-4 grid-margin stretch-card">
//                                 <div className="card">
//                                     <div className="card-body">
//                                         <div className="d-flex justify-content-between align-items-baseline">
//                                             <h6 className="card-title mb-1">Cabai Rawit</h6>
//                                         </div>
//                                         <div className="row">
//                                             <div className="col-6 col-md-12 col-xl-5">
//                                                 <h3 className="mb-1" style={{fontWeight:"700"}}>
//                                                     <NumberFormat
//                                                         displayType="text"
//                                                         thousandSeparator
//                                                         value={summary_ews_produksi.cabai_rawit}
//                                                     />
//                                                 </h3>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div> */}
//                         <div className="row mt-4 mb-5">
//                             <div className="col-12">
//                                 <div class="card">
//                                     <div class="card-body">
//                                         <h6 class="card-title mb-2">Pemetaan Sifat Hujan</h6>
//                                         <Map 
//                                             data={map_curah_hujan} 
//                                             className="map-responsive-full"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         {/* <div className="row mt-4">
//                             <div className="col-12">
//                                 <div class="card">
//                                     <div class="card-body">
//                                         <h6 class="card-title mb-5">Peringatan dini Banjir pada Lahan Pertanian Holtikultura</h6>
//                                         <div className="d-flex">
//                                             <Chart
//                                                 data={banjir}
//                                                 labels={["Aman", "Waspada", "Rawan", ""]}
//                                                 provinsi_form={provinsi_form}
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="row mt-4 mb-5">
//                             <div className="col-12">
//                                 <div class="card">
//                                     <div class="card-body">
//                                         <h6 class="card-title mb-5">Peringatan dini Kekeringan pada Lahan Pertanian Holtikultura</h6>
//                                         <div className="d-flex">
//                                             <Chart
//                                                 data={kekeringan}
//                                                 labels={["Aman", "Waspada", "Rawan", ""]}
//                                                 provinsi_form={provinsi_form}
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div> */}
//                     </div>
//                 </div>
//             </>
//         )
//     }
// }

export default Frontpage