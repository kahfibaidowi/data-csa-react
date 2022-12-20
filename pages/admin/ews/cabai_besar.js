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


class CabaiBesar extends React.Component{
    state={
        provinsi_form:[],
        regency_form:[],
        ews:{
            per_page:"",
            q:"",
            type:"cabai_besar",
            tahun:"",
            data:[],
            is_loading:false
        },
        edit_ews:{
            is_open:false,
            ews:{}
        }
    }

    componentDidMount=()=>{
    }

    //REQUEST, QUERY, MUTATION
    request={
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
        const {ews, edit_ews}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Data EWS (Cabai Besar)</h4>
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

const Table=({data, months_year, typeFilter, toggleModalEdit})=>{
    
    const tahun_options=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-10; i<=year+2; i++){
            years=years.concat([{value:i, label:i}])
        }

        return [{value:"", label:"Pilih Tahun"}].concat(years)
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
            
            <VirtualTable
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
            />
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
                            <h4 className="modal-title">Edit Ews(Cabai Besar)</h4>
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


export default withAuth(CabaiBesar)