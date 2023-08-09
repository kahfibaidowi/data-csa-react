import React, { useContext } from "react"
import update from "immutability-helper"
import Layout from "../../../../component/layout"
import withAuth from "../../../../component/hoc/auth"
import { useTable, useBlockLayout, useResizeColumns } from 'react-table'
import useMouseDelta from "../../../../component/hook/size"
import useSize from "../../../../component/hook/size"
import { FixedSizeGrid, FixedSizeList } from "react-window"
import { FiAlertCircle, FiEdit, FiPlus, FiTrash2, FiUpload } from "react-icons/fi"
import { Formik } from "formik"
import * as yup from "yup"
import { Modal, Spinner } from "react-bootstrap"
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
        is_loading:false
    }

    componentDidMount=()=>{
    }

    //REQUEST, MUTABLE
    request={
        updateGeojson:async()=>{
            return await api(access_token()).put("/frontpage_admin/geojson_kecamatan")
            .then(res=>res.data)
        }
    }
    updateGeojson=async()=>{
        this.setState({is_loading:true})
        await this.request.updateGeojson()
        .then(data=>{
            this.setState({is_loading:false})
            toast.success("Berhasil mengupdate geojson!")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            this.setState({is_loading:false})
            toast.error("Update Data Failed!", {position:"bottom-center"})
        })
    }

    render(){
        const {is_loading}=this.state
        
        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Geojson Kecamatan</h4>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="alert alert-warning mb-4">
                                        <div className="d-flex align-items-center">
                                            <span><FiAlertCircle/></span>
                                            <span className="ms-2">setelah update region kecamatan/curah hujan, file geojson perlu diubah untuk menyinkronkan data!</span>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary mx-auto"
                                        disabled={is_loading}
                                        onClick={e=>this.updateGeojson()}
                                    >
                                        {!is_loading?
                                            <>Update Geojson Kecamatan</>
                                        :
                                            <div className="d-flex align-items-center"><Spinner animation="border" size="sm" className="me-2"/> Memproses Data...</div>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
            </>
        )
    }
}

export default withAuth(Index)