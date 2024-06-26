import { Formik } from "formik"
import React from "react"
import * as yup from "yup"
import {TfiArrowRight} from "react-icons/tfi"
import { toast } from "react-toastify"
import { api } from "../config/api"
import Router from "next/router"


export default function Login(props){
    //login
    const login_form={
        data:{
            username:"",
            password:"",
            remember:false
        },
        schema:yup.object().shape({
            username:yup.string().required(),
            password:yup.string().required()
        })
    }
    const login=async(values, actions)=>{
        await api().post("/auth/login", values)
        .then(res=>{
            localStorage.setItem("login_data", JSON.stringify(res.data.data))
            Router.push("/admin")
        })
        .catch(err=>{
            toast.error("Login Gagal!", {position:"bottom-center"})
        })
    }
    
    //return
    return (
        <div className="main-wrapper">
            <div className="page-wrapper full-page">
                <div className="page-content d-flex align-items-center justify-content-center">

                    <div className="row w-100 mx-0 auth-page">
                        <div className="col-md-8 col-xl-6 mx-auto">
                            <div className="card">
                                <div className="row">
                                    <div className="col-md-4 pe-md-0">
                                        <div className="auth-side-wrapper" style={{backgroundImage:"url(https://via.placeholder.com/219x452)"}}></div>
                                    </div>
                                    <div className="col-md-8 ps-md-0">
                                        <div className="auth-form-wrapper px-4 py-5">
                                            <a href="#" className="noble-ui-logo d-block mb-2">Login <span>EWS</span></a>
                                            <h5 className="text-muted fw-normal mb-4">Welcome back! Log in to your account.</h5>
                                            <Formik
                                                initialValues={login_form.data}
                                                validationSchema={login_form.schema}
                                                onSubmit={login}
                                            >
                                                {formik=>(
                                                    <form className="forms-sample" onSubmit={formik.handleSubmit}>
                                                        <div className="mb-3">
                                                            <label className="form-label">Username</label>
                                                            <input 
                                                                type="text" 
                                                                className="form-control"
                                                                placeholder="Username"
                                                                value={formik.values.username}
                                                                onChange={formik.handleChange}
                                                                name="username"
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Password</label>
                                                            <input 
                                                                type="password" 
                                                                className="form-control"
                                                                placeholder="Password"
                                                                value={formik.values.password}
                                                                onChange={formik.handleChange}
                                                                name="password"
                                                            />
                                                        </div>
                                                        <div className="form-check mb-3">
                                                            <input 
                                                                type="checkbox" 
                                                                className="form-check-input" 
                                                                id="authCheck"
                                                                checked={formik.values.remember}
                                                                onChange={()=>formik.setFieldValue("remember", !formik.values.remember)}
                                                            />
                                                            <label className="form-check-label" for="authCheck">Remember me</label>
                                                        </div>
                                                        <div>
                                                            <button 
                                                                className="btn btn-primary me-2 mb-2 mb-md-0 text-white"
                                                                type="submit"
                                                                disabled={formik.isSubmitting||!(formik.dirty&&formik.isValid)}
                                                            >
                                                                Login Sekarang <TfiArrowRight className="ms-1"/>
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </Formik>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}