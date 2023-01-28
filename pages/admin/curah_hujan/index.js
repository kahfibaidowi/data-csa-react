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
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp, FiDownload, FiEdit, FiExternalLink, FiPlus, FiTrash, FiTrash2, FiUpload, FiX } from "react-icons/fi"
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


class CurahHujan extends React.Component{
    state={
        kabupaten_kota_form:[],
        provinsi_form:[],
        pulau_form:[],
        curah_hujan:{
            q:"",
            tahun:"",
            regency_id:"",
            province_id:"",
            pulau:"",
            data:[],
            is_loading:false
        },
        edit_curah_hujan:{
            is_open:false,
            curah_hujan:{}
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
        apiGetsKabupatenKotaForm:async(provinsi)=>{
            return await api(access_token()).get("/region/type/kabupaten_kota", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    province_id:provinsi
                },
            })
            .then(res=>res.data)
        },
        apiGetsCurahHujan:async(params)=>{
            this.abortController.abort()
            this.abortController=new AbortController()
            
            return await api(access_token()).get("/curah_hujan/type/treeview", {
                params:{
                    tahun:params.tahun
                },
                signal:this.abortController.signal
            })
            .then(res=>res.data)
        },
        apiUpdateCurahHujan:async(params)=>{
            return await api(access_token()).post('/curah_hujan', params).then(res=>res.data)
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
        const {curah_hujan}=this.state

        await this.request.apiGetsProvinsiForm(curah_hujan.pulau)
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
    fetchKabupatenKotaForm=async()=>{
        const {curah_hujan}=this.state

        await this.request.apiGetsKabupatenKotaForm(curah_hujan.province_id)
        .then(data=>{
            this.setState({
                kabupaten_kota_form:data.data
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
    fetchCurahHujan=async()=>{
        const {data, ...params}=this.state.curah_hujan

        if(params.tahun.toString().trim()==""){
            this.setState({
                curah_hujan:update(this.state.curah_hujan, {
                    data:{$set:[]}
                })
            })
            return false
        }

        this.setLoading(true)
        await this.request.apiGetsCurahHujan(params)
        .then(data=>{
            const new_data=data.data.map(prov=>{
                return Object.assign({}, prov, {
                    kabupaten_kota:prov.kabupaten_kota.map(kab_kota=>{
                        return Object.assign({}, kab_kota, {
                            kecamatan:kab_kota.kecamatan.map(kec=>{
                                let curah_hujan=[]
                                this.months_year().map(month=>{
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
        
                                return Object.assign({}, kec, {
                                    curah_hujan:curah_hujan
                                })
                            }),
                            expanded:false
                        })
                    }),
                    expanded:false
                })
            })

            this.setState({
                curah_hujan:update(this.state.curah_hujan, {
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
    updateCurahHujan=async(values, actions)=>{
        await this.request.apiUpdateCurahHujan(values)
        .then(data=>{
            this.setState({
                curah_hujan:update(this.state.curah_hujan, {
                    data:{
                        [values.index_provinsi]:{
                            kabupaten_kota:{
                                [values.index_kabupaten_kota]:{
                                    kecamatan:{
                                        [values.index]:{
                                            curah_hujan:{
                                                [(Number(values.bulan)-1)*3+(Number(values.input_ke)-1)]:{$set:data.data}
                                            }
                                        }
                                    }
                                }
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
            curah_hujan:update(this.state.curah_hujan, {
                is_loading:{$set:loading}
            })
        })
    }
    typeFilter=e=>{
        const target=e.target

        this.setState({
            curah_hujan:update(this.state.curah_hujan, {
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            switch(target.name){
                case "tahun":
                    this.fetchCurahHujan()
                break
                case "province_id":
                    this.setState({
                        kabupaten_kota_form:[],
                        curah_hujan:update(this.state.curah_hujan, {
                            regency_id:{$set:""}
                        })
                    }, ()=>{
                        this.fetchKabupatenKotaForm()
                    })
                break
                case "pulau":
                    this.setState({
                        curah_hujan:update(this.state.curah_hujan, {
                            province_id:{$set:""},
                            regency_id:{$set:""}
                        }),
                        kabupaten_kota_form:[],
                        provinsi_form:[]
                    }, ()=>{
                        this.fetchProvinsiForm()
                    })
                break
            }
        })
    }
    setData=data=>{
        this.setState({
            curah_hujan:update(this.state.curah_hujan, {
                data:{$set:data}
            })
        })
    }

    //DATA ACTIONS
    toggleModalEdit=(idx_provinsi="", idx_kabupaten_kota="", idx="", list={}, show=false)=>{
        this.setState({
            edit_curah_hujan:{
                is_open:show,
                curah_hujan:show?Object.assign({}, list, {
                    index:idx,
                    index_provinsi:idx_provinsi,
                    index_kabupaten_kota:idx_kabupaten_kota
                }):{}
            }
        })
    }


    //RENDER
    render(){
        const {curah_hujan, edit_curah_hujan, provinsi_form, pulau_form, kabupaten_kota_form}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Data Curah Hujan</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <Table 
                                        data={curah_hujan} 
                                        typeFilter={this.typeFilter}
                                        setData={this.setData}
                                        toggleModalEdit={this.toggleModalEdit}
                                        months_year={this.months_year}
                                        provinsi_form={provinsi_form}
                                        pulau_form={pulau_form}
                                        kabupaten_kota_form={kabupaten_kota_form}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
                
                <ModalEdit
                    data={edit_curah_hujan}
                    toggleModalEdit={this.toggleModalEdit}
                    updateCurahHujan={this.updateCurahHujan}
                    request={this.request}
                />
            </>
        )
    }
}

const Table=({data, provinsi_form, pulau_form, kabupaten_kota_form, typeFilter, toggleModalEdit, setData})=>{
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
    const kabupaten_kota_options=()=>{
        let data=kabupaten_kota_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Kab/Kota", value:""}].concat(data)

        return data
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

    //data
    const data_generated=()=>{
        let new_data=[]

        if(!data.is_loading){
            for(var i=0; i<data.data.length; i++){
                if(data.pulau.toString().trim()!="" && data.data[i].data.pulau.toString().trim()!=data.pulau.toString().trim()){
                    continue
                }
                if(data.province_id.toString().trim()!="" && data.data[i].id_region.toString().trim()!=data.province_id.toString().trim()){
                    continue
                }

                const test=[
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+0,
                        kabupaten_kota:undefined
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+1,
                        kabupaten_kota:undefined
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+2,
                        kabupaten_kota:undefined
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+3,
                        kabupaten_kota:undefined
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+4,
                        kabupaten_kota:undefined
                    })
                ]
                new_data=new_data.concat(test)

                //provinsi expanded
                if(data.data[i].expanded){
                    for(var j=0; j<data.data[i].kabupaten_kota.length; j++){
                        if(data.regency_id.toString().trim()!="" && data.data[i].kabupaten_kota[j].id_region.toString().trim()!=data.regency_id.toString().trim()){
                            continue
                        }

                        const test2=[
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+0,
                                kecamatan:undefined
                            }),
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+1,
                                kecamatan:undefined
                            }),
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+2,
                                kecamatan:undefined
                            }),
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+3,
                                kecamatan:undefined
                            }),
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+4,
                                kecamatan:undefined
                            }),
                        ]
                        new_data=new_data.concat(test2)
                        
                        //kabupaten kota expanded
                        if(data.data[i].kabupaten_kota[j].expanded){
                            for(var k=0; k<data.data[i].kabupaten_kota[j].kecamatan.length; k++){
                                if(data.data[i].kabupaten_kota[j].kecamatan[k].region.toString().toLowerCase().indexOf(data.q.toLowerCase())==-1){
                                    continue
                                }

                                const test3=[
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+0,
                                        kecamatan:undefined
                                    }),
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+1,
                                        kecamatan:undefined
                                    }),
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+2,
                                        kecamatan:undefined
                                    }),
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+3,
                                        kecamatan:undefined
                                    }),
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+4,
                                        kecamatan:undefined
                                    })
                                ];

                                new_data=new_data.concat(test3)
                            }
                        }
                    }
                }
            }

            if(data.data.length>0){
                new_data=new_data.concat([{index:-1, index_table:-1, type:"space"}, {index:-1, index_table:-1, type:"space"}])
            }
        }
        return new_data
    }

    //helper
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
    //--value tree
    const valueAkumulasiCH=(arr_curah_hujan)=>{
        //calculace
        if(arr_curah_hujan.length>0){
            const sum_curah_hujan=arr_curah_hujan.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan)
            }, 0)

            return sum_curah_hujan/arr_curah_hujan.length
        }
        return ""
    }
    const valueAkumulasiCHNormal=(arr_curah_hujan)=>{
        //calculace
        if(arr_curah_hujan.length>0){
            const sum_curah_hujan=arr_curah_hujan.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan_normal)
            }, 0)

            return sum_curah_hujan/arr_curah_hujan.length
        }
        return ""
    }
    const valueProvinsiCurahHujanColumn=(idx_provinsi, idx_column)=>{
        let curah_hujan=[]

        data.data[idx_provinsi].kabupaten_kota.map((kabkota, idx)=>{
            const avg_kabupaten_kota=valueKabupatenKotaCurahHujanColumn(idx_provinsi, idx, idx_column)

            if(avg_kabupaten_kota.length>0){
                const ch=avg_kabupaten_kota.reduce((carry, item)=>{
                    return Number(carry)+Number(item.curah_hujan)
                }, 0)
                const ch_normal=avg_kabupaten_kota.reduce((carry, item)=>{
                    return Number(carry)+Number(item.curah_hujan_normal)
                }, 0)

                curah_hujan=curah_hujan.concat([{
                    curah_hujan:ch/avg_kabupaten_kota.length,
                    curah_hujan_normal:ch_normal/avg_kabupaten_kota.length
                }])
            }
        })

        return curah_hujan
    }
    const valueKabupatenKotaCurahHujanColumn=(idx_provinsi, idx_kabupaten_kota, idx_column)=>{
        let curah_hujan=[]

        data.data[idx_provinsi].kabupaten_kota[idx_kabupaten_kota].kecamatan.map(kec=>{
            if(!isUndefined(kec.curah_hujan[idx_column].id_curah_hujan)){
                curah_hujan=curah_hujan.concat([kec.curah_hujan[idx_column]])
            }
        })

        return curah_hujan
    }
    const valueProvinsiCurahHujan=(idx_provinsi)=>{
        let curah_hujan=[]

        for(var i=0; i<36; i++){
            const ch_provinsi_column=valueProvinsiCurahHujanColumn(idx_provinsi, i)

            if(ch_provinsi_column.length>0){
                const ch=ch_provinsi_column.reduce((carry, item)=>{
                    return Number(carry)+Number(item.curah_hujan)
                }, 0)
                const ch_normal=ch_provinsi_column.reduce((carry, item)=>{
                    return Number(carry)+Number(item.curah_hujan_normal)
                }, 0)

                curah_hujan=curah_hujan.concat([{
                    curah_hujan:ch/ch_provinsi_column.length,
                    curah_hujan_normal:ch_normal/ch_provinsi_column.length
                }])
            }
        }

        return curah_hujan
    }
    const valueKabupatenKotaCurahHujan=(idx_provinsi, idx_kabupaten_kota)=>{
        let curah_hujan=[]

        for(var i=0; i<36; i++){
            const ch_kabupaten_kota_column=valueKabupatenKotaCurahHujanColumn(idx_provinsi, idx_kabupaten_kota, i)

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
        }

        return curah_hujan
    }

    //action
    const toggleProvinsi=(idx_provinsi)=>{
        const new_data=update(data.data, {
            [idx_provinsi]:{
                expanded:{$set:!data.data[idx_provinsi].expanded}
            }
        })

        setData(new_data)
    }
    const toggleKabupatenKota=(idx_provinsi, idx_kabupaten_kota)=>{
        const new_data=update(data.data, {
            [idx_provinsi]:{
                kabupaten_kota:{
                    [idx_kabupaten_kota]:{
                        expanded:{$set:!data.data[idx_provinsi].kabupaten_kota[idx_kabupaten_kota].expanded}
                    }
                }
            }
        })
        
        setData(new_data)
    }

    //table
    const columns=[
        {
            key:'no',
            name:'#',
            width: 30,
            frozen: true,
            formatter:({row})=>{
                if(row.index*5+0==row.index_table && row.type=="provinsi"){
                    return <span>{row.index+1}</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'provinsi',
            name: 'Provinsi',
            width: 220,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                if(row.index*5+0==row.index_table && row.type=="provinsi"){
                    return <span>{row.region}</span>
                }
                else if(!["provinsi", "space"].includes(row.type)){
                    return <div className="treeview"></div>
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
                if(row.index*5+0==row.index_table && row.type=="kabupaten_kota"){
                    return <span>{row.region}</span>
                }
                else if(row.index*5+0==row.index_table && row.type=="provinsi"){
                    return (
                        <div className="d-flex justify-content-end">
                            <button 
                                className={classNames("d-flex flex-fill align-items-center justify-content-center btn py-0 px-1 btn-secondary", {"btn-dark":row.expanded})}
                                type="button"
                                onClick={ev=>toggleProvinsi(row.index)}
                            >
                                {row.expanded?
                                    <>
                                        Sembunyikan
                                        <span className="ms-1">
                                            <FiChevronUp/>
                                        </span>
                                    </>
                                :
                                    <>
                                        Tampilkan
                                        <span className="ms-1">
                                            <FiChevronDown/>
                                        </span>
                                    </>
                                }
                            </button>
                        </div>
                    )
                }
                else if(!["kabupaten_kota", "provinsi", "space"].includes(row.type)){
                    return <div className="treeview"></div>
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
                if(row.index*5+0==row.index_table && row.type=="kecamatan"){
                    return <span>{row.region}</span>
                }
                else if(row.index*5+0==row.index_table && row.type=="kabupaten_kota"){
                    return (
                        <div className="d-flex justify-content-end">
                            <button 
                                className={classNames("d-flex flex-fill align-items-center justify-content-center btn py-0 px-1 btn-secondary", {"btn-dark":row.expanded})}
                                type="button"
                                onClick={ev=>toggleKabupatenKota(row.index_provinsi, row.index)}
                            >
                                {row.expanded?
                                    <>
                                        Sembunyikan
                                        <span className="ms-1">
                                            <FiChevronUp/>
                                        </span>
                                    </>
                                :
                                    <>
                                        Tampilkan
                                        <span className="ms-1">
                                            <FiChevronDown/>
                                        </span>
                                    </>
                                }
                            </button>
                        </div>
                    )
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
                if(row.index*5+0==row.index_table){
                    return <span>Curah Hujan (mm)</span>
                }
                else if(row.index*5+1==row.index_table){
                    return <span>CH Normal (mm)</span>
                }
                else if(row.index*5+2==row.index_table){
                    return <span>Sifat CH</span>
                }
                else if(row.index*5+3==row.index_table){
                    return <span>Sifat Bulan</span>
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
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan1_2',
            name: 'Januari 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=1
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan1_3',
            name: 'Januari 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=2
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan2_1',
            name: 'Februari 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=3
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan2_2',
            name: 'Februari 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=4
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan2_3',
            name: 'Februari 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=5
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan3_1',
            name: 'Maret 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=6
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan3_2',
            name: 'Maret 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=7
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan3_3',
            name: 'Maret 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=8
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan4_1',
            name: 'April 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=9
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan4_2',
            name: 'April 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=10
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan4_3',
            name: 'April 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=11
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan5_1',
            name: 'Mei 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=12
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan5_2',
            name: 'Mei 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=13
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan5_3',
            name: 'Mei 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=14
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan6_1',
            name: 'Juni 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=15
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan6_2',
            name: 'Juni 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=16
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan6_3',
            name: 'Juni 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=17
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan7_1',
            name: 'Juli 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=18
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan7_2',
            name: 'Juli 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=19
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan7_3',
            name: 'Juli 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=20
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan8_1',
            name: 'Agustus 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=21
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan8_2',
            name: 'Agustus 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=22
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan8_3',
            name: 'Agustus 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=23
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan9_1',
            name: 'September 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=24
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan9_2',
            name: 'September 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=25
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan9_3',
            name: 'September 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=26
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan10_1',
            name: 'Oktober 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=27
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan10_2',
            name: 'Oktober 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=28
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan10_3',
            name: 'Oktober 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=29
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan11_1',
            name: 'November 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=30
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan11_2',
            name: 'November 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=31
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan11_3',
            name: 'November 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=32
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan12_1',
            name: 'Desember 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=33
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan12_2',
            name: 'Desember 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=34
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan12_3',
            name: 'Desember 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=35
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'avg_tahunan',
            name: 'Rata Rata Tahunan',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                let ch="", ch_normal=""

                if(row.type=="provinsi"){
                    const curah_hujan=valueProvinsiCurahHujan(row.index)

                    ch=valueAkumulasiCH(curah_hujan)
                    ch_normal=valueAkumulasiCHNormal(curah_hujan)
                }
                else if(row.type=="kabupaten_kota"){
                    const curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)

                    ch=valueAkumulasiCH(curah_hujan)
                    ch_normal=valueAkumulasiCHNormal(curah_hujan)
                }
                else if(row.type=="kecamatan"){
                    const curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))

                    ch=valueAkumulasiCH(curah_hujan)
                    ch_normal=valueAkumulasiCHNormal(curah_hujan)
                }

                //return
                if(row.index*5+0==row.index_table){
                    return <span>{ch}</span>
                }
                else if(row.index*5+1==row.index_table){
                    return <span>{ch_normal}</span>
                }
                else if(row.index*5+2==row.index_table){
                    return <span>{valueSifatHujan(ch, ch_normal)}</span>
                }
                else if(row.index*5+3==row.index_table){
                    return <span>{valueSifatBulan(ch)}</span>
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
                let ch="", ch_normal=""

                if(row.type=="provinsi"){
                    const curah_hujan=valueProvinsiCurahHujan(row.index)

                    ch=valueCurahHujanSumTahunan(curah_hujan)
                    ch_normal=valueCurahHujanNormalSumTahunan(curah_hujan)
                }
                else if(row.type=="kabupaten_kota"){
                    const curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)

                    ch=valueCurahHujanSumTahunan(curah_hujan)
                    ch_normal=valueCurahHujanNormalSumTahunan(curah_hujan)
                }
                else if(row.type=="kecamatan"){
                    const curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))

                    ch=valueCurahHujanSumTahunan(curah_hujan)
                    ch_normal=valueCurahHujanNormalSumTahunan(curah_hujan)
                }

                //return
                if(row.index*5+0==row.index_table){
                    return <span>{ch}</span>
                }
                else if(row.index*5+1==row.index_table){
                    return <span>{ch_normal}</span>
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
                let curah_hujan=[]

                if(row.type=="provinsi"){
                    curah_hujan=valueProvinsiCurahHujan(row.index)
                }
                else if(row.type=="kabupaten_kota"){
                    curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)
                }
                else if(row.type=="kecamatan"){
                    curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))
                }
    
                if(row.index*5+3==row.index_table){
                    return <span>{valueCountSifatBulan(curah_hujan, type)}</span>
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
                let curah_hujan=[]

                if(row.type=="provinsi"){
                    curah_hujan=valueProvinsiCurahHujan(row.index)
                }
                else if(row.type=="kabupaten_kota"){
                    curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)
                }
                else if(row.type=="kecamatan"){
                    curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))
                }
    
                if(row.index*5+3==row.index_table){
                    return <span>{valueCountSifatBulan(curah_hujan, type)}</span>
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
                let curah_hujan=[]

                if(row.type=="provinsi"){
                    curah_hujan=valueProvinsiCurahHujan(row.index)
                }
                else if(row.type=="kabupaten_kota"){
                    curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)
                }
                else if(row.type=="kecamatan"){
                    curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))
                }
    
                if(row.index*5+3==row.index_table){
                    return <span>{valueCountSifatBulan(curah_hujan, type)}</span>
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
                let curah_hujan=[]

                if(row.type=="provinsi"){
                    curah_hujan=valueProvinsiCurahHujan(row.index)
                }
                else if(row.type=="kabupaten_kota"){
                    curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)
                }
                else if(row.type=="kecamatan"){
                    curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))
                }
    
                if(row.index*5+3==row.index_table){
                    return <span>{valueCountSifatBulan(curah_hujan, type)}</span>
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
    const renderColumnBulan=(row, row_index)=>{
        let ch="", ch_normal=""

        if(row.type=="provinsi"){
            const curah_hujan_column=valueProvinsiCurahHujanColumn(row.index, row_index)

            ch=valueAkumulasiCH(curah_hujan_column)
            ch_normal=valueAkumulasiCHNormal(curah_hujan_column)
        }
        else if(row.type=="kabupaten_kota"){
            const curah_hujan_column=valueKabupatenKotaCurahHujanColumn(row.index_provinsi, row.index, row_index)

            ch=valueAkumulasiCH(curah_hujan_column)
            ch_normal=valueAkumulasiCHNormal(curah_hujan_column)
        }
        else if(row.type=="kecamatan"){
            ch=row.curah_hujan[row_index].curah_hujan
            ch_normal=row.curah_hujan[row_index].curah_hujan_normal
        }

        //return
        if(row.index*5+0==row.index_table){
            return <span>{ch}</span>
        }
        else if(row.index*5+1==row.index_table){
            return <span>{ch_normal}</span>
        }
        else if(row.index*5+2==row.index_table){
            return <span>{valueSifatHujan(ch, ch_normal)}</span>
        }
        else if(row.index*5+3==row.index_table){
            return <span>{valueSifatBulan(ch)}</span>
        }
        else if(row.index*5+4==row.index_table && row.type=="kecamatan"){
            return (
                <div className="d-grid gap-2 h-100 px-0" style={{width:"100%"}}>
                    <button 
                        className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                        type="button"
                        onClick={ev=>toggleModalEdit(row.index_provinsi, row.index_kabupaten_kota, row.index, row.curah_hujan[row_index], true)}
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
                        <Select
                            options={kabupaten_kota_options()}
                            value={kabupaten_kota_options().find(f=>f.value==data.regency_id)}
                            onChange={e=>{
                                typeFilter({target:{name:"regency_id", value:e.value}})
                            }}
                            placeholder="Semua Kab/Kota"
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
                                <Select
                                    options={kabupaten_kota_options()}
                                    value={kabupaten_kota_options().find(f=>f.value==data.regency_id)}
                                    onChange={e=>{
                                        typeFilter({target:{name:"regency_id", value:e.value}})
                                    }}
                                    placeholder="Semua Kab/Kota"
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
                            <button className="btn btn-light btn-icon ms-1" type="button" onClick={e=>setFullScreen(false)} title="full screen">
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
                    <Modal.Title>Data Curah Hujan (Kabupaten/Kota)</Modal.Title>
                    <button className="btn btn-light" type="button" onClick={e=>setFullScreen(false)}>
                        Tutup Full Screen
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

const ModalEdit=({data, toggleModalEdit, updateCurahHujan, request})=>{

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
                initialValues={data.curah_hujan}
                onSubmit={updateCurahHujan}
                validationSchema={
                    yup.object().shape({
                        id_region:yup.string().required(),
                        tahun:yup.string().required(),
                        bulan:yup.string().required(),
                        curah_hujan:yup.number().required(),
                        curah_hujan_normal:yup.number().required()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit Curah Hujan</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2">Curah Hujan</label>
                                <NumberFormat
                                    className="form-control"
                                    thousandSeparator
                                    value={formik.values.curah_hujan}
                                    onValueChange={values=>{
                                        const {value}=values
                                        formik.setFieldValue("curah_hujan", value)
                                    }}
                                    suffix=" mm"
                                    allowNegative={false}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2">Curah Hujan Normal</label>
                                <NumberFormat
                                    className="form-control"
                                    thousandSeparator
                                    value={formik.values.curah_hujan_normal}
                                    onValueChange={values=>{
                                        const {value}=values
                                        formik.setFieldValue("curah_hujan_normal", value)
                                    }}
                                    suffix=" mm"
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



export default withAuth(CurahHujan)