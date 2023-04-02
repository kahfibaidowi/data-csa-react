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
        type:"pengaturan",
        footer:{
            title:"",
            description:"",
            logo:"",
            company:""
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
                            <h4 class="mb-3 mb-md-0">Pengaturan</h4>
                        </div>
                    </div>
                    <Formik
                        enableReinitialize
                        initialValues={footer}
                        onSubmit={(values, actions)=>this.updateWidget(values, actions)}
                        validationSchema={
                            yup.object().shape({
                                title:yup.string().required(),
                                description:yup.string().required(),
                                logo:yup.string().optional(),
                                company:yup.string().required()
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
                                                        <label for="exampleInputUsername2" class="col-sm-4 col-form-label">Title</label>
                                                        <div class="col-sm-8">
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
                                                        <label for="exampleInputUsername2" class="col-sm-4 col-form-label">Deskripsi</label>
                                                        <div class="col-sm-8">
                                                            <textarea
                                                                className="form-control"
                                                                name="description"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.description}
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div class="row mb-3">
                                                        <label class="col-sm-4 col-form-label">Logo</label>
                                                        <div class="col-sm-8">
                                                            <ButtonUpload
                                                                onSuccess={(data)=>formik.setFieldValue("logo", data.data.file)}
                                                                accept=".jpg, .png"
                                                            >
                                                                <div className="btn btn-secondary btn-sm btn-icon-text cursor-pointer">
                                                                    <FiUpload className="icon"/> Upload
                                                                </div>
                                                            </ButtonUpload>
                                                            <div className="mt-2">
                                                                {formik.values.logo!=""&&
                                                                    <img src={BASE_URL+"/storage/"+formik.values.logo} className="img-fluid"/>
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row mb-3">
                                                        <label for="exampleInputUsername2" class="col-sm-4 col-form-label">Perusahaan</label>
                                                        <div class="col-sm-8">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="company"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.company}
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