import React, { useEffect, useMemo, useState } from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Layout from "../../../component/layout"
import withAuth from "../../../component/hoc/auth"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { api } from "../../../config/api"
import { access_token } from "../../../config/config"
import { toast } from "react-toastify"
import Router from "next/router"
import { FiChevronLeft, FiChevronRight, FiEdit, FiPlus, FiTrash, FiTrash2, FiUpload } from "react-icons/fi"
import Avatar from "../../../component/ui/avatar"
import { Modal, Spinner } from "react-bootstrap"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import Select from "react-select"
import CreatableSelect from "react-select/creatable"
import { Formik } from "formik"
import * as yup from "yup"


const MySwal=withReactContent(swal)

class Users extends React.Component{
    state={
        bantuan_dpi:{
            data:[],
            per_page:15,
            last_page:0,
            page:1,
            q:"",
            tahun:"",
            province_id:"",
            regency_id:"",
            district_id:"",
            is_loading:false
        },
        tambah_bantuan_dpi:{
            is_open:false,
            bantuan_dpi:{
                province_id:"",
                regency_id:"",
                id_region:"",
                tahun:"",
                jenis_bantuan:"",
                kelompok_tani:"",
                pj_kelompok_tani:""
            }
        },
        edit_bantuan_dpi:{
            is_open:false,
            bantuan_dpi:{}
        }
    }

