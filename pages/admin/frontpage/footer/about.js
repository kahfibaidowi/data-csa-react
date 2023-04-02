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
        type:"footer_about",
        footer:{
            title:"",
            show_title:true,
            content:""
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


    render(){
        const {footer}=this.state
        
        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Footer About</h4>
                        </div>
                    </div>
                    <Formik
                        enableReinitialize
                        initialValues={footer}
                        onSubmit={(values, actions)=>this.updateWidget(values, actions)}
                        validationSchema={
                            yup.object().shape({
                                title:yup.string().required(),
                                show_title:yup.bool().required(),
                                content:yup.string().required()
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
                                                        <div class="col-sm-3 col-form-label"></div>
                                                        <div class="col-sm-9">
                                                            <div class="form-check form-check-inline">
                                                                <input 
                                                                    type="checkbox" 
                                                                    class="form-check-input" 
                                                                    id="checkInlineChecked" 
                                                                    checked={formik.values.show_title}
                                                                    onChange={e=>formik.setFieldValue("show_title", !formik.values.show_title)}
                                                                />
                                                                <label class="form-check-label" for="checkInlineChecked">
                                                                    Tampilkan Title
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row mb-3">
                                                        <label for="exampleInputUsername2" class="col-sm-3 col-form-label">Content</label>
                                                        <div class="col-sm-9">
                                                            <textarea
                                                                className="form-control"
                                                                name="content"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.content}
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </div>
                                        <div className="card-footer">
                                            <div className="d-flex">
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-primary mx-auto"
                                                    disabled={formik.isSubmitting||!(formik.isValid)}
                                                >Save Changes</button>
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