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
        type:"footer_menu",
        footer:{
            title:"",
            data:[]
        },
        tambah_menu:{
            is_open:false
        },
        edit_menu:{
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
                footer:data.data.data
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
    addMenu=(data)=>{
        this.setState({
            footer:update(this.state.footer, {
                data:{$set:this.state.footer.data.concat([data])}
            })
        })
    }
    updateMenu=(data, idx)=>{
        this.setState({
            footer:update(this.state.footer, {
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
            tambah_menu:update(this.state.tambah_menu, {
                is_open:{$set:!this.state.tambah_menu.is_open}
            })
        })
    }
    toggleEdit=(open=false, data={}, idx="")=>{
        this.setState({
            edit_menu:{
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
                const data=this.state.footer.data.filter((f, i)=>i!==idx)
                this.setState({
                    footer:update(this.state.footer, {
                        data:{$set:data}
                    })
                })
            }
        })
    }

    render(){
        const {footer, tambah_menu, edit_menu}=this.state
        
        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Footer Menu</h4>
                        </div>
                    </div>
                    <Formik
                        enableReinitialize
                        initialValues={footer}
                        onSubmit={(values, actions)=>this.updateWidget(values, actions)}
                        validationSchema={
                            yup.object().shape({
                                title:yup.string().required(),
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
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <label className="my-1 me-2" for="country">List Menu</label>
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
                                                            <th>Text</th>
                                                            <th>Link To</th>
                                                            <th width="50"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formik.values.data.map((list, idx)=>(
                                                            <tr key={idx}>
                                                                <td>{idx+1}</td>
                                                                <td>{list.text}</td>
                                                                <td>
                                                                    <a className="btn btn-link link-primary p-0" href={list.link_to} target="_blank">{list.link_to}</a>
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
                    data={tambah_menu}
                    addMenu={this.addMenu}
                    hideModal={this.toggleTambah}
                />
                
                <ModalEdit
                    data={edit_menu}
                    updateMenu={this.updateMenu}
                    hideModal={this.toggleEdit}
                />
            </>
        )
    }
}

const ModalTambah=({data, addMenu, hideModal})=>{
    return (
        <Modal show={data.is_open} onHide={hideModal} backdrop="static" size="sm" scrollable>
            <Formik
                initialValues={{
                    text:"",
                    link_to:""
                }}
                validationSchema={
                    yup.object().shape({
                        text:yup.string().required(),
                        link_to:yup.string().required()
                    })
                }
                onSubmit={(values, actions)=>{
                    addMenu(values)
                    hideModal()
                }}
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Tambah Menu</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Text</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="text"
                                    onChange={formik.handleChange}
                                    value={formik.values.text}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Link To</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="link_to"
                                    onChange={formik.handleChange}
                                    value={formik.values.link_to}
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

const ModalEdit=({data, updateMenu, hideModal})=>{
    return (
        <Modal show={data.is_open} onHide={hideModal} backdrop="static" size="sm" scrollable>
            <Formik
                initialValues={data.data}
                validationSchema={
                    yup.object().shape({
                        text:yup.string().required(),
                        link_to:yup.string().required()
                    })
                }
                onSubmit={(values, actions)=>{
                    updateMenu(values, data.index)
                    hideModal()
                }}
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit Menu</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Text</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="text"
                                    onChange={formik.handleChange}
                                    value={formik.values.text}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2" for="country">Link To</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="link_to"
                                    onChange={formik.handleChange}
                                    value={formik.values.link_to}
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