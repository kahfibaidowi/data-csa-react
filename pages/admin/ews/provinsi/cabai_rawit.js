import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Layout from "../../../../component/layout"
import withAuth from "../../../../component/hoc/auth"
import { Query, useMutation, useQuery, useQueryClient } from "react-query"
import { api } from "../../../../config/api"
import { access_token, isUndefined } from "../../../../config/config"
import { toast } from "react-toastify"
import Router from "next/router"
import { FiChevronLeft, FiChevronRight, FiDownload, FiEdit, FiExternalLink, FiPlus, FiTrash, FiTrash2, FiUpload, FiX } from "react-icons/fi"
import Avatar from "../../../../component/ui/avatar"
import { Modal, Spinner } from "react-bootstrap"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import Select from 'react-select'
import CreatableSelect from "react-select/creatable"
import AsyncCreatableSelect from 'react-select/async-creatable'
import { Formik } from "formik"
import * as yup from "yup"
import NumberFormat from "react-number-format"
import VirtualTable, { VirtualTableContext } from "../../../../component/ui/virtual_table"
import BaseTable, {AutoResizer, Column} from "react-base-table"
import DataGrid from 'react-data-grid'



class CabaiRawit extends React.Component{
    state={
        pulau_form:[],
        ews:{
            per_page:"",
            q:"",
            type:"cabai_rawit",
            tahun:"",
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
        apiGetsEws:async(params)=>{
            this.abortController.abort()
            this.abortController=new AbortController()

            return await api(access_token()).get("/ews/type/provinsi", {
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
            data.data.map(kec=>{
                let ews=[]
                let curah_hujan=[]
                this.months_year().map(month=>{
                    //ews
                    for(var i=1; i<=3; i++){
                        const find=kec.ews.find(f=>(f.bulan.toString()==month.toString()&&f.input_ke.toString()==i.toString()))
                        if(!isUndefined(find)){
                            ews=ews.concat([find])
                        }
                        else{
                            const data_ews={
                                id_region:kec.id_region,
                                type:params.type,
                                tahun:params.tahun,
                                bulan:month,
                                input_ke:i,
                                curah_hujan:"",
                                opt_utama:[],
                                produksi:""
                            }
                            ews=ews.concat([data_ews])
                        }
                    }

                    //curah hujan
                    for(var i=1; i<=3; i++){
                        const find_curah_hujan=kec.curah_hujan.find(f=>(f.bulan.toString()==month.toString()&&f.input_ke.toString()==i.toString()))
                        if(!isUndefined(find_curah_hujan)){
                            curah_hujan=curah_hujan.concat([find_curah_hujan])
                        }
                        else{
                            const data_curah_hujan={
                                id_region:kec.id_region,
                                tahun:params.tahun,
                                bulan:month,
                                input_ke:i,
                                curah_hujan:"",
                                curah_hujan_normal:"",
                                sifat:""
                            }
                            curah_hujan=curah_hujan.concat([data_curah_hujan])
                        }
                    }
                })

                const add_data=Object.assign({}, kec, {
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
            if(err.name=="CanceledError"){
                toast.warn("Request Aborted!", {position:"bottom-center"})
            }
            else{
                if(err.response.status===401){
                    localStorage.removeItem("login_data")
                    Router.push("/login")
                }
                toast.error("Gets Data Failed!", {position:"bottom-center"})
                this.setLoading(false)
            }
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
                                [(Number(values.bulan)-1)*3+(Number(values.input_ke)-1)]:{$set:data.data}
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
                case "pulau":
                    this.fetchEws()
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
        const {ews, edit_ews, pulau_form}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Data EWS Provinsi (Cabai Rawit)</h4>
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
                                        pulau_form={pulau_form}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
            </>
        )
    }
}

const Table=({data, pulau_form, typeFilter, toggleModalEdit})=>{
    const [full_screen, setFullScreen]=useState(false)

    //options
    const tahun_options=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-3; i<=year+2; i++){
            years=years.concat([{value:i, label:i}])
        }

        return [{value:"", label:"Pilih Tahun"}].concat(years)
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
                        index_table:i*9+0
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*9+1
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*9+2
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*9+3
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*9+4
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*9+5
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*9+6
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*9+7
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*9+8
                    })
                ]
    
                new_data=new_data.concat(test)
            }
            if(data.data.length>0){
                new_data=new_data.concat([{index:-1, index_table:data.data.length*9}, {index:-1, index_table:data.length*9+1}])
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
    const valueSifatBulan=(curah_hujan)=>{
        if(curah_hujan.toString().trim()==""){
            return ""
        }

        if(curah_hujan>200){
            return "Bulan Basah"
        }
        else if(curah_hujan>=100 && curah_hujan<=200){
            return "Bulan Lembab"
        }
        else if(curah_hujan>=60 && curah_hujan<100){
            return "Bulan Kering"
        }
        else if(curah_hujan<60){
            return "Bulan Sangat Kering"
        }
    }
    const valueCurahHujanTahunan=(curah_hujan=[])=>{
        const sum_curah_hujan=curah_hujan.reduce((total, value)=>{
            let ch=0
            if(value.curah_hujan.toString()!=""){
                ch=Number(value.curah_hujan)
            }

            return total+ch
        }, 0)

        const count_curah_hujan=curah_hujan.reduce((total, value)=>{
            let add=0
            if(value.curah_hujan.toString()!=""){
                add=1
            }

            return total+add
        }, 0)

        if(count_curah_hujan>0){
            return sum_curah_hujan/count_curah_hujan
        }
        return ""
    }
    const valueCurahHujanNormalTahunan=(curah_hujan=[])=>{
        const sum_curah_hujan=curah_hujan.reduce((total, value)=>{
            let ch=0
            if(value.curah_hujan_normal.toString()!=""){
                ch=Number(value.curah_hujan_normal)
            }

            return total+ch
        }, 0)

        const count_curah_hujan=curah_hujan.reduce((total, value)=>{
            let add=0
            if(value.curah_hujan_normal.toString()!=""){
                add=1
            }

            return total+add
        }, 0)

        if(count_curah_hujan>0){
            return sum_curah_hujan/count_curah_hujan
        }
        return ""
    }
    const valueProduksiTahunan=(ews=[])=>{
        const sum_produksi=ews.reduce((total, value)=>{
            let produksi=0
            if(value.produksi.toString()!=""){
                produksi=Number(value.produksi)
            }

            return total+produksi
        }, 0)

        const count_produksi=ews.reduce((total, value)=>{
            let add=0
            if(value.produksi.toString()!=""){
                add=1
            }

            return total+add
        }, 0)

        if(count_produksi>0){
            return sum_produksi/count_produksi
        }
        return ""
    }
    const valueCurahHujanSumTahunan=(curah_hujan=[])=>{
        const sum_curah_hujan=curah_hujan.reduce((total, value)=>{
            let ch=0
            if(value.curah_hujan.toString()!=""){
                ch=Number(value.curah_hujan)
            }

            return total+ch
        }, 0)

        return sum_curah_hujan
    }
    const valueCurahHujanNormalSumTahunan=(curah_hujan=[])=>{
        const sum_curah_hujan=curah_hujan.reduce((total, value)=>{
            let ch=0
            if(value.curah_hujan_normal.toString()!=""){
                ch=Number(value.curah_hujan_normal)
            }

            return total+ch
        }, 0)

        return sum_curah_hujan
    }
    const valueProduksiSumTahunan=(ews=[])=>{
        const sum_produksi=ews.reduce((total, value)=>{
            let produksi=0
            if(value.produksi.toString()!=""){
                produksi=Number(value.produksi)
            }

            return total+produksi
        }, 0)

        return sum_produksi
    }
    const valueCountSifatBulan=(curah_hujan=[], type)=>{
        let sifat_bulan=[]
        curah_hujan.map(ch=>{
            sifat_bulan=sifat_bulan.concat([valueSifatBulan(ch.curah_hujan)])
        })
        
        let count=0;
        for(var i=0; i<sifat_bulan.length; i++){
            if(sifat_bulan[i].toString()==type.toString()){
                count+=1
            }
        }

        return count
    }

    //table
    const columns=[
        {
            key:'no',
            name:'#',
            width: 50,
            frozen: true,
            formatter:({row})=>{
                if(row.index*9+0==row.index_table){
                    return <span>{row.index+1}</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'kecamatan',
            name: 'Kecamatan',
            width: 220,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                if(row.index*9+0==row.index_table){
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
                if(row.index*9+0==row.index_table){
                    return <span>CH Prediksi (mm)</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>CH Normal (mm)</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>Sifat CH</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>Sifat Bulan</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>Banjir</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>Kering</span>
                }
                else if(row.index*9+6==row.index_table){
                    return <span>OPT Utama</span>
                }
                else if(row.index*9+7==row.index_table){
                    return <span>Produksi (ton)</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'bulan1_1',
            name: 'Januari 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=0
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan1_2',
            name: 'Januari 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=1
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan1_3',
            name: 'Januari 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=2
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan2_1',
            name: 'Februari 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=3
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan2_2',
            name: 'Februari 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=4
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan2_3',
            name: 'Februari 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=5
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan3_1',
            name: 'Maret 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=6
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan3_2',
            name: 'Maret 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=7
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan3_3',
            name: 'Maret 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=8
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan4_1',
            name: 'April 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=9
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan4_2',
            name: 'April 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=10
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan4_3',
            name: 'April 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=11
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan5_1',
            name: 'Mei 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=12
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan5_2',
            name: 'Mei 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=13
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan5_3',
            name: 'Mei 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=14
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan6_1',
            name: 'Juni 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=15
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan6_2',
            name: 'Juni 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=16
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan6_3',
            name: 'Juni 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=17
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan7_1',
            name: 'Juli 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=18
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan7_2',
            name: 'Juli 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=19
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan7_3',
            name: 'Juli 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=20
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan8_1',
            name: 'Agustus 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=21
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan8_2',
            name: 'Agustus 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=22
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan8_3',
            name: 'Agustus 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=23
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan9_1',
            name: 'September 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=24
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan9_2',
            name: 'September 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=25
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan9_3',
            name: 'September 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=26
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan10_1',
            name: 'Oktober 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=27
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan10_2',
            name: 'Oktober 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=28
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan10_3',
            name: 'Oktober 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=29
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan11_1',
            name: 'November 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=30
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan11_2',
            name: 'November 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=31
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan11_3',
            name: 'November 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=32
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan12_1',
            name: 'Desember 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=33
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan12_2',
            name: 'Desember 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=34
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'bulan12_3',
            name: 'Desember 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=35
    
                if(row.index*9+0==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{row.curah_hujan[row_index].curah_hujan_normal}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(row.curah_hujan[row_index].curah_hujan, row.curah_hujan[row_index].curah_hujan_normal)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(row.curah_hujan[row_index].curah_hujan)}</span>
                }
                else if(row.index*9+6==row.index_table){
                    return (
                        <div className="text-truncate" title={row.ews[row_index].opt_utama.join("; ")}>
                            {row.ews[row_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(row.index*9+7==row.index_table){
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
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'avg_tahunan',
            name: 'Rata Rata Tahunan',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const ch_tahunan=valueCurahHujanTahunan(row.curah_hujan)
                const ch_normal_tahunan=valueCurahHujanNormalTahunan(row.curah_hujan)
                const produksi_tahunan=valueProduksiTahunan(row.ews)

                if(row.index*9+0==row.index_table){
                    return <span>{ch_tahunan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{ch_normal_tahunan}</span>
                }
                else if(row.index*9+2==row.index_table){
                    return <span>{valueSifatHujan(ch_tahunan, ch_normal_tahunan)}</span>
                }
                else if(row.index*9+3==row.index_table){
                    return <span>{valueSifatBulan(ch_tahunan)}</span>
                }
                else if(row.index*9+4==row.index_table){
                    return <span>{valueBanjir(ch_tahunan)}</span>
                }
                else if(row.index*9+5==row.index_table){
                    return <span>{valueKekeringan(ch_tahunan)}</span>
                }
                else if(row.index*9+7==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={produksi_tahunan}
                                thousandSeparator={true}
                            />
                        </span>
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
            key: 'jumlah_tahunan',
            name: 'Jumlah Tahunan',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const ch_tahunan=valueCurahHujanSumTahunan(row.curah_hujan)
                const ch_normal_tahunan=valueCurahHujanNormalSumTahunan(row.curah_hujan)
                const produksi_tahunan=valueProduksiSumTahunan(row.ews)

                if(row.index*9+0==row.index_table){
                    return <span>{ch_tahunan}</span>
                }
                else if(row.index*9+1==row.index_table){
                    return <span>{ch_normal_tahunan}</span>
                }
                else if(row.index*9+7==row.index_table){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={produksi_tahunan}
                                thousandSeparator={true}
                            />
                        </span>
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
            key: 'jumlah_bulan_basah',
            name: 'Jumlah Bulan Basah',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const type="Bulan Basah"

                if(row.index*9+3==row.index_table){
                    return <span>{valueCountSifatBulan(row.curah_hujan, type)}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'jumlah_bulan_lembab',
            name: 'Jumlah Bulan Lembab',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const type="Bulan Lembab"

                if(row.index*9+3==row.index_table){
                    return <span>{valueCountSifatBulan(row.curah_hujan, type)}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'jumlah_bulan_kering',
            name: 'Jumlah Bulan Kering',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const type="Bulan Kering"

                if(row.index*9+3==row.index_table){
                    return <span>{valueCountSifatBulan(row.curah_hujan, type)}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'jumlah_bulan_sangat_kering',
            name: 'Jumlah Bulan Sangat Kering',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const type="Bulan Sangat Kering"

                if(row.index*9+3==row.index_table){
                    return <span>{valueCountSifatBulan(row.curah_hujan, type)}</span>
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
                <div className="ms-auto d-flex">
                    <div style={{width:"200px"}} className="me-3 position-relative">
                        <CreatableSelect
                            options={tahun_options()}
                            onChange={e=>{
                                typeFilter({target:{name:"tahun", value:e.value}})
                            }}
                            value={tahun_options().find(f=>f.value==data.tahun)}
                            placeholder="Pilih Tahun"
                        />
                    </div>
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
                        className={classNames("rdg-light","fill-grid")}
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
                        <div className="ms-auto d-flex">
                            <div style={{width:"200px"}} className="me-3 position-relative">
                                <CreatableSelect
                                    options={tahun_options()}
                                    onChange={e=>{
                                        typeFilter({target:{name:"tahun", value:e.value}})
                                    }}
                                    value={tahun_options().find(f=>f.value==data.tahun)}
                                    placeholder="Pilih Tahun"
                                />
                            </div>
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
                        className={classNames("rdg-light","fill-grid")}
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
                    <Modal.Title>Data EWS Provinsi (Cabai Rawit)</Modal.Title>
                    <button className="btn btn-light" type="button" onClick={e=>setFullScreen(false)}>
                        Tutup Full Screen
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default withAuth(CabaiRawit)