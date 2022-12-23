import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Layout from "../../../component/layout"
import withAuth from "../../../component/hoc/auth"
import { Query, useMutation, useQuery, useQueryClient } from "react-query"
import { api } from "../../../config/api"
import { access_token, isUndefined } from "../../../config/config"
import { toast } from "react-toastify"
import Router from "next/router"
import { FiChevronLeft, FiChevronRight, FiDownload, FiEdit, FiExternalLink, FiPlus, FiTrash, FiTrash2, FiUpload, FiX } from "react-icons/fi"
import Avatar from "../../../component/ui/avatar"
import { Modal, Spinner } from "react-bootstrap"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import Select from 'react-select'
import CreatableSelect from "react-select/creatable"
import AsyncCreatableSelect from 'react-select/async-creatable'
import { Formik } from "formik"
import * as yup from "yup"
import NumberFormat from "react-number-format"
import VirtualTable, { VirtualTableContext } from "../../../component/ui/virtual_table"
import BaseTable, {AutoResizer, Column} from "react-base-table"
import DataGrid from 'react-data-grid'



class BawangMerah extends React.Component{
    state={
        provinsi_form:[],
        pulau_form:[],
        ews:{
            per_page:"",
            q:"",
            type:"bawang_merah",
            tahun:"",
            province_id:"",
            pulau:"",
            data:[],
            is_loading:false
        },
        edit_ews:{
            is_open:false,
            ews:{}
        }
    }

    componentDidMount=()=>{
        this.fetchPulauForm()
    }

