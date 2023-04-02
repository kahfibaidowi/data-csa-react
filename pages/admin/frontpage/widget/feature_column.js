import React, { useContext } from "react"
import update from "immutability-helper"
import Layout from "../../../../component/layout"
import withAuth from "../../../../component/hoc/auth"
import { useTable, useBlockLayout, useResizeColumns } from 'react-table'
import useMouseDelta from "../../../../component/hook/size"
import useSize from "../../../../component/hook/size"
import { FixedSizeGrid, FixedSizeList } from "react-window"
import { FiEdit, FiPlus, FiTrash2, FiUpload } from "react-icons/fi"
import { Formik } from "formik"
import * as yup from "yup"
import { Modal } from "react-bootstrap"
import { ButtonUpload } from "../../../../component/button_upload"
import { access_token, BASE_URL } from "../../../../config/config"
import { api } from "../../../../config/api"
import Router from "next/router"
import { toast } from "react-toastify"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'

const MySwal=withReactContent(swal)


class Index extends React.Component{
    state={
        type:"feature_column",
        feature:{
            title:"",
            sub_title:"",
            data:[]
        },
        tambah_feature:{
            is_open:false
        },
        edit_feature:{
            is_open:false,
            index:"",
            data:{}
        }
    }

    componentDidMount=()=>{
        this.fetchWidget()
    }