    componentDidMount=()=>{
        this.fetchBantuanDPI()
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
        apiGetsKabupatenKotaForm:async(province_id)=>{
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
        apiGetsKecamatanForm:async(regency_id)=>{
            return await api(access_token()).get("/region/type/kecamatan", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    province_id:"",
                    regency_id:regency_id
                }
            })
            .then(res=>res.data)
        },
        apiGetsBantuanDPI:async(params)=>{
            return await api(access_token()).get("/bantuan_dpi", {
                params:params
            })
            .then(res=>res.data)
        },
        apiAddBantuanDPI:async(params)=>{
            return await api(access_token()).post("/bantuan_dpi", params).then(res=>res.data)
        },
        apiDeleteBantuanDPI:async(id)=>{
            return await api(access_token()).delete(`/bantuan_dpi/${id}`).then(res=>res.data)
        },
        apiUpdateBantuanDPI:async(params)=>{
            return await api(access_token()).put(`/bantuan_dpi/${params.id_bantuan_dpi}`, params).then(res=>res.data)
        }
    }
    //--data
    fetchBantuanDPI=async()=>{
        const {data, ...params}=this.state.bantuan_dpi

        this.setLoading(true)
        await this.request.apiGetsBantuanDPI(params)
        .then(data=>{
            this.setState({
                bantuan_dpi:update(this.state.bantuan_dpi, {
                    data:{$set:data.data},
                    page:{$set:data.current_page},
                    last_page:{$set:data.last_page},
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
    addBantuanDPI=async(values, actions)=>{
        await this.request.apiAddBantuanDPI(values)
        .then(data=>{
            this.fetchBantuanDPI()
            this.toggleModalTambah()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Insert Data Failed! ", {position:"bottom-center"})
        })
    }
    updateBantuanDPI=async(values, actions)=>{
        await this.request.apiUpdateBantuanDPI(values)
        .then(data=>{
            this.fetchBantuanDPI()
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
    deleteBantuanDPI=async(id)=>{
        await this.request.apiDeleteBantuanDPI(id)
        .then(data=>{
            this.fetchBantuanDPI()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Remove Data Failed!", {position:"bottom-center"})
        })
    }

    //TABLE
    setLoading=loading=>{
        this.setState({
            bantuan_dpi:update(this.state.bantuan_dpi, {
                is_loading:{$set:loading}
            })
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            bantuan_dpi:update(this.state.bantuan_dpi, {
                per_page:{$set:target.value},
                page:{$set:1}
            })
        }, ()=>{
            this.fetchBantuanDPI()
        })
    }
    goToPage=page=>{
        this.setState({
            bantuan_dpi:update(this.state.bantuan_dpi, {
                page:{$set:page}
            })
        }, ()=>{
            this.fetchBantuanDPI()
        })
    }
    typeFilter=e=>{
        const target=e.target

        this.setState({
            bantuan_dpi:update(this.state.bantuan_dpi, {
                page:{$set:1},
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            switch(target.name){
                case "q":
                    if(this.timeout) clearTimeout(this.timeout)
                    this.timeout=setTimeout(()=>{
                        this.fetchBantuanDPI()
                    }, 500);
                break
                case "province_id":
                    this.setState({
                        bantuan_dpi:update(this.state.bantuan_dpi, {
                            regency_id:{$set:""},
                            district_id:{$set:""}
                        })
                    }, ()=>{
                        this.fetchBantuanDPI()
                    })
                break
                case "regency_id":
                    this.setState({
                        bantuan_dpi:update(this.state.bantuan_dpi, {
                            district_id:{$set:""}
                        })
                    }, ()=>{
                        this.fetchBantuanDPI()
                    })
                break
                case "district_id":
                case "tahun":
                    this.fetchBantuanDPI()
                break
            }
        })
    }
    timeout=0

    //DATA ACTIONS
    toggleModalTambah=()=>{
        this.setState({
            tambah_bantuan_dpi:{
                is_open:!this.state.tambah_bantuan_dpi.is_open,
                bantuan_dpi:{
                    province_id:"",
                    regency_id:"",
                    id_region:"",
                    tahun:"",
                    jenis_bantuan:"",
                    kelompok_tani:"",
                    pj_kelompok_tani:""
                }
            }
        })
    }
    toggleModalEdit=(list={}, show=false)=>{
        this.setState({
            edit_bantuan_dpi:{
                is_open:show,
                bantuan_dpi:list
            }
        })
    }
    toggleConfirmHapus=(list)=>{
        MySwal.fire({
            title: "Apakah anda Yakin?",
            text: "Data yang sudah dihapus mungkin tidak bisa dikembalikan lagi!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus Data!',
            cancelButtonText: 'Batal!',
            reverseButtons: true,
            customClass:{
                popup:"w-auto"
            }
        })
        .then(result=>{
            if(result.isConfirmed){
                this.deleteBantuanDPI(list.id_bantuan_dpi)
            }
        })
    }


    //RENDER
    render(){
        const {bantuan_dpi, tambah_bantuan_dpi, edit_bantuan_dpi}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Data Bantuan DPI</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                            <button 
                                type="button" 
                                class="btn btn-primary btn-icon-text mb-2 mb-md-0"
                                onClick={this.toggleModalTambah}
                            >
                                <FiPlus className="btn-icon-prepend"/>
                                Tambah BantuanDPI
                            </button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <Table 
                                        data={bantuan_dpi}
                                        setPerPage={this.setPerPage}
                                        goToPage={this.goToPage}
                                        toggleConfirmHapus={this.toggleConfirmHapus}
                                        toggleModalEdit={this.toggleModalEdit}
                                        typeFilter={this.typeFilter}
                                        request={this.request}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
    
                <ModalTambah
                    data={tambah_bantuan_dpi}
                    toggleModalTambah={this.toggleModalTambah}
                    addBantuanDPI={this.addBantuanDPI}
                    request={this.request}
                />
    
                <ModalEdit
                    data={edit_bantuan_dpi}
                    toggleModalEdit={this.toggleModalEdit}
                    updateBantuanDPI={this.updateBantuanDPI}
                    request={this.request}
                />
            </>
        )
    }
}

const Table=({data, setPerPage, goToPage, toggleConfirmHapus, toggleModalEdit, typeFilter, request})=>{
    const [provinsi_form, setProvinsiForm]=useState([])
    const [kabupaten_kota_form, setKabupatenKotaForm]=useState([])
    const [kecamatan_form, setKecamatanForm]=useState([])

    useEffect(()=>{
        fetchProvinsiForm()
    }, [])

    //filter

    //fetch
    const fetchProvinsiForm=async()=>{
        await request.apiGetsProvinsiForm()
        .then(data=>{
            setProvinsiForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchKabupatenKotaForm=async(province_id)=>{
        await request.apiGetsKabupatenKotaForm(province_id)
        .then(data=>{
            setKabupatenKotaForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchKecamatanForm=async(regency_id)=>{
        await request.apiGetsKecamatanForm(regency_id)
        .then(data=>{
            setKecamatanForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }

    //options
    const tahun_options=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-3; i<=year+2; i++){
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
    const kabupaten_kota_options=()=>{
        let data=kabupaten_kota_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Kab/Kota", value:""}].concat(data)

        return data
    }
    const kecamatan_options=()=>{
        let data=kecamatan_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Kecamatan", value:""}].concat(data)

        return data
    }

    return (
        <>
            <div className="d-flex mb-3 mt-3">
                <div style={{width:"200px"}} className="me-2">
                    <Select
                        options={provinsi_options()}
                        value={provinsi_options().find(f=>f.value==data.province_id)}
                        onChange={e=>{
                            typeFilter({target:{name:"province_id", value:e.value}})
                            if(e.value.toString().trim()!=""){
                                fetchKabupatenKotaForm(e.value)
                            }
                            setKabupatenKotaForm([])
                            setKecamatanForm([])
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
                            if(e.value.toString().trim()!=""){
                                fetchKecamatanForm(e.value)
                            }
                            setKecamatanForm([])
                        }}
                        placeholder="Semua Kab/Kota"
                        classNamePrefix="form-select"
                    />
                </div>
                <div style={{width:"200px"}} className="me-2">
                    <Select
                        options={kecamatan_options()}
                        value={kecamatan_options().find(f=>f.value==data.district_id)}
                        onChange={e=>{
                            typeFilter({target:{name:"district_id", value:e.value}})
                        }}
                        placeholder="Semua Kecamatan"
                        classNamePrefix="form-select"
                    />
                </div>
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
            <div className="table-responsive">
                <table className="table table-hover table-hover table-custom table-wrap mb-0">
                    <thead className="thead-light">
                        <tr>
                            <th className="" width="50">#</th>
                            <th className="" width="150">Provinsi</th>
                            <th className="" width="150">Kabupaten/Kota</th>
                            <th className="" width="150">Kecamatan</th>
                            <th className="">Kelompok Tani</th>
                            <th className="">Penanggung Jawab Kelompok Tani</th>
                            <th className="">Jenis Bantuan</th>
                            <th className="" width="80">Tahun Realisasi</th>
                            <th className="" width="50"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {!data.is_loading?
                            <>
                                {data.data.map((list, idx)=>(
                                    <tr key={list}>
                                            <td className="align-middle">{(idx+1)+((data.page-1)*data.per_page)}</td>
                                            <td>{list.region?.parent?.parent?.region}</td>
                                            <td>{list.region?.parent?.region}</td>
                                            <td>{list.region.region}</td>
                                            <td>{list.kelompok_tani}</td>
                                            <td>{list.pj_kelompok_tani}</td>
                                            <td>{list.jenis_bantuan}</td>
                                            <td>{list.tahun}</td>
                                            <td className="text-nowrap p-1 align-middle">
                                                <button type="button" className="btn btn-link p-0" onClick={()=>toggleModalEdit(list, true)}>
                                                    <FiEdit className="icon"/>
                                                </button>
                                                <button type="button" className="btn btn-link link-danger ms-2 p-0" onClick={()=>toggleConfirmHapus(list)}>
                                                    <FiTrash2 className="icon"/>
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

const ModalTambah=({data, toggleModalTambah, addBantuanDPI, request})=>{
    const [provinsi_form, setProvinsiForm]=useState([])
    const [kabupaten_kota_form, setKabupatenKotaForm]=useState([])
    const [kecamatan_form, setKecamatanForm]=useState([])

    useEffect(()=>{
        fetchProvinsiForm()
    }, [])

    //FETCH
    const fetchProvinsiForm=async()=>{
        await request.apiGetsProvinsiForm()
        .then(data=>{
            setProvinsiForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchKabupatenKotaForm=async(province_id)=>{
        await request.apiGetsKabupatenKotaForm(province_id)
        .then(data=>{
            setKabupatenKotaForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchKecamatanForm=async(regency_id)=>{
        await request.apiGetsKecamatanForm(regency_id)
        .then(data=>{
            setKecamatanForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }

    //OPTIONS
    const tahun_options=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-3; i<=year+2; i++){
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
    const kabupaten_kota_options=()=>{
        let data=kabupaten_kota_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Pilih Kab/Kota", value:""}].concat(data)

        return data
    }
    const kecamatan_options=()=>{
        let data=kecamatan_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Pilih Kecamatan", value:""}].concat(data)

        return data
    }
    
    return (
        <Modal show={data.is_open} onHide={toggleModalTambah} backdrop="static" size="sm">
            <Formik
                initialValues={data.bantuan_dpi}
                onSubmit={addBantuanDPI}
                validationSchema={
                    yup.object().shape({
                        id_region:yup.string().required(),
                        tahun:yup.string().required(),
                        jenis_bantuan:yup.string().required(),
                        kelompok_tani:yup.string().required(),
                        pj_kelompok_tani:yup.string().required()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Tambah Bantuan DPI</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Provinsi</label>
                                <Select
                                    options={provinsi_options()}
                                    value={provinsi_options().find(f=>f.value==formik.values.province_id)}
                                    onChange={e=>{
                                        formik.setFieldValue("province_id", e.value)
                                        formik.setFieldValue("regency_id", "")
                                        formik.setFieldValue("id_region", "")
                                        setKabupatenKotaForm([])
                                        setKecamatanForm([])
                                        
                                        if(e.value.toString().trim()!=""){
                                            fetchKabupatenKotaForm(e.value)
                                        }
                                    }}
                                    placeholder="Pilih Provinsi"
                                    classNamePrefix="form-select"
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Kabupaten/Kota</label>
                                <Select
                                    options={kabupaten_kota_options()}
                                    value={kabupaten_kota_options().find(f=>f.value==formik.values.regency_id)}
                                    onChange={e=>{
                                        formik.setFieldValue("regency_id", e.value)
                                        formik.setFieldValue("id_region", "")
                                        setKecamatanForm([])

                                        if(e.value.toString().trim()!=""){
                                            fetchKecamatanForm(e.value)
                                        }
                                    }}
                                    placeholder="Pilih Kabupaten/Kota"
                                    classNamePrefix="form-select"
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Kecamatan</label>
                                <Select
                                    options={kecamatan_options()}
                                    value={kecamatan_options().find(f=>f.value==formik.values.id_region)}
                                    onChange={e=>{
                                        formik.setFieldValue("id_region", e.value)
                                    }}
                                    placeholder="Pilih Kabupaten/Kota"
                                    classNamePrefix="form-select"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2">Tahun Realisasi</label>
                                <CreatableSelect
                                    options={tahun_options()}
                                    onChange={e=>{
                                        formik.setFieldValue("tahun", e.value)
                                    }}
                                    value={tahun_options().find(f=>f.value==formik.values.tahun)}
                                    placeholder="Pilih Tahun"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2">Kelompok Tani</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="kelompok_tani"
                                    onChange={formik.handleChange}
                                    value={formik.values.kelompok_tani}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2">Penanggung Jawab Kelompok Tani</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="pj_kelompok_tani"
                                    onChange={formik.handleChange}
                                    value={formik.values.pj_kelompok_tani}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2">Jenis Bantuan</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="jenis_bantuan"
                                    onChange={formik.handleChange}
                                    value={formik.values.jenis_bantuan}
                                />
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="mt-3 border-top pt-2">
                            <button 
                                type="button" 
                                className="btn btn-link text-gray me-auto" 
                                onClick={toggleModalTambah}
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={formik.isSubmitting||!(formik.dirty&&formik.isValid)}
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

const ModalEdit=({data, toggleModalEdit, updateBantuanDPI, request})=>{

    //OPTIONS
    const tahun_options=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-3; i<=year+2; i++){
            years=years.concat([{value:i, label:i}])
        }

        return [{value:"", label:"Pilih Tahun"}].concat(years)
    }

    
    return (
        <Modal show={data.is_open} onHide={toggleModalEdit} backdrop="static" size="sm">
            <Formik
                initialValues={data.bantuan_dpi}
                onSubmit={updateBantuanDPI}
                validationSchema={
                    yup.object().shape({
                        tahun:yup.string().required(),
                        jenis_bantuan:yup.string().required(),
                        kelompok_tani:yup.string().required(),
                        pj_kelompok_tani:yup.string().required()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit Bantuan DPI</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3">
                                <label className="my-1 me-2">Tahun Realisasi</label>
                                <CreatableSelect
                                    options={tahun_options()}
                                    onChange={e=>{
                                        formik.setFieldValue("tahun", e.value)
                                    }}
                                    value={tahun_options().find(f=>f.value==formik.values.tahun)}
                                    placeholder="Pilih Tahun"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2">Kelompok Tani</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="kelompok_tani"
                                    onChange={formik.handleChange}
                                    value={formik.values.kelompok_tani}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2">Penanggung Jawab Kelompok Tani</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="pj_kelompok_tani"
                                    onChange={formik.handleChange}
                                    value={formik.values.pj_kelompok_tani}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2">Jenis Bantuan</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="jenis_bantuan"
                                    onChange={formik.handleChange}
                                    value={formik.values.jenis_bantuan}
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


export default withAuth(Users)