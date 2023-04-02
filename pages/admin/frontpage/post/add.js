import React, { useContext } from "react"
import update from "immutability-helper"
import Layout from "../../../../component/layout"
import withAuth from "../../../../component/hoc/auth"
import CreatableSelect from 'react-select/creatable'
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
import dynamic from "next/dynamic"

const ReactQuill=dynamic(()=>import("react-quill"), {ssr:false})

const MySwal=withReactContent(swal)


class Index extends React.Component{
    state={
        type:"post",
        kategori:[],
        tambah_post:{
            title:"",
            kategori:[],
            featured_image:"",
            content:""
        }
    }

    componentDidMount=()=>{
        this.fetchKategori()
    }

    //REQUEST, MUTABLE
    request={
        getsKategori:async()=>{
            return await api(access_token()).get("/frontpage_admin/post_kategori")
            .then(res=>res.data)
        },
        addPost:async(params)=>{
            return await api(access_token()).post("/frontpage_admin/post", params)
            .then(res=>res.data)
        }
    }
    fetchKategori=async()=>{
        await this.request.getsKategori()
        .then(data=>{
            this.setState({kategori:data.data})
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    addPost=async(values, actions)=>{
        const params=values

        await this.request.addPost(params)
        .then(data=>{
            actions.resetForm()
            this.fetchKategori()
            toast.success("Berhasil menambah post!")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Insert Data Failed!", {position:"bottom-center"})
        })
    }

    //DATA
    options_kategori=()=>{
        return this.state.kategori.map(k=>{
            return {
                label:k,
                value:k
            }
        })
    }
    values_kategori=(kategori)=>{
        return kategori.map(k=>{
            return {
                label:k,
                value:k
            }
        })
    }

    //ACTIONS

    render(){
        const {tambah_post}=this.state
        
        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Tambah Post</h4>
                        </div>
                    </div>
                    <Formik
                        initialValues={tambah_post}
                        validationSchema={
                            yup.object().shape({
                                title:yup.string().required(),
                                kategori:yup.array().optional(),
                                featured_image:yup.string().required(),
                                content:yup.string().required()
                            })
                        }
                        onSubmit={this.addPost}
                    >
                        {formik=>(
                            <form className="row" onSubmit={formik.handleSubmit}>
                                <div className="col-md-6 mx-auto">
                                    <div class="card">
                                        <div class="card-body">
                                            <div className="mb-3">
                                                <label className="my-1 me-2" for="country">Judul</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control"
                                                    name="title"
                                                    onChange={formik.handleChange}
                                                    value={formik.values.title}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="my-1 me-2" for="country">Kategori</label>
                                                <CreatableSelect
                                                    isMulti
                                                    options={this.options_kategori()}
                                                    onChange={(e)=>{
                                                        const value=e.map(v=>v.value)
                                                        formik.setFieldValue("kategori", value)
                                                    }}
                                                    value={this.values_kategori(formik.values.kategori)}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="my-1 me-2" for="country">Featured Image</label>
                                                <div className="d-flex flex-column">
                                                    <ButtonUpload
                                                        onSuccess={(data)=>formik.setFieldValue("featured_image", data.data.file)}
                                                        accept=".jpg, .png"
                                                    >
                                                        <div className="btn btn-secondary btn-sm btn-icon-text cursor-pointer">
                                                            <FiUpload className="icon"/> Upload
                                                        </div>
                                                    </ButtonUpload>
                                                    <div className="mt-2" style={{maxWidth:"250px"}}>
                                                        {formik.values.featured_image!=""&&
                                                            <img src={BASE_URL+"/storage/"+formik.values.featured_image} className="img-fluid"/>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="my-1 me-2" for="country">Konten/Isi</label>
                                                <div>
                                                    <ReactQuill 
                                                        theme="snow" 
                                                        value={formik.values.content} 
                                                        onChange={val=>formik.setFieldValue("content", val)}
                                                        className="editor-quill"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <div className="d-flex">
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-primary mx-auto"
                                                    disabled={formik.isSubmitting||!(formik.dirty&&formik.isValid)}
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </Formik>
                </Layout>
            </>
        )
    }
}

export default withAuth(Index)