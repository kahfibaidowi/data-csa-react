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
import { Formik } from "formik"
import * as yup from "yup"


const MySwal=withReactContent(swal)

class Users extends React.Component{
    state={
        users:{
            data:[],
            per_page:15,
            last_page:0,
            page:1,
            q:"",
            role:"",
            status:"",
            is_loading:false
        },
        tambah_user:{
            is_open:false,
            user:{
                username:"",
                nama_lengkap:"",
                password:"",
                role:"admin",
                avatar_url:"",
                status:"active"
            }
        },
        edit_user:{
            is_open:false,
            user:{}
        }
    }

    componentDidMount=()=>{
        this.fetchUsers()
    }

    //REQUEST, QUERY, MUTATION
    request={
        apiGetsUser:async(params)=>{
            return await api(access_token()).get("/user", {
                params:params
            })
            .then(res=>res.data)
        },
        apiAddUser:async(params)=>{
            return await api(access_token()).post("/user", params).then(res=>res.data)
        },
        apiUploadAvatar:async file=>{
            let formData=new FormData()
            formData.append("image", file)
    
            return await api(access_token()).post("/file/upload_avatar", formData, {
                headers:{
                    'content-type':"multipart/form-data"
                }
            })
            .then(res=>res.data)
        },
        apiDeleteUser:async(id)=>{
            return await api(access_token()).delete(`/user/${id}`).then(res=>res.data)
        },
        apiUpdateUser:async(params)=>{
            return await api(access_token()).put(`/user/${params.id_user}`, params).then(res=>res.data)
        }
    }
    //--data
    fetchUsers=async()=>{
        const {data, ...params}=this.state.users

        this.setLoading(true)
        await this.request.apiGetsUser(params)
        .then(data=>{
            this.setState({
                users:update(this.state.users, {
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
    addUser=async(values, actions)=>{
        await this.request.apiAddUser(values)
        .then(data=>{
            this.fetchUsers()
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
    updateUser=async(values, actions)=>{
        await this.request.apiUpdateUser(values)
        .then(data=>{
            this.fetchUsers()
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
    deleteUser=async(id)=>{
        await this.request.apiDeleteUser(id)
        .then(data=>{
            this.fetchUsers()
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
            users:update(this.state.users, {
                is_loading:{$set:loading}
            })
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            users:update(this.state.users, {
                per_page:{$set:target.value},
                page:{$set:1}
            })
        }, ()=>{
            this.fetchUsers()
        })
    }
    goToPage=page=>{
        this.setState({
            users:update(this.state.users, {
                page:{$set:page}
            })
        }, ()=>{
            this.fetchUsers()
        })
    }
    typeFilter=e=>{
        const target=e.target

        this.setState({
            users:update(this.state.users, {
                page:{$set:1},
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            switch(target.name){
                case "q":
                    if(this.timeout) clearTimeout(this.timeout)
                    this.timeout=setTimeout(()=>{
                        this.fetchUsers()
                    }, 500);
                break
                case "status":
                case "role":
                    this.fetchUsers()
                break
            }
        })
    }
    timeout=0

    //DATA ACTIONS
    toggleModalTambah=()=>{
        this.setState({
            tambah_user:{
                is_open:!this.state.tambah_user.is_open,
                user:{
                    username:"",
                    nama_lengkap:"",
                    password:"",
                    role:"admin",
                    avatar_url:"",
                    status:"active"
                }
            }
        })
    }
    toggleModalEdit=(list={}, show=false)=>{
        this.setState({
            edit_user:{
                is_open:show,
                user:Object.assign({}, list, {
                    password:""
                })
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
                this.deleteUser(list.id_user)
            }
        })
    }


    //RENDER
    render(){
        const {users, tambah_user, edit_user}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Master Users</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                            <button 
                                type="button" 
                                class="btn btn-primary btn-icon-text mb-2 mb-md-0"
                                onClick={this.toggleModalTambah}
                            >
                                <FiPlus className="btn-icon-prepend"/>
                                Tambah User
                            </button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <Table 
                                        data={users}
                                        setPerPage={this.setPerPage}
                                        goToPage={this.goToPage}
                                        toggleConfirmHapus={this.toggleConfirmHapus}
                                        toggleModalEdit={this.toggleModalEdit}
                                        typeFilter={this.typeFilter}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
    
                <ModalTambah
                    data={tambah_user}
                    toggleModalTambah={this.toggleModalTambah}
                    addUser={this.addUser}
                    request={this.request}
                />
    
                <ModalEdit
                    data={edit_user}
                    toggleModalEdit={this.toggleModalEdit}
                    updateUser={this.updateUser}
                    request={this.request}
                />
            </>
        )
    }
}

const Table=({data, setPerPage, goToPage, toggleConfirmHapus, toggleModalEdit, typeFilter})=>{
    
    const userStatus=status=>{
        switch(status){
            case "active":
                return <span className="badge bg-success">Aktif</span>
            break;
            case "suspend":
                return <span className="badge bg-danger">Disuspend</span>
            break;
        }
    }

    //filter
    const role_options=[
        {label:"Semua Role", value:""},
        {label:"Admin", value:"admin"},
        {label:"Kementrian Pertanian", value:"kementan"}
    ]
    const status_options=[
        {label:"Semua Status", value:""},
        {label:"Aktif", value:"active"},
        {label:"Disuspend", value:"suspend"}
    ]

    return (
        <>
            <div className="d-flex mb-3 mt-3">
                <div style={{width:"200px"}} className="me-2">
                    <Select
                        options={role_options}
                        value={role_options.find(f=>f.value==data.role)}
                        onChange={e=>{
                            typeFilter({target:{name:"role", value:e.value}})
                        }}
                        placeholder="Pilih Role"
                    />
                </div>
                <div style={{width:"200px"}} className="me-2">
                <Select
                        options={status_options}
                        value={status_options.find(f=>f.value==data.status)}
                        onChange={e=>{
                            typeFilter({target:{name:"status", value:e.value}})
                        }}
                        placeholder="Pilih Status"
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
                            <th className="">User/Pengguna</th>
                            <th className="">Username</th>
                            <th className="" width="100">Role</th>
                            <th className="" width="150">Status</th>
                            <th className="" width="50"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {!data.is_loading?
                            <>
                                {data.data.map((list, idx)=>(
                                    <tr key={list}>
                                            <td className="align-middle">{(idx+1)+((data.page-1)*data.per_page)}</td>
                                            <td className="py-1">
                                                <div className="d-flex align-items-center">
                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar text-secondary rounded-3 bg-gray-300">
                                                            <Avatar 
                                                                data={list}
                                                            />
                                                        </span>
                                                    </div>
                                                    <span className="fw-semibold text-capitalize ms-2">{list.nama_lengkap}</span>
                                                </div>
                                            </td>
                                            <td>{list.username}</td>
                                            <td>{list.role}</td>
                                            <td>{userStatus(list.status)}</td>
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

const ModalTambah=({data, toggleModalTambah, addUser, request})=>{
    
    return (
        <Modal show={data.is_open} onHide={toggleModalTambah} backdrop="static" size="sm">
            <Formik
                initialValues={data.user}
                onSubmit={addUser}
                validationSchema={
                    yup.object().shape({
                        username:yup.string().required(),
                        nama_lengkap:yup.string().required(),
                        password:yup.string().min(5).required(),
                        role:yup.string().required(),
                        status:yup.string().required()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Tambah User</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Role/Level</label>
                                <select 
                                    className="form-select" 
                                    name="role"
                                    onChange={formik.handleChange}
                                    value={formik.values.role}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="kementan">Kementrian Pertanian</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Username</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="username"
                                    onChange={formik.handleChange}
                                    value={formik.values.username}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="nama_lengkap"
                                    onChange={formik.handleChange}
                                    value={formik.values.nama_lengkap}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Password</label>
                                <input 
                                    type="password" 
                                    className="form-control"
                                    name="password"
                                    onChange={formik.handleChange}
                                    value={formik.values.password}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Avatar/Foto</label>
                                <div className="d-flex flex-column">
                                    <div>
                                        <label>
                                            <div className="btn btn-secondary btn-icon-text cursor-pointer">
                                                <FiUpload className="icon"/> Upload
                                            </div>
                                            <input
                                                type="file"
                                                style={{display:"none"}}
                                                accept=".jpg, .png"
                                                onChange={e=>{
                                                    request.apiUploadAvatar(e.target.files[0])
                                                    .then(data=>{
                                                        formik.setFieldValue("avatar_url", data.data.file)
                                                    })
                                                    .catch(err=>{
                                                        if(err.response.status===401){
                                                            localStorage.removeItem("login_data")
                                                            Router.push("/login")
                                                        }
                                                        toast.error("Upload File Failed!", {position:"bottom-center"})
                                                    })
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-icon ms-2 px-3"
                                            onClick={e=>formik.setFieldValue("avatar_url", "")}
                                        >
                                            <i><FiTrash2/></i>
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        <span className="avatar avatar-lg text-secondary rounded-circle bg-gray-300">
                                            <Avatar 
                                                data={formik.values}
                                                size="lg"
                                                circle
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Status</label>
                                <select 
                                    className="form-select" 
                                    name="status"
                                    onChange={formik.handleChange}
                                    value={formik.values.status}
                                >
                                    <option value="active">Aktif</option>
                                    <option value="suspend">Disuspend</option>
                                </select>
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

const ModalEdit=({data, toggleModalEdit, updateUser, request})=>{
    
    return (
        <Modal show={data.is_open} onHide={toggleModalEdit} backdrop="static" size="sm">
            <Formik
                initialValues={data.user}
                onSubmit={updateUser}
                validationSchema={
                    yup.object().shape({
                        username:yup.string().required(),
                        nama_lengkap:yup.string().required(),
                        password:yup.string().optional(),
                        role:yup.string().required(),
                        status:yup.string().required()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit User</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Username</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="username"
                                    onChange={formik.handleChange}
                                    value={formik.values.username}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="nama_lengkap"
                                    onChange={formik.handleChange}
                                    value={formik.values.nama_lengkap}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Password</label>
                                <input 
                                    type="password" 
                                    className="form-control"
                                    name="password"
                                    onChange={formik.handleChange}
                                    value={formik.values.password}
                                />
                                <small className="form-text text-muted">Kosongkan apabila tidak dirubah.</small>
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Avatar/Foto</label>
                                <div className="d-flex flex-column">
                                    <div>
                                        <label>
                                            <div className="btn btn-secondary btn-icon-text cursor-pointer">
                                                <FiUpload className="icon"/> Upload
                                            </div>
                                            <input
                                                type="file"
                                                style={{display:"none"}}
                                                accept=".jpg, .png"
                                                onChange={e=>{
                                                    request.apiUploadAvatar(e.target.files[0])
                                                    .then(data=>{
                                                        formik.setFieldValue("avatar_url", data.data.file)
                                                    })
                                                    .catch(err=>{
                                                        if(err.response.status===401){
                                                            localStorage.removeItem("login_data")
                                                            Router.push("/login")
                                                        }
                                                        toast.error("Upload File Failed!", {position:"bottom-center"})
                                                    })
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-icon ms-2 px-3"
                                            onClick={e=>formik.setFieldValue("avatar_url", "")}
                                        >
                                            <i><FiTrash2/></i>
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        <span className="avatar avatar-lg text-secondary rounded-circle bg-gray-300">
                                            <Avatar 
                                                data={formik.values}
                                                circle
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Status</label>
                                <select 
                                    className="form-select" 
                                    name="status"
                                    onChange={formik.handleChange}
                                    value={formik.values.status}
                                >
                                    <option value="active">Aktif</option>
                                    <option value="suspend">Disuspend</option>
                                </select>
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