    //REQUEST, QUERY, MUTATION
    abortController=new AbortController()
    request={
        apiGetsPulauForm:async()=>{
            return await api(access_token()).get("/region/type/pulau", {
                params:{
                    per_page:"",
                    page:1,
                    q:""
                }
            })
            .then(res=>res.data)
        },
        apiGetsProvinsiForm:async(pulau)=>{
            return await api(access_token()).get("/region/type/provinsi", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    pulau:pulau
                },
            })
            .then(res=>res.data)
        },
        apiGetsEws:async(params)=>{
            this.abortController.abort()
            this.abortController=new AbortController()

            return await api(access_token()).get("/ews/type/kabupaten_kota", {
                params:params,
                signal:this.abortController.signal
            })
            .then(res=>res.data)
        },
        apiUpdateEws:async(params)=>{
            return await api(access_token()).post('/ews', params).then(res=>res.data)
        },
        apiGetsOpt:async(params)=>{
            return await api(access_token()).get("/opt", {
                params:params
            })
            .then(res=>res.data)
        },
        apiAddOpt:async(params)=>{
            return await api(access_token()).post('/opt', params).then(res=>res.data)
        }
    }
    //--data
    fetchPulauForm=async()=>{
        await this.request.apiGetsPulauForm()
        .then(data=>{
            this.setState({
                pulau_form:data.data
            })
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    fetchProvinsiForm=async()=>{
        const {ews}=this.state

        await this.request.apiGetsProvinsiForm(ews.pulau)
        .then(data=>{
            this.setState({
                provinsi_form:data.data
            })
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    fetchEws=async()=>{
        const {data, ...params}=this.state.ews

        if(params.tahun.toString().trim()==""){
            this.setState({
                ews:update(this.state.ews, {
                    data:{$set:[]}
                })
            })
            return false
        }

        this.setLoading(true)
        await this.request.apiGetsEws(params)
        .then(data=>{
            let new_data=[]
            data.data.map(kabkot=>{
                let ews=[]
                let curah_hujan=[]
                this.months_year().map(month=>{
                    //ews
                    const find=kabkot.ews.find(f=>f.bulan.toString()==month.toString())
                    if(!isUndefined(find)){
                        ews=ews.concat([find])
                    }
                    else{
                        const data_ews={
                            id_region:kabkot.id_region,
                            type:params.type,
                            tahun:params.tahun,
                            bulan:month,
                            curah_hujan:"",
                            opt_utama:[],
                            produksi:""
                        }
                        ews=ews.concat([data_ews])
                    }

                    //curah hujan
                    const find_curah_hujan=kabkot.curah_hujan.find(f=>f.bulan.toString()==month.toString())
                    if(!isUndefined(find_curah_hujan)){
                        curah_hujan=curah_hujan.concat([find_curah_hujan])
                    }
                    else{
                        const data_curah_hujan={
                            id_region:kabkot.id_region,
                            tahun:params.tahun,
                            bulan:month,
                            curah_hujan:"",
                            curah_hujan_normal:"",
                            sifat:""
                        }
                        curah_hujan=curah_hujan.concat([data_curah_hujan])
                    }
                })

                const add_data=Object.assign({}, kabkot, {
                    provinsi:{
                        id_region:kabkot.provinsi.id_region,
                        nested:kabkot.provinsi.nested,
                        type:kabkot.provinsi.type,
                        region:kabkot.provinsi.region
                    },
                    ews:ews,
                    curah_hujan:curah_hujan
                })
                new_data=new_data.concat(add_data)
            })

            this.setState({
                ews:update(this.state.ews, {
                    data:{$set:new_data},
                    is_loading:{$set:false}
                })
            })
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
            this.setLoading(false)
        })
    }
    updateEws=async(values, actions)=>{
        await this.request.apiUpdateEws(values)
        .then(data=>{
            this.setState({
                ews:update(this.state.ews, {
                    data:{
                        [values.idx]:{
                            ews:{
                                [Number(values.bulan)-1]:{$set:data.data}
                            }
                        }
                    }
                })
            })
            this.toggleModalEdit()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Update Data Failed! ", {position:"bottom-center"})
        })
    }

    //DATA
    months_year=()=>{
        let months=[]
        for(var i=1; i<=12; i++){
            months=months.concat([i])
        }

        return months
    }
    setLoading=loading=>{
        this.setState({
            ews:update(this.state.ews, {
                is_loading:{$set:loading}
            })
        })
    }
    typeFilter=e=>{
        const target=e.target

        this.setState({
            ews:update(this.state.ews, {
                page:{$set:1},
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            switch(target.name){
                case "q":
                    if(this.timeout) clearTimeout(this.timeout)
                    this.timeout=setTimeout(()=>{
                        this.fetchEws()
                    }, 500);
                break
                case "tahun":
                case "province_id":
                    this.fetchEws()
                break
                case "pulau":
                    this.setState({
                        ews:update(this.state.ews, {
                            province_id:{$set:""}
                        })
                    }, ()=>{
                        this.fetchProvinsiForm()
                        this.fetchEws()
                    })
                break
            }
        })
    }
    timeout=0

    //DATA ACTIONS
    toggleModalEdit=(idx="", list={}, show=false)=>{
        this.setState({
            edit_ews:{
                is_open:show,
                ews:show?Object.assign({}, list, {
                    idx:idx
                }):{}
            }
        })
    }


    //RENDER
    render(){
        const {ews, edit_ews, provinsi_form, pulau_form}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Data EWS (Bawang Merah)</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <Table 
                                        data={ews} 
                                        typeFilter={this.typeFilter}
                                        toggleModalEdit={this.toggleModalEdit}
                                        months_year={this.months_year}
                                        provinsi_form={provinsi_form}
                                        pulau_form={pulau_form}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
    
                <ModalEdit
                    data={edit_ews}
                    toggleModalEdit={this.toggleModalEdit}
                    updateEws={this.updateEws}
                    request={this.request}
                />

            </>
        )
    }
}

const Table=({data, provinsi_form, pulau_form, typeFilter, toggleModalEdit})=>{
    const [full_screen, setFullScreen]=useState(false)

    //options
    const tahun_options=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-10; i<=year+2; i++){
            years=years.concat([{value:i, label:i}])
        }

        return [{value:"", label:"Pilih Tahun"}].concat(years)
    }
    const provinsi_options=()=>{
        let data=provinsi_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Provinsi", value:""}].concat(data)

        return data
    }
    const pulau_options=()=>{
        let data=pulau_form.map(p=>{
            return {label:p.pulau, value:p.pulau}
        })
        data=[{label:"Semua Pulau", value:""}].concat(data)

        return data
    }
    const data_generated=()=>{
        let new_data=[]
        
        if(!data.is_loading){
            for(var i=0; i<data.data.length; i++){
                const test=[
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*8+0
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*8+1
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*8+2
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*8+3
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*8+4
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*8+5
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*8+6
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*8+7
                    })
                ]
    
                new_data=new_data.concat(test)
            }
            if(data.data.length>0){
                new_data=new_data.concat([{index:-1, index_table:data.data.length*8}, {index:-1, index_table:data.length*8+1}])
            }
        }
        
        return new_data
    }

    //helper
    const valueBanjir=(str_value)=>{
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
    const valueKekeringan=(str_value)=>{
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
    const valueSifatHujan=(curah_hujan, normal)=>{
        if(curah_hujan.toString().trim()==""||normal.toString().trim()==""){
            return ""
        }
        if(Number(normal)==0){
            return "?";
        }

        const value=curah_hujan/normal;
        if(value<0.85){
            return "Bawah Normal";
        }
        if(value>=0.85 && value<=1.15){
            return "Normal";
        }
        if(value>1.15){
            return "Atas Normal";
        }
    }

    //table
    const columns=[
        {
            key:'no',
            name:'#',
            width: 50,
            frozen: true,
            formatter:({row})=>{
                if(row.index*8+0==row.index_table){
                    return <span>{row.index+1}</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'kabupaten_kota',
            name: 'Kabupaten/Kota',
            width: 220,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                if(row.index*8+0==row.index_table){
                    return <span>{row.region}</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'parameter',
            name: 'Parameter',
            width: 150,
            frozen: true,
            formatter:({row})=>{
                if(row.index*8+0==row.index_table){
                    return <span>CH (mm)</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>CH Normal (mm)</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>Sifat</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>Banjir</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>Kering</span>
                }
                else if(row.index*8+5==row.index_table){
                    return <span>OPT Utama</span>
                }
                else if(row.index*8+6==row.index_table){
                    return <span>Produksi (ton)</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'bulan1',
            name: '1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=0
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan2',
            name: '2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=1
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan3',
            name: '3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=2
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan4',
            name: '4',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=3
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan5',
            name: '5',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=4
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan6',
            name: '6',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=5
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan7',
            name: '7',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=6
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan8',
            name: '8',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=7
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan9',
            name: '9',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=8
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan10',
            name: '10',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=9
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan11',
            name: '11',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=10
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan12',
            name: '12',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=11
    
                if(row.index*8+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*8+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*8+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*8+3==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+4==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*8+5==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*8+6==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={row.ews[row_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else if(row.index*8+7==row.index_table){
                    return (
                        <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(row.index, row.ews[row_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'blankcell1',
            name: '',
            width: 150,
            resizable: true,
            formatter:(row)=>{
                return <></>
            }
        }
    ]


    return (
        <>
            <div className="d-flex mb-4">
                <div className="d-flex">
                    <div style={{width:"200px"}} className="me-2 position-relative">
                        <CreatableSelect
                            options={tahun_options()}
                            onChange={e=>{
                                typeFilter({target:{name:"tahun", value:e.value}})
                            }}
                            value={tahun_options().find(f=>f.value==data.tahun)}
                            placeholder="Pilih Tahun"
                        />
                    </div>
                    <div style={{width:"200px"}} className="me-2">
                        <Select
                            options={pulau_options()}
                            value={pulau_options().find(f=>f.value==data.pulau)}
                            onChange={e=>{
                                typeFilter({target:{name:"pulau", value:e.value}})
                            }}
                            placeholder="Semua Pulau"
                            classNamePrefix="form-select"
                        />
                    </div>
                    <div style={{width:"200px"}} className="me-2">
                        <Select
                            options={provinsi_options()}
                            value={provinsi_options().find(f=>f.value==data.province_id)}
                            onChange={e=>{
                                typeFilter({target:{name:"province_id", value:e.value}})
                            }}
                            placeholder="Semua Provinsi"
                            classNamePrefix="form-select"
                        />
                    </div>
                    <div style={{width:"200px"}} className="me-2">
                        <input
                            type="text"
                            className="form-control"
                            name="q"
                            onChange={typeFilter}
                            value={data.q}
                            placeholder="Cari ..."
                        />
                    </div>
                </div>
                <div className="ms-auto">
                    <button className="btn btn-primary btn-icon" type="button" title="download">
                        <FiDownload className="icon"/>
                    </button>
                    <button className="btn btn-light btn-icon ms-1" type="button" onClick={e=>setFullScreen(true)} title="full screen">
                        <FiExternalLink className="icon"/>
                    </button>
                </div>
            </div>
            
            {!full_screen&&
                <div className="position-relative" style={{height:"600px"}}>
                    <DataGrid
                        rows={data_generated()}
                        columns={columns}
                        className="rdg-light fill-grid"
                        rowHeight={25}
                        headerRowHeight={40}
                        style={{height:"100%"}}
                        renderers
                    />
                    {data.is_loading&&
                        <div
                            className="d-flex align-items-center justify-content-center position-absolute top-0 left-0 w-100 h-100 text-secondary"
                        >
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            Loading...
                        </div>
                    }
                    {(data.data.length==0&&!data.is_loading)&&
                        <div
                            className="d-flex align-items-center justify-content-center position-absolute top-0 left-0 w-100 h-100 text-secondary"
                        >
                            Data tidak ditemukan!
                        </div>
                    }
                </div>
            }

            <Modal show={full_screen} backdrop="static" fullscreen={true} onHide={()=>setFullScreen(false)} animation={false}>
                <Modal.Header>
                    <div className="d-flex w-100">
                        <div className="d-flex">
                            <div style={{width:"200px"}} className="me-2 position-relative">
                                <CreatableSelect
                                    options={tahun_options()}
                                    onChange={e=>{
                                        typeFilter({target:{name:"tahun", value:e.value}})
                                    }}
                                    value={tahun_options().find(f=>f.value==data.tahun)}
                                    placeholder="Pilih Tahun"
                                />
                            </div>
                            <div style={{width:"200px"}} className="me-2">
                                <Select
                                    options={pulau_options()}
                                    value={pulau_options().find(f=>f.value==data.pulau)}
                                    onChange={e=>{
                                        typeFilter({target:{name:"pulau", value:e.value}})
                                    }}
                                    placeholder="Semua Pulau"
                                    classNamePrefix="form-select"
                                />
                            </div>
                            <div style={{width:"200px"}} className="me-2">
                                <Select
                                    options={provinsi_options()}
                                    value={provinsi_options().find(f=>f.value==data.province_id)}
                                    onChange={e=>{
                                        typeFilter({target:{name:"province_id", value:e.value}})
                                    }}
                                    placeholder="Semua Provinsi"
                                    classNamePrefix="form-select"
                                />
                            </div>
                            <div style={{width:"200px"}} className="me-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    name="q"
                                    onChange={typeFilter}
                                    value={data.q}
                                    placeholder="Cari ..."
                                />
                            </div>
                        </div>
                        <div className="ms-auto">
                            <button className="btn btn-primary btn-icon" type="button" title="download">
                                <FiDownload className="icon"/>
                            </button>
                            <button className="btn btn-light btn-icon ms-1" type="button" onClick={e=>setFullScreen(false)} title="tutup full screen">
                                <FiX className="icon"/>
                            </button>
                        </div>
                    </div>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <DataGrid
                        rows={data_generated()}
                        columns={columns}
                        className="rdg-light fill-grid"
                        rowHeight={25}
                        headerRowHeight={40}
                        style={{height:"100%"}}
                        renderers
                    />
                    {data.is_loading&&
                        <div
                            className="d-flex align-items-center justify-content-center position-absolute top-0 left-0 w-100 h-100 text-secondary"
                        >
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            Loading...
                        </div>
                    }
                    {(data.data.length==0&&!data.is_loading)&&
                        <div
                            className="d-flex align-items-center justify-content-center position-absolute top-0 left-0 w-100 h-100 text-secondary"
                        >
                            Data tidak ditemukan!
                        </div>
                    }
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between align-items-center py-1">
                    <Modal.Title>Data EWS(Bawang Merah)</Modal.Title>
                    <button className="btn btn-light" type="button" onClick={e=>setFullScreen(false)}>
                        Tutup Full Screen
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

const ModalEdit=({data, toggleModalEdit, updateEws, request})=>{

    const [options_opt, setOptionsOpt]=useState([])

    //--data
    const fetchSearchOpt=async(str_value, callback)=>{
        const params={
            per_page:15,
            q:str_value
        }
        await request.apiGetsOpt(params)
        .then(data=>{
            const options=data.data.map(opt=>{
                return {label:opt.opt, value:opt.opt}
            })
            setOptionsOpt(options)
            callback(options)
        })
        .catch(err=>false)
    }
    const addSearchedOpt=async(str_value)=>{
        const params={
            opt:str_value
        }
        await request.apiAddOpt(params)
        .then(res=>true)
        .catch(err=>false)
    }

    //helper
    const valuesOpt=(data)=>{
        return data.map(d=>{
            return {label:d, value:d}
        })
    }


    return (
        <Modal 
            show={data.is_open} 
            onHide={toggleModalEdit} 
            backdrop="static" 
            size="sm" 
            className="modal-nested"
            backdropClassName="backdrop-nested" 
            scrollable
        >
            <Formik
                initialValues={data.ews}
                onSubmit={updateEws}
                validationSchema={
                    yup.object().shape({
                        id_region:yup.string().required(),
                        type:yup.string().required(),
                        tahun:yup.string().required(),
                        bulan:yup.string().required(),
                        produksi:yup.string().required()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit Ews(Bawang Merah)</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2">OPT Utama</label>
                                <AsyncCreatableSelect
                                    isMulti={true}
                                    defaultOptions={options_opt}
                                    loadOptions={fetchSearchOpt}
                                    onCreateOption={(str_value)=>{
                                        formik.setFieldValue("opt_utama", formik.values.opt_utama.concat([str_value]))
                                        addSearchedOpt(str_value)
                                    }}
                                    onChange={e=>{
                                        const new_value=e.map(v=>v.value)
                                        formik.setFieldValue("opt_utama", new_value)
                                    }}
                                    value={valuesOpt(formik.values.opt_utama)}
                                    menuPortalTarget={document.body}
                                    styles={{menuPortal:(base)=>({...base, zIndex:9999})}}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2">Produksi (Ton)</label>
                                <NumberFormat
                                    className="form-control"
                                    thousandSeparator
                                    value={formik.values.produksi}
                                    onValueChange={values=>{
                                        const {value}=values
                                        formik.setFieldValue("produksi", value)
                                    }}
                                    suffix=" Ton"
                                    allowNegative={false}
                                />
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="mt-3 border-top pt-2">
                            <button 
                                type="button" 
                                className="btn btn-link text-gray me-auto" 
                                onClick={toggleModalEdit}
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={formik.isSubmitting||!(formik.isValid)}
                            >
                                Save Changes
                            </button>
                        </Modal.Footer>
                    </form>
                )}
            </Formik>
        </Modal>
    )
}


export default withAuth(BawangMerah)