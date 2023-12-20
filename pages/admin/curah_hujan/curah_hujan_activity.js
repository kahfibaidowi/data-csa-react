import React, { useEffect, useMemo, useRef, useState } from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Layout from "../../../component/layout"
import withAuth from "../../../component/hoc/auth"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { api } from "../../../config/api"
import { access_token, isUndefined } from "../../../config/config"
import { toast } from "react-toastify"
import Router from "next/router"
import { FiArchive, FiChevronLeft, FiChevronRight, FiEdit, FiPlus, FiTrash, FiTrash2, FiUpload } from "react-icons/fi"
import Avatar from "../../../component/ui/avatar"
import { Modal, Spinner } from "react-bootstrap"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import Select from 'react-select'
import CreatableSelect from "react-select/creatable"
import { Formik } from "formik"
import * as yup from "yup"
import * as turf from "@turf/turf"
import { arrayMonths, arrayMonthsShort } from "../../../config/helpers"
import moment from "moment"
import _ from "underscore"


const MySwal=withReactContent(swal)

class Page extends React.Component{
    state={
        provinsi_form:[],
        regency_form:[],
        region:{
            per_page:15,
            page:1,
            last_page:0,
            q:"",
            province_id:"",
            regency_id:"",
            tahun:"",
            data:[],
            is_loading:false
        },
        detail:{
            is_open:false,
            detail:{}
        }
    }

    componentDidMount=()=>{
        const date=new Date()

        this.setState({
            region:update(this.state.region, {
                tahun:{$set:date.getFullYear()}
            })
        }, ()=>{
            this.fetchProvinsiForm()
            this.fetchRegions()
        })
    }

