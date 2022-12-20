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
import { FiChevronLeft, FiChevronRight, FiEdit, FiPlus, FiTrash, FiTrash2, FiUpload } from "react-icons/fi"
import Avatar from "../../../component/ui/avatar"
import { Modal, Spinner } from "react-bootstrap"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import { Formik } from "formik"
import * as yup from "yup"


const MySwal=withReactContent(swal)

class Provinsi extends React.Component{
    state={
        region:{
            data:[],
            per_page:15,
            page:1,
            last_page:0,
            q:"",
            is_loading:false
        },
        tambah_region:{
            is_open:false,
            region:{
                type:"provinsi",
                nested:"",
                region:"",
                pulau:"",
                zom:"",
                map_center:{
                    zoom:"",
                    latitude:"",
                    longitude:""
                },
                geo_json:{}
            }
        },
        edit_region:{
            is_open:false,
            region:{}
        }
    }

    componentDidMount=()=>{
        this.fetchRegions()
    }

    //REQUEST, QUERY, MUTATION
    request={
        apiGetsRegion:async(params)=>{
            return await api(access_token()).get("/region/type/provinsi", {
                params:params
            })
            .then(res=>res.data)
        },
        apiAddRegion:async(params)=>{
            return await api(access_token()).post("/region", params).then(res=>res.data)
        },
        apiDeleteRegion:async(id)=>{
            return await api(access_token()).delete(`/region/${id}`).then(res=>res.data)
        },
        apiUpdateRegion:async(params)=>{
            return await api(access_token()).put(`/region/${params.id_region}`, params).then(res=>res.data)
        }
    }
    //--data
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
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
            this.setLoading(false)
        })
    }
    addRegion=async(values, actions)=>{
        await this.request.apiAddRegion(values)
        .then(data=>{
            this.fetchRegions()
            this.toggleModalTambah()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Insert Data Failed! ", {position:"bottom-center"})
        })
    }
    updateRegion=async(values, actions)=>{
        await this.request.apiUpdateRegion(values)
        .then(data=>{
            this.fetchRegions()
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
    deleteRegion=async(id)=>{
        await this.request.apiDeleteRegion(id)
        .then(data=>{
            this.fetchRegions()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Remove Data Failed!", {position:"bottom-center"})
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
            }
        })
    }
    timeout=0

    //DATA ACTIONS
    toggleModalTambah=()=>{
        this.setState({
            tambah_region:{
                is_open:!this.state.tambah_region.is_open,
                region:{
                    type:"provinsi",
                    nested:"",
                    region:"",
                    pulau:"",
                    zom:"",
                    map_center:{
                        zoom:"",
                        latitude:"",
                        longitude:""
                    },
                    geo_json:{}
                }
            }
        })
    }
    toggleModalEdit=(list={}, show=false)=>{
        this.setState({
            edit_region:{
                is_open:show,
                region:show?Object.assign({}, list, {
                    map_center:list.geo_json.map_center,
                    geo_json:list.geo_json.graph!==null?list.geo_json.graph:{},
                    nested:list.nested===null?"":list.nested,
                    zom:"",
                    pulau:list.data.pulau
                }):{}
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
                this.deleteRegion(list.id_region)
            }
        })
    }


    //RENDER
    render(){
        const {region, tambah_region, edit_region}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Master Region(Provinsi)</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                            <button 
                                type="button" 
                                class="btn btn-primary btn-icon-text mb-2 mb-md-0"
                                onClick={this.toggleModalTambah}
                            >
                                <FiPlus className="btn-icon-prepend"/>
                                Tambah Region
                            </button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <Table 
                                        data={region}
                                        setPerPage={this.setPerPage}
                                        goToPage={this.goToPage}
                                        typeFilter={this.typeFilter}
                                        toggleConfirmHapus={this.toggleConfirmHapus}
                                        toggleModalEdit={this.toggleModalEdit}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
    
                <ModalTambah
                    data={tambah_region}
                    toggleModalTambah={this.toggleModalTambah}
                    addRegion={this.addRegion}
                />
    
                <ModalEdit
                    data={edit_region}
                    toggleModalEdit={this.toggleModalEdit}
                    updateRegion={this.updateRegion}
                />
            </>
        )
    }
}