    //REQUEST, MUTABLE
    request={
        getWidget:async(type)=>{
            return await api(access_token()).get("/frontpage_admin/widget", {
                params:{
                    type:type
                }
            })
            .then(res=>res.data)
        },
        updateWidget:async(params)=>{
            return await api(access_token()).post("/frontpage_admin/widget", params)
            .then(res=>res.data)
        }
    }
    fetchWidget=async()=>{
        await this.request.getWidget(this.state.type)
        .then(data=>{
            this.setState({
                feature:data.data.data
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
    updateWidget=async(values, actions)=>{
        const params={
            type:this.state.type,
            data:values
        }

        await this.request.updateWidget(params)
        .then(data=>{
            this.fetchWidget()
            toast.success("Berhasil mengubah widget!")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Update Data Failed!", {position:"bottom-center"})
        })
    }

    //DATA
    addFeature=(data)=>{
        this.setState({
            feature:update(this.state.feature, {
                data:{$set:this.state.feature.data.concat([data])}
            })
        })
    }
    updateFeature=(data, idx)=>{
        this.setState({
            feature:update(this.state.feature, {
                data:{
                    [idx]:{$set:data}
                }
            })
        }, ()=>{
            this.toggleEdit()
        })
    }

    //ACTIONS
    toggleTambah=()=>{
        this.setState({
            tambah_feature:update(this.state.tambah_feature, {
                is_open:{$set:!this.state.tambah_feature.is_open}
            })
        })
    }
    toggleEdit=(open=false, data={}, idx="")=>{
        this.setState({
            edit_feature:{
                is_open:open,
                index:idx,
                data:data
            }
        })
    }
    toggleConfirmHapus=(idx)=>{
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
                const data=this.state.feature.data.filter((f, i)=>i!==idx)
                this.setState({
                    feature:update(this.state.feature, {
                        data:{$set:data}
                    })
                })
            }
        })
    }

    render(){
        const {feature, tambah_feature, edit_feature}=this.state
        
        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Fitur Kolom</h4>
                        </div>
                    </div>
                    <Formik
                        enableReinitialize
                        initialValues={feature}
                        onSubmit={(values, actions)=>this.updateWidget(values, actions)}
                        validationSchema={
                            yup.object().shape({
                                title:yup.string().required(),
                                sub_title:yup.string().required(),
                                data:yup.array().optional()
                            })
                        }
                    >
                        {formik=>(
                            <form className="row" onSubmit={formik.handleSubmit}>
                                <div className="col-md-6 mx-auto">
                                    <div class="card">
                                        <div class="card-body">
                                            <div className="row mb-4">
                                                <div className="col-md-5 mx-auto">
                                                    <div class="row mb-3">
                                                        <label for="exampleInputUsername2" class="col-sm-3 col-form-label">Title</label>
                                                        <div class="col-sm-9">
                                                            <input 
                                                                type="text" 
                                                                className="form-control"
                                                                name="title"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.title}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div class="row mb-3">
                                                        <label for="exampleInputUsername2" class="col-sm-3 col-form-label">Sub Title</label>
                                                        <div class="col-sm-9">
                                                            <input 
                                                                type="text" 
                                                                className="form-control"
                                                                name="sub_title"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.sub_title}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <label className="my-1 me-2" for="country">List Fitur</label>
                                                <div className="d-flex mb-3">
                                                    <button
                                                        type="button" 
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={e=>this.toggleTambah()}
                                                    >
                                                        <FiPlus/> Tambah
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="table-responsive">
                                                <table class="table table-custom">
                                                    <thead>
                                                        <tr>
                                                            <th width="50">#</th>
                                                            <th>Judul</th>
                                                            <th>Gambar</th>
                                                            <th width="50"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formik.values.data.map((list, idx)=>(
                                                            <tr key={idx}>
                                                                <td>{idx+1}</td>
                                                                <td>{list.judul}</td>
                                                                <td>
                                                                    <a href={BASE_URL+"/storage/"+list.gambar} target="_blank" style={{width:"150px", maxHeight:"60px", overflow:"hidden"}}>
                                                                        <img 
                                                                            src={BASE_URL+"/storage/"+list.gambar} 
                                                                            className="img-fluid"
                                                                            style={{
                                                                                maxWidth:"auto",
                                                                                maxHeight:"60px",
                                                                                borderRadius:"0",
                                                                                width:"auto",
                                                                                height:"auto"
                                                                            }}
                                                                        />
                                                                    </a>
                                                                </td>
                                                                <td>
                                                                    <button type="button" className="btn btn-link p-0" onClick={()=>this.toggleEdit(true, list, idx)}>
                                                                        <FiEdit className="icon"/>
                                                                    </button>
                                                                    <button type="button" className="btn btn-link link-danger ms-2 p-0" onClick={()=>this.toggleConfirmHapus(idx)}>
                                                                        <FiTrash2 className="icon"/>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <div className="d-flex">
                                                <button type="submit" className="btn btn-primary mx-auto" disabled={formik.isSubmitting||!(formik.isValid)}>Save Changes</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </Formik>
                </Layout>

                <ModalTambah
                    data={tambah_feature}
                    addFeature={this.addFeature}
                    hideModal={this.toggleTambah}
                />
                
                <ModalEdit
                    data={edit_feature}
                    updateFeature={this.updateFeature}
                    hideModal={this.toggleEdit}
                />
            </>
        )
    }
}

const ModalTambah=({data, addFeature, hideModal})=>{
    return (
        <Modal show={data.is_open} onHide={hideModal} backdrop="static" size="sm" scrollable>
            <Formik
                initialValues={{
                    judul:"",
                    gambar:"",
                    deksripsi:""
                }}
                validationSchema={
                    yup.object().shape({
                        judul:yup.string().required(),
                        gambar:yup.string().required(),
                        deskripsi:yup.string().required()
                    })
                }
                onSubmit={(values, actions)=>{
                    addFeature(values)
                    hideModal()
                }}
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Tambah Feature</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2 d-flex flex-column">
                                <label className="my-1 me-2" for="country">Gambar</label>
                                <ButtonUpload
                                    onSuccess={(data)=>formik.setFieldValue("gambar", data.data.file)}
                                    accept=".jpg, .png"
                                >
                                    <div className="btn btn-secondary btn-sm btn-icon-text cursor-pointer">
                                        <FiUpload className="icon"/> Upload
                                    </div>
                                </ButtonUpload>
                                <div className="mt-2">
                                    {formik.values.gambar!=""&&
                                        <img src={BASE_URL+"/storage/"+formik.values.gambar} className="img-fluid"/>
                                    }
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Judul</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="judul"
                                    onChange={formik.handleChange}
                                    value={formik.values.judul}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Deskripsi</label>
                                <textarea
                                    className="form-control"
                                    name="deskripsi"
                                    onChange={formik.handleChange}
                                    value={formik.values.deskripsi}
                                    rows={3}
                                />
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="mt-3 border-top pt-2">
                            <button 
                                type="button" 
                                className="btn btn-link text-gray me-auto" 
                                onClick={hideModal}
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

const ModalEdit=({data, updateFeature, hideModal})=>{
    return (
        <Modal show={data.is_open} onHide={hideModal} backdrop="static" size="sm" scrollable>
            <Formik
                initialValues={data.data}
                validationSchema={
                    yup.object().shape({
                        judul:yup.string().required(),
                        gambar:yup.string().required(),
                        deskripsi:yup.string().required()
                    })
                }
                onSubmit={(values, actions)=>{
                    updateFeature(values, data.index)
                    hideModal()
                }}
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit Feature</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Judul</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="judul"
                                    onChange={formik.handleChange}
                                    value={formik.values.judul}
                                />
                            </div>
                            <div className="mb-2 d-flex flex-column">
                                <label className="my-1 me-2" for="country">Gambar</label>
                                <ButtonUpload
                                    onSuccess={(data)=>formik.setFieldValue("gambar", data.data.file)}
                                    accept=".jpg, .png"
                                >
                                    <div className="btn btn-secondary btn-sm btn-icon-text cursor-pointer">
                                        <FiUpload className="icon"/> Upload
                                    </div>
                                </ButtonUpload>
                                <div className="mt-2">
                                    {formik.values.gambar!=""&&
                                        <img src={BASE_URL+"/storage/"+formik.values.gambar} className="img-fluid"/>
                                    }
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Deskripsi</label>
                                <textarea
                                    className="form-control"
                                    name="deskripsi"
                                    onChange={formik.handleChange}
                                    value={formik.values.deskripsi}
                                    rows={3}
                                />
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="mt-3 border-top pt-2">
                            <button 
                                type="button" 
                                className="btn btn-link text-gray me-auto" 
                                onClick={()=>hideModal()}
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

export default withAuth(Index)