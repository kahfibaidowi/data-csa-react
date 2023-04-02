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
import Router, { withRouter } from "next/router"
import { toast } from "react-toastify"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import dynamic from "next/dynamic"

const ReactQuill=dynamic(()=>import("react-quill"), {ssr:false})

const MySwal=withReactContent(swal)


class Index extends React.Component{
    state={
        post_id:"",
        type:"post",
        kategori:["mboh", "2", "tidak tau"],
        edit_post:{
            title:"",
            kategori:[],
            featured_image:"",
            content:""
        }
    }

    componentDidMount=()=>{
        this.setState({
            post_id:this.props.router.query.id
        }, ()=>{
            this.fetchPost()
        })
        this.fetchKategori()
    }

    //REQUEST, MUTABLE
    request={
        getsKategori:async()=>{
            return await api(access_token()).get("/frontpage_admin/post_kategori")
            .then(res=>res.data)
        },
        getPost:async(post_id)=>{
            return await api(access_token()).get("/frontpage_admin/post/"+post_id)
            .then(res=>res.data)
        },
        updatePost:async(params)=>{
            return await api(access_token()).put("/frontpage_admin/post/"+params.id_frontpage, params)
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
    fetchPost=async()=>{
        await this.request.getPost(this.state.post_id)
        .then(data=>{
            this.setState({
                edit_post:data.data.data
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
    updatePost=async(values, actions)=>{
        const params=Object.assign({}, values, {
            id_frontpage:this.state.post_id
        })

        await this.request.updatePost(params)
        .then(data=>{
            this.fetchKategori()
            toast.success("Berhasil mengubah post!")
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
        const {edit_post}=this.state
        
        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Tambah Post</h4>
                        </div>
                    </div>
                    <Formik
                        initialValues={edit_post}
                        enableReinitialize
                        validationSchema={
                            yup.object().shape({
                                title:yup.string().required(),
                                kategori:yup.array().optional(),
                                featured_image:yup.string().required(),
                                content:yup.string().required()
                            })
                        }
                        onSubmit={this.updatePost}
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
                                                    disabled={formik.isSubmitting||!(formik.isValid)}
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

export default withAuth(withRouter(Index))