const Table=({data, setPerPage, goToPage, typeFilter, toggleConfirmHapus, toggleModalEdit})=>{

    return (
        <>
            <div className="d-flex">
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
                            <th className="" width="150">Pulau</th>
                            <th className="">Provinsi</th>
                            <th className="" width="50"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {!data.is_loading?
                            <>
                                {data.data.map((list, idx)=>(
                                    <tr key={list}>
                                            <td className="align-middle">{(idx+1)+((data.page-1)*data.per_page)}</td>
                                            <td>{list.data.pulau}</td>
                                            <td>{list.region}</td>
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
                                        <td colSpan={6} className="text-center">Data tidak ditemukan!</td>
                                    </tr>
                                }
                            </>
                        :
                            <>
                                <tr>
                                    <td colSpan={6} className="text-center">
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

const ModalTambah=({data, toggleModalTambah, addRegion})=>{

    return (
        <Modal show={data.is_open} onHide={toggleModalTambah} backdrop="static" size="sm" scrollable>
            <Formik
                initialValues={data.region}
                onSubmit={addRegion}
                validationSchema={
                    yup.object().shape({
                        region:yup.string().required(),
                        pulau:yup.string().required(),
                        map_center:yup.object().shape({
                            zoom:yup.number().optional(),
                            latitude:yup.string().optional(),
                            longitude:yup.string().optional()
                        }),
                        geo_json:yup.object().optional()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Tambah Region(Provinsi)</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Provinsi</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="region"
                                    onChange={formik.handleChange}
                                    value={formik.values.region}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Pulau</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="pulau"
                                    onChange={formik.handleChange}
                                    value={formik.values.pulau}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Map Center</label>
                                <div class="input-group mb-1">
                                    <span class="input-group-text">
                                        Zoom
                                    </span>
                                    <select className="form-select" name="map_center.zoom" value={formik.values.map_center.zoom} onChange={formik.handleChange}>
                                        <option value="">-- Pilih Zoom</option>
                                        <option value="8">8x</option>
                                        <option value="9">9x</option>
                                        <option value="10">10x</option>
                                        <option value="11">11x</option>
                                        <option value="12">12x</option>
                                        <option value="13">13x</option>
                                        <option value="14">14x</option>
                                        <option value="15">15x</option>
                                        <option value="16">16x</option>
                                    </select>
                                </div>
                                <div class="input-group mb-1">
                                    <span class="input-group-text">
                                        Latitude
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        autocomplete="off"
                                        name="map_center.latitude"
                                        value={formik.values.map_center.latitude}
                                        onChange={formik.handleChange}
                                    />
                                </div>
                                <div class="input-group mb-1">
                                    <span class="input-group-text">
                                        Longitude
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        autocomplete="off"
                                        name="map_center.longitude"
                                        value={formik.values.map_center.longitude}
                                        onChange={formik.handleChange}
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-1">
                                    <label className="my-1 me-2" for="country">Geo JSON</label>
                                    <label>
                                        <span className="btn btn-secondary btn-sm ms-2 btn-icon-text"><FiUpload/> Pilih File</span>
                                        <input
                                            type="file"
                                            className="d-none"
                                            accept=".json, .geojson"
                                            onChange={async e=>{
                                                const data=await e.target.files[0].text()
                                                try{
                                                    const geo_json=JSON.parse(data)
                                                    formik.setFieldValue("geo_json", geo_json)
                                                }
                                                catch(e){
                                                    toast.error("Geo JSON invalid!", {position:"bottom-center"})
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <textarea
                                    className="form-control bg-light"
                                    value={JSON.stringify(formik.values.geo_json)}
                                    rows="5"
                                    readOnly
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

const ModalEdit=({data, toggleModalEdit, updateRegion})=>{
    
    return (
        <Modal show={data.is_open} onHide={toggleModalEdit} backdrop="static" size="sm" scrollable>
            <Formik
                initialValues={data.region}
                onSubmit={updateRegion}
                validationSchema={
                    yup.object().shape({
                        region:yup.string().required(),
                        pulau:yup.string().required(),
                        map_center:yup.object().shape({
                            zoom:yup.number().optional(),
                            latitude:yup.string().optional(),
                            longitude:yup.string().optional()
                        }),
                        geo_json:yup.object().optional()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit Region(Provinsi)</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Provinsi</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="region"
                                    onChange={formik.handleChange}
                                    value={formik.values.region}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Pulau</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="pulau"
                                    onChange={formik.handleChange}
                                    value={formik.values.pulau}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Map Center</label>
                                <div class="input-group mb-1">
                                    <span class="input-group-text">
                                        Zoom
                                    </span>
                                    <select className="form-select" name="map_center.zoom" value={formik.values.map_center.zoom} onChange={formik.handleChange}>
                                        <option value="">-- Pilih Zoom</option>
                                        <option value="8">8x</option>
                                        <option value="9">9x</option>
                                        <option value="10">10x</option>
                                        <option value="11">11x</option>
                                        <option value="12">12x</option>
                                        <option value="13">13x</option>
                                        <option value="14">14x</option>
                                        <option value="15">15x</option>
                                        <option value="16">16x</option>
                                    </select>
                                </div>
                                <div class="input-group mb-1">
                                    <span class="input-group-text">
                                        Latitude
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        autocomplete="off"
                                        name="map_center.latitude"
                                        value={formik.values.map_center.latitude}
                                        onChange={formik.handleChange}
                                    />
                                </div>
                                <div class="input-group mb-1">
                                    <span class="input-group-text">
                                        Longitude
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        autocomplete="off"
                                        name="map_center.longitude"
                                        value={formik.values.map_center.longitude}
                                        onChange={formik.handleChange}
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-1">
                                    <label className="my-1 me-2" for="country">Geo JSON</label>
                                    <label>
                                        <span className="btn btn-secondary btn-sm ms-2 btn-icon-text"><FiUpload/> Pilih File</span>
                                        <input
                                            type="file"
                                            className="d-none"
                                            accept=".json, .geojson"
                                            onChange={async e=>{
                                                const data=await e.target.files[0].text()
                                                try{
                                                    const geo_json=JSON.parse(data)
                                                    formik.setFieldValue("geo_json", geo_json)
                                                }
                                                catch(e){
                                                    toast.error("Geo JSON invalid!", {position:"bottom-center"})
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <textarea
                                    className="form-control bg-light"
                                    value={JSON.stringify(formik.values.geo_json)}
                                    rows="5"
                                    readOnly
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


export default withAuth(Provinsi)