    //REQUEST, QUERY, MUTATION
    request={
        apiGetsProvinsiForm:async()=>{
            return await api(access_token()).get("/region/type/provinsi", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    pulau:""
                },
            })
            .then(res=>res.data)
        },
        apiGetsRegencyForm:async(province_id)=>{
            return await api(access_token()).get("/region/type/kabupaten_kota", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    province_id:province_id
                }
            })
            .then(res=>res.data)
        },
        apiGetsRegion:async(params)=>{
            return await api(access_token()).get("/curah_hujan/type/kecamatan/activity", {
                params:params
            })
            .then(res=>res.data)
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
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    fetchRegencyForm=async()=>{
        const {region}=this.state

        if(region.province_id.toString().trim()==""){
            this.setState({
                regency_form:[]
            })
            return false
        }

        await this.request.apiGetsRegencyForm(region.province_id)
        .then(data=>{
            this.setState({
                regency_form:data.data
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
    fetchRegions=async()=>{
        const {data, ...params}=this.state.region

        this.setLoading(true)
        await this.request.apiGetsRegion(params)
        .then(data=>{
            this.setState({
                region:update(this.state.region, {
                    page:{$set:data.current_page},
                    last_page:{$set:data.last_page},
                    data:{$set:data.data},
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

    //TABLE
    setLoading=loading=>{
        this.setState({
            region:update(this.state.region, {
                is_loading:{$set:loading}
            })
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            region:update(this.state.region, {
                per_page:{$set:target.value},
                page:{$set:1}
            })
        }, ()=>{
            this.fetchRegions()
        })
    }
    goToPage=page=>{
        this.setState({
            region:update(this.state.region, {
                page:{$set:page}
            })
        }, ()=>{
            this.fetchRegions()
        })
    }
    typeFilter=e=>{
        const target=e.target

        this.setState({
            region:update(this.state.region, {
                page:{$set:1},
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            switch(target.name){
                case "q":
                    if(this.timeout) clearTimeout(this.timeout)
                    this.timeout=setTimeout(()=>{
                        this.fetchRegions()
                    }, 500);
                break
                case "regency_id":
                case "tahun":
                    this.fetchRegions()
                break
                case "province_id":
                    this.setState({
                        region:update(this.state.region, {
                            regency_id:{$set:""}
                        })
                    }, ()=>{
                        this.fetchRegencyForm()
                        this.fetchRegions()
                    })
                break
            }
        })
    }
    timeout=0

    //DATA ACTIONS
    toggleModalDetail=(show=false, data={})=>{
        this.setState({
            detail:{
                is_open:show,
                detail:data
            }
        })
    }


    //RENDER
    render(){
        const {region, provinsi_form, regency_form, detail}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Curah Hujan(Log Activity)</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <Table 
                                        data={region} 
                                        provinsi_form={provinsi_form}
                                        regency_form={regency_form}
                                        setPerPage={this.setPerPage}
                                        goToPage={this.goToPage}
                                        typeFilter={this.typeFilter}
                                        toggleModalDetail={this.toggleModalDetail}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>

                <Detail 
                    data={detail} 
                    tahun={region.tahun}
                    toggleModal={this.toggleModalDetail}
                />
            </>
        )
    }
}

const Table=({data, provinsi_form, regency_form, setPerPage, goToPage, typeFilter, toggleModalDetail})=>{
    
    const provinsi_options=()=>{
        let data=provinsi_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Provinsi", value:""}].concat(data)

        return data
    }
    const regency_options=()=>{
        let data=regency_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Kabupaten/Kota", value:""}].concat(data)

        return data
    }
    const tahun_options=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-3; i<=year+2; i++){
            years=years.concat([{value:i, label:i}])
        }

        return years
    }

    //VALUES
    const ch_prediksi_updated=(row)=>{
        let added=[]
        let added_data=[]
        for(var i=0; i<row.curah_hujan_activity.length; i++){
            const bulan=row.curah_hujan_activity[i].bulan+"-"+row.curah_hujan_activity[i].input_ke

            if(!added.includes(bulan)){
                added=added.concat([bulan])
                added_data=added_data.concat([{bulan:row.curah_hujan_activity[i].bulan, input_ke:row.curah_hujan_activity[i].input_ke}])
            }
        }
        
        added_data.sort((a, b)=>a.input_ke-b.input_ke)
        let new_data=[]
        for(var i=1; i<=12; i++){
            const data=added_data.filter(f=>f.bulan.toString()==i.toString())

            if(data.length>0){
                let input_ke=""
                for(var j=0; j<data.length; j++){
                    input_ke+=data[j].input_ke.toString()
                    if(j+1<data.length){
                        input_ke+=" "
                    }
                }

                new_data=new_data.concat([arrayMonthsShort[i-1]+": "+input_ke])
            }
        }

        return new_data
    }
    const last_update=(row)=>{
        if(row.curah_hujan_activity.length>0){
            return moment(row.curah_hujan_activity[0].updated_at).format("DD/MM/YYYY [At] HH:mm")
        }
        return ""
    }
    const last_update_user=(row)=>{
        if(row.curah_hujan_activity.length>0){
            return row.curah_hujan_activity[0].user?.nama_lengkap
        }
        return ""
    }
    const last_update_device=(row)=>{
        if(row.curah_hujan_activity.length>0){
            return row.curah_hujan_activity[0].info_device
        }
        return ""
    }


    return (
        <>
            <div className="d-flex">
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
                        options={regency_options()}
                        value={regency_options().find(f=>f.value==data.regency_id)}
                        onChange={e=>{
                            typeFilter({target:{name:"regency_id", value:e.value}})
                        }}
                        placeholder="Semua Kabupaten/Kota"
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
            <div className="table-responsive mt-3">
                <table className="table table-hover table-custom table-wrap mb-0">
                    <thead className="thead-light">
                        <tr>
                            <th className="" width="50">#</th>
                            <th className="" width="120">Provinsi</th>
                            <th className="" width="120">Kabupaten/Kota</th>
                            <th className="" width="120">Kecamatan</th>
                            <th className="">CH Prediksi Updated</th>
                            <th className="" width="150">Update Terakhir</th>
                            <th className="" width="120">User</th>
                            <th className="" width="250">Perangkat</th>
                            <td width="80"></td>
                        </tr>
                    </thead>
                    <tbody>
                        <>
                            {!data.is_loading?
                                <>
                                    {data.data.map((list, idx)=>(
                                        <tr key={list}>
                                                <td className="align-middle">{(idx+1)+((data.page-1)*data.per_page)}</td>
                                                <td>{list.parent.parent.region}</td>
                                                <td>{list.parent.region}</td>
                                                <td>{list.region}</td>
                                                <td className="text-wrap">{ch_prediksi_updated(list).join(", ")}</td>
                                                <td>{last_update(list)}</td>
                                                <td>{last_update_user(list)}</td>
                                                <td className="text-wrap">{last_update_device(list)}</td>
                                                <td>
                                                    <button type="button" className="btn btn-link p-0" onClick={()=>toggleModalDetail(true, list)}>
                                                        <FiArchive className="icon"/> Detail
                                                    </button>
                                                </td>
                                        </tr>
                                    ))}
                                    {data.data.length==0&&
                                        <tr>
                                            <td colSpan={9} className="text-center">Data tidak ditemukan!</td>
                                        </tr>
                                    }
                                </>
                            :
                                <>
                                    <tr>
                                        <td colSpan={9} className="text-center">
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
                                </>
                            }
                        </>
                    </tbody>
                </table>
            </div>
            <div className="d-flex align-items-center mt-4">
                <div className="d-flex flex-column">
                    <div>Halaman {data.page} dari {data.last_page}</div>
                </div>
                <div className="d-flex align-items-center me-auto ms-3">
                    <select className="form-select" name="per_page" value={data.per_page} onChange={setPerPage}>
                        <option value="15">15 Data</option>
                        <option value="25">25 Data</option>
                        <option value="50">50 Data</option>
                        <option value="100">100 Data</option>
                    </select>
                </div>
                <div className="d-flex ms-3">
                    <button 
                        className={classNames(
                            "btn",
                            "border-0",
                            {"btn-secondary":data.page>1}
                        )}
                        disabled={data.page<=1}
                        onClick={()=>goToPage(data.page-1)}
                    >
                        <FiChevronLeft/>
                        Prev
                    </button>
                    <button 
                        className={classNames(
                            "btn",
                            "border-0",
                            {"btn-secondary":data.page<data.last_page},
                            "ms-2"
                        )}
                        disabled={data.page>=data.last_page}
                        onClick={()=>goToPage(data.page+1)}
                    >
                        Next
                        <FiChevronRight/>
                    </button>
                </div>
            </div>
        </>
    )
}

const Detail=({data, tahun, toggleModal})=>{

    return (
        <Modal show={data.is_open} onHide={toggleModal} backdrop="static" size="lg" scrollable>
            <Modal.Header closeButton>
                <h4 className="modal-title">Detail Activity</h4>
            </Modal.Header>
            <Modal.Body>
                <table className="table mb-4">
                    <tr>
                        <th width="120">Provinsi</th>
                        <td width="10">:</td>
                        <td>{data.detail?.parent?.parent?.region}</td>
                    </tr>
                    <tr>
                        <th>Kabupaten/Kota</th>
                        <td>:</td>
                        <td>{data.detail?.parent?.region}</td>
                    </tr>
                    <tr>
                        <th>Kecamatan</th>
                        <td>:</td>
                        <td>{data.detail?.region}</td>
                    </tr>
                    <tr>
                        <th>Tahun</th>
                        <td>:</td>
                        <td>{tahun}</td>
                    </tr>
                </table>
                <div className="table-responsive mt-3">
                    <table className="table table-hover table-custom table-wrap mb-0">
                        <thead>
                            <tr>
                                <th>Bulan</th>
                                <th>CH Prediksi</th>
                                <th>Update Terakhir</th>
                                <th>User</th>
                                <th>Perangkat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!_.isUndefined(data.detail.curah_hujan_activity)&&
                                <>
                                    {data.detail.curah_hujan_activity.map(list=>(
                                        <tr>
                                            <td>{arrayMonths[Number(list.bulan)-1]} {list.input_ke}</td>
                                            <td>{list.curah_hujan}</td>
                                            <td>{moment(list.updated_at).format("DD/MM/YYYY [At] HH:mm")}</td>
                                            <td>{list.user?.nama_lengkap}</td>
                                            <td className="text-wrap">{list.info_device}</td>
                                        </tr>
                                    ))}
                                    {data.detail.curah_hujan_activity.length==0&&
                                        <tr>
                                            <td colSpan={5} className="text-center">Belum ada Activity!</td>
                                        </tr>
                                    }
                                </>
                            }
                        </tbody>
                    </table>
                </div>
            </Modal.Body>
            <Modal.Footer className="mt-3 border-top pt-2">
                <button 
                    type="button" 
                    className="btn btn-link text-gray me-auto" 
                    onClick={toggleModal}
                >
                    Tutup
                </button>
            </Modal.Footer>
        </Modal>
    )
}

export default withAuth(Page)