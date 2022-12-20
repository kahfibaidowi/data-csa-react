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
import { FiChevronLeft, FiChevronRight, FiEdit, FiPlus, FiTrash, FiTrash2, FiUpload } from "react-icons/fi"
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



class BawangMerah extends React.Component{
    state={
        provinsi_form:[],
        ews:{
            per_page:"",
            q:"",
            type:"bawang_merah",
            tahun:"",
            province_id:"",
            data:[],
            is_loading:false
        },
        edit_ews:{
            is_open:false,
            ews:{}
        }
    }

    componentDidMount=()=>{
        this.fetchProvinsiForm()
    }

    //REQUEST, QUERY, MUTATION
    request={
        apiGetsProvinsiForm:async()=>{
            return await api(access_token()).get("/region/type/provinsi", {
                params:{
                    per_page:"",
                    page:1,
                    q:""
                },
            })
            .then(res=>res.data)
        },
        apiGetsEws:async(params)=>{
            return await api(access_token()).get("/ews/type/kabupaten_kota", {
                params:params
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
    fetchProvinsiForm=async()=>{
        await this.request.apiGetsProvinsiForm()
        .then(data=>{
            this.setState({
                provinsi_form:data.data
            })
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
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
            data.data.map(prov=>{
                const add_data=prov.kabupaten_kota.map(kab=>{
                    let ews=[]
                    this.months_year().map(month=>{
                        const find=kab.ews.find(f=>f.bulan.toString()==month.toString())
                        if(!isUndefined(find)){
                            ews=ews.concat([find])
                        }
                        else{
                            const data_ews={
                                id_region:kab.id_region,
                                type:params.type,
                                tahun:params.tahun,
                                bulan:month,
                                curah_hujan:"",
                                opt_utama:[],
                                produksi:""
                            }
                            ews=ews.concat([data_ews])
                        }
                    })

                    return Object.assign({}, kab, {
                        provinsi:{
                            id_region:prov.id_region,
                            nested:prov.nested,
                            type:prov.type,
                            region:prov.region,
                            data:prov.data,
                            count_kabupaten_kota:prov.kabupaten_kota.length
                        },
                        ews:ews
                    })
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
                Router.push("/")
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
                Router.push("/")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Update Data Failed! ", {position:"bottom-center"})
        })
    }

    //TABLE
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
        const {ews, edit_ews, provinsi_form}=this.state

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

const Table=({data, provinsi_form, months_year, typeFilter, toggleModalEdit})=>{
    
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
        data=[{label:"Pilih Provinsi", value:""}].concat(data)

        return data
    }

    //helper
    const valueBanjir=(str_value)=>{
        const value=str_value.toString().trim()!=""?Number(str_value):""
        
        if(value=="") return ""

        if(value<=150){
            return "A"
        }
        else if(value>150 && value<=200){
            return "W"
        }
        else if(value>200){
            return "R"
        }
    }
    const valueKekeringan=(str_value)=>{
        const value=str_value.toString().trim()!=""?Number(str_value):""
        
        if(value=="") return ""

        if(value<60){
            return "R"
        }
        else if(value>=60 && value<75){
            return "W"
        }
        else if(value>=75){
            return "A"
        }

        return ""
    }

    //custom render
    const renderRow=(idx, row)=>{
        return (
            <>
                <tr>
                    <td rowSpan={7}>{idx+1}</td>
                    <td rowSpan={7}>{row.region}</td>
                    <td>CH (mm)</td>
                    {row.ews.map(e=>(<td>{e.curah_hujan}</td>))}
                </tr>
                <tr>
                    <td>Sifat</td>
                    {row.ews.map(e=>(<td></td>))}
                </tr>
                <tr>
                    <td>Banjir</td>
                    {row.ews.map(e=>(<td>{valueBanjir(e.curah_hujan)}</td>))}
                </tr>
                <tr>
                    <td>Kering</td>
                    {row.ews.map(e=>(<td>{valueKekeringan(e.curah_hujan)}</td>))}
                </tr>
                <tr>
                    <td>OPT Utama</td>
                    {row.ews.map(e=>(
                        <td className="px-0" style={{height:"100px"}} title={e.opt_utama.join("; ")}>
                            <div style={{overflow:"auto"}} className="w-100 h-100 px-2">
                                <span className="d-flex" style={{height:"100%", whiteSpace:"pre-wrap", wordWrap:"break-word"}}>
                                    {e.opt_utama.join("; ")}
                                </span>
                            </div>
                        </td>
                    ))}
                </tr>
                <tr>
                    <td>Produksi (ton)</td>
                    {row.ews.map(e=>(
                        <td>
                            <NumberFormat
                                displayType="text" 
                                value={e.produksi}
                                thousandSeparator={true}
                            />
                        </td>
                    ))}
                </tr>
                <tr>
                    <td></td>
                    {row.ews.map(e=>(
                        <td className="p-0">
                            <div className="d-grid gap-2 h-100">
                                <button 
                                    className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                    type="button"
                                    onClick={ev=>toggleModalEdit(idx, e, true)}
                                >
                                    Edit
                                </button>
                            </div>
                        </td>
                    ))}
                </tr>
            </>
        )
    }
    const Row=({index})=>{
        return renderRow(index, data.data[index])
    }
    const Inner=React.forwardRef(
        function Inner({children, ...rest}, ref){
            const {top, setColRefs, isLoading, dataLength}=useContext(VirtualTableContext)
            
            // //ref for column
            // const refCol1=useRef(null)
            // const refCol2=useRef(null)
            // const refCol3=useRef(null)
            // const refColArr=[
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null),
            //     useRef(null)
            // ]
            // const sizeRefCol1=useSize(refCol1)
            // const sizeRefCol2=useSize(refCol2)
            // const sizeRefCol3=useSize(refCol3)
            // const sizeRefColArr=[
            //     useSize(refColArr[0]),
            //     useSize(refColArr[1]),
            //     useSize(refColArr[2]),
            //     useSize(refColArr[3]),
            //     useSize(refColArr[4]),
            //     useSize(refColArr[5]),
            //     useSize(refColArr[6]),
            //     useSize(refColArr[7]),
            //     useSize(refColArr[8]),
            //     useSize(refColArr[9]),
            //     useSize(refColArr[10]),
            //     useSize(refColArr[11]),
            // ]

            // //ref for row opt utama

            // useEffect(()=>{
            //     setColRefs([sizeRefCol1, sizeRefCol2, sizeRefCol3, sizeRefColArr])
            // }, [sizeRefCol1, sizeRefCol2, sizeRefCol3, sizeRefCol1])

            return (
                <div {...rest} ref={ref}>
                    <table className='table table-bordered' style={{top, position: 'absolute', width: '100%', tableLayout:"fixed"}}>
                        <thead className="thead-light cell-sm no-display">
                            <tr>
                                <th rowSpan={2} className="py-0" width="50"></th>
                                <th rowSpan={2} className="py-0" style={{width:"220px"}}></th>
                                <th rowSpan={2} className="py-0" style={{width:"120px"}}></th>
                                <th className="text-center py-0" colSpan={12}></th>
                            </tr>
                            <tr>
                                {months_year().map((month, idx)=>(
                                    <th key={month} className="py-0" width="300"></th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="cell-sm">
                            {!isLoading?
                                <>
                                    {children}
                                    {dataLength==0&&
                                        <tr>
                                            <td colSpan={16} className="text-center py-2">Data tidak ditemukan!</td>
                                        </tr>
                                    }
                                </>
                            :
                                <tr>
                                    <td colSpan={16} className="text-center py-2">
                                        <div className="d-flex align-items-center justify-content-center">
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
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            )
        }
    )
    const Header=(props)=>{
        const {colRefs}=useContext(VirtualTableContext)

        return (
            <div>
                <table className="table table-bordered" style={{width:"100%", tableLayout:"fixed"}}>
                    <thead className="thead-light cell-sm">
                        <tr>
                            <th rowSpan={2} className="" width="50">#</th>
                            <th rowSpan={2} className="" style={{width:"220px"}}>Kabupaten/Kota</th>
                            <th rowSpan={2} className="" style={{width:"120px"}}>Parameter</th>
                            <th className="text-center" colSpan={12}>Tahun ({data.tahun.toString().trim()!=""?data.tahun:"?"})</th>
                        </tr>
                        <tr>
                            {months_year().map((month, idx)=>(
                                <th key={month} width="300">{month}</th>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>
        )
    }


    return (
        <>
            <div className="d-flex mb-4">
                <div style={{width:"200px"}} className="me-2">
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
                        options={provinsi_options()}
                        value={provinsi_options().find(f=>f.value==data.province_id)}
                        onChange={e=>{
                            typeFilter({target:{name:"province_id", value:e.value}})
                        }}
                        placeholder="Pilih Provinsi"
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
            
            {/* <VirtualTable
                isLoading={data.is_loading}
                dataLength={data.data.length}
                height={600}
                width="100%"
                itemCount={data.data.length}
                itemSize={25*7+75}
                Inner={Inner}
                Header={Header}
                row={Row}
                minWidth="2000px"
            /> */}
            <Table2 data={data} toggleModalEdit={toggleModalEdit}/>
        </>
    )
}

const Table2=({data, toggleModalEdit})=>{

    //helper
    const valueBanjir=(str_value)=>{
        const value=str_value.toString().trim()!=""?Number(str_value):""
        
        if(value=="") return ""

        if(value<=150){
            return "A"
        }
        else if(value>150 && value<=200){
            return "W"
        }
        else if(value>200){
            return "R"
        }
    }
    const valueKekeringan=(str_value)=>{
        const value=str_value.toString().trim()!=""?Number(str_value):""
        
        if(value=="") return ""

        if(value<60){
            return "R"
        }
        else if(value>=60 && value<75){
            return "W"
        }
        else if(value>=75){
            return "A"
        }

        return ""
    }

    //table
    const columns=[
        {
            key: 'no',
            title: '#',
            dataKey: 'index',
            width: 50,
            frozen: Column.FrozenDirection.LEFT,
            cellRenderer:({cellData: index, rowIndex, rowData})=>{
                if(rowData.index*7+0==rowIndex){
                    return <span>{index+1}</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'kabupaten_kota',
            title: 'Kabupaten/Kota',
            dataKey: 'region',
            width: 220,
            resizable: true,
            frozen: Column.FrozenDirection.LEFT,
            cellRenderer:({cellData: region, rowIndex, rowData})=>{
                if(rowData.index*7+0==rowIndex){
                    return <span>{region}</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'parameter',
            title: 'Parameter',
            dataKey: 'index',
            width: 150,
            frozen: Column.FrozenDirection.LEFT,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                if(rowData.index*7+0==rowIndex){
                    return <span>CH (mm)</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span>Sifat</span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>Banjir</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>Kering</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return <span>OPT Utama</span>
                }
                else if(rowData.index*7+5==rowIndex){
                    return <span>Produksi</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'bulan1',
            title: '1',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=0
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan2',
            title: '2',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=1
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan3',
            title: '3',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=2
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan4',
            title: '4',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=3
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan5',
            title: '5',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=4
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan6',
            title: '6',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=5
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan7',
            title: '7',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=6
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan8',
            title: '8',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=7
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan9',
            title: '9',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=8
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan10',
            title: '10',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=9
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan11',
            title: '11',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=10
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'bulan12',
            title: '12',
            dataKey: 'index',
            width: 120,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                const ews_index=11
    
                if(rowData.index*7+0==rowIndex){
                    return <span>{rowData.ews[ews_index].curah_hujan}</span>
                }
                else if(rowData.index*7+1==rowIndex){
                    return <span></span>
                }
                else if(rowData.index*7+2==rowIndex){
                    return <span>{valueBanjir(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+3==rowIndex){
                    return <span>{valueKekeringan(rowData.ews[ews_index].curah_hujan)}</span>
                }
                else if(rowData.index*7+4==rowIndex){
                    return (
                        <div className="text-truncate" title={rowData.ews[ews_index].opt_utama.join("; ")}>
                            {rowData.ews[ews_index].opt_utama.join("; ")}
                        </div>
                    )
                }
                else if(rowData.index*7+5==rowIndex){
                    return (
                        <span>
                            <NumberFormat
                                displayType="text" 
                                value={rowData.ews[ews_index].produksi}
                                thousandSeparator={true}
                            />
                        </span>
                    )
                }
                else{
                    return (
                        <div className="d-grid gap-2 h-100 px-1" style={{width:"100%"}}>
                            <button 
                                className="d-flex align-items-center justify-content-center btn p-0 btn-light rounded-0"
                                type="button"
                                onClick={ev=>toggleModalEdit(rowData.index, rowData.ews[ews_index], true)}
                            >
                                Edit
                            </button>
                        </div>
                    )
                }
            }
        },
        {
            key: 'blankcell1',
            title: '',
            dataKey: 'index',
            width: 150,
            resizable: true,
            cellRenderer:({cellData, rowIndex, rowData})=>{
                <></>
            }
        }
    ]

    const data_generated=()=>{
        let new_data=[]
        for(var i=0; i<data.data.length; i++){
            const test=[
                Object.assign({}, data.data[i], {
                    index:i
                }),
                Object.assign({}, data.data[i], {
                    index:i
                }),
                Object.assign({}, data.data[i], {
                    index:i
                }),
                Object.assign({}, data.data[i], {
                    index:i
                }),
                Object.assign({}, data.data[i], {
                    index:i
                }),
                Object.assign({}, data.data[i], {
                    index:i
                }),
                Object.assign({}, data.data[i], {
                    index:i
                })
            ]

            new_data=new_data.concat(test)
        }
        
        return new_data
    }
    
    return (
        <div style={{height:"600px"}}>
            <AutoResizer>
                {({width, height})=>(
                    <BaseTable
                        fixed
                        data={data_generated()}
                        columns={columns}
                        width={width}
                        height={600}
                        rowHeight={25}
                        classPrefix="custom-base-table"
                        overlayRenderer={()=>{
                            if(data.is_loading){
                                return (
                                    <div
                                        className="d-flex align-items-center justify-content-center h-100 w-100"
                                        style={{background:"rgba(255,255,255,.3"}}
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
                                )
                            }
                            if(data.data.length==0){
                                return (
                                    <div
                                        className="d-flex align-items-center justify-content-center h-100 fs-5"
                                    >
                                        Data tidak ditemukan!
                                    </div>
                                )
                            }
                        }}
                    />
                )}
            </AutoResizer>
        </div>
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
        <Modal show={data.is_open} onHide={toggleModalEdit} backdrop="static" size="sm" scrollable>
            <Formik
                initialValues={data.ews}
                onSubmit={updateEws}
                validationSchema={
                    yup.object().shape({
                        id_region:yup.string().required(),
                        type:yup.string().required(),
                        tahun:yup.string().required(),
                        bulan:yup.string().required(),
                        curah_hujan:yup.string().required(),
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
                                <label className="my-1 me-2">Curah Hujan</label>
                                <NumberFormat
                                    className="form-control"
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