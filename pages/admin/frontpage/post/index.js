import React, { useContext } from "react"
import classNames from "classnames"
import update from "immutability-helper"
import Layout from "../../../../component/layout"
import withAuth from "../../../../component/hoc/auth"
import { useTable, useBlockLayout, useResizeColumns } from 'react-table'
import useMouseDelta from "../../../../component/hook/size"
import useSize from "../../../../component/hook/size"
import { FixedSizeGrid, FixedSizeList } from "react-window"
import { FiChevronLeft, FiChevronRight, FiEdit, FiPlus, FiTrash2, FiUpload } from "react-icons/fi"
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
import Link from "next/link"

const MySwal=withReactContent(swal)


class Index extends React.Component{
    state={
        posts:{
            q:"",
            data:[],
            page:1,
            per_page:15,
            last_page:0,
            is_loading:false
        }
    }

    componentDidMount=()=>{
        this.fetchPost()
    }

    //REQUEST, MUTABLE
    request={
        getsPost:async(params)=>{
            return await api(access_token()).get("/frontpage_admin/post", {
                params:params
            })
            .then(res=>res.data)
        },
        deletePost:async(post_id)=>{
            return await api(access_token()).delete("/frontpage_admin/post/"+post_id)
            .then(res=>res.data)
        }
    }
    fetchPost=async()=>{
        const {posts}=this.state
        const params={
            q:posts.q,
            per_page:posts.per_page,
            page:posts.page
        }

        this.setLoading(true)
        await this.request.getsPost(params)
        .then(data=>{
            this.setState({
                posts:update(this.state.posts, {
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
    deletePost=async(post_id)=>{
        await this.request.deletePost(post_id)
        .then(data=>{
            this.fetchPost()
            toast.warn("Post dihapus!")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Delete Data Failed!", {position:"bottom-center"})
        })
    }

    //TABLE
    setLoading=loading=>{
        this.setState({
            posts:update(this.state.posts, {
                is_loading:{$set:loading}
            })
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            posts:update(this.state.posts, {
                per_page:{$set:target.value},
                page:{$set:1}
            })
        }, ()=>{
            this.fetchPost()
        })
    }
    goToPage=page=>{
        this.setState({
            posts:update(this.state.posts, {
                page:{$set:page}
            })
        }, ()=>{
            this.fetchPost()
        })
    }
    typeFilter=e=>{
        const target=e.target

        this.setState({
            posts:update(this.state.posts, {
                page:{$set:1},
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            switch(target.name){
                case "q":
                    if(this.timeout) clearTimeout(this.timeout)
                    this.timeout=setTimeout(()=>{
                        this.fetchPost()
                    }, 500);
                break
                case "status":
                case "role":
                    this.fetchPost()
                break
            }
        })
    }
    timeout=0

    //ACTIONS
    toggleConfirmHapus=(data)=>{
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
                this.deletePost(data.id_frontpage)
            }
        })
    }


    render(){
        const {posts}=this.state
        
        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Posts Frontpage</h4>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6 mx-auto">
                            <div class="card">
                                <div class="card-body">
                                    <Table 
                                        data={posts}
                                        setPerPage={this.setPerPage}
                                        goToPage={this.goToPage}
                                        typeFilter={this.typeFilter}
                                        toggleConfirmHapus={this.toggleConfirmHapus}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
            </>
        )
    }
}

const Table=({data, setPerPage, goToPage, typeFilter, toggleConfirmHapus})=>{
    return (
        <>
            <div className="d-flex mb-3 mt-3">
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
                            <th className="">Judul</th>
                            <th className="">Gambar</th>
                            <th className="">Kategori</th>
                            <th className="" width="50"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {!data.is_loading?
                            <>
                                {data.data.map((list, idx)=>(
                                    <tr key={list}>
                                            <td className="align-middle">{(idx+1)+((data.page-1)*data.per_page)}</td>
                                            <td className="py-1">{list.data.title}</td>
                                            <td>
                                                <a href={BASE_URL+"/storage/"+list.data.featured_image} target="_blank" style={{width:"150px", maxHeight:"60px", overflow:"hidden"}}>
                                                    <img 
                                                        src={BASE_URL+"/storage/"+list.data.featured_image} 
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
                                            <td>{list.data.kategori.join(", ")}</td>
                                            <td className="text-nowrap p-1 align-middle">
                                                <Link href={`/admin/frontpage/post/edit?id=${list.id_frontpage}`} className="btn btn-link p-0">
                                                    <FiEdit className="icon"/>
                                                </Link>
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

export default withAuth(Index)