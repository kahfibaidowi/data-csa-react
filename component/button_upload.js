import Router from 'next/router'
import React from 'react'
import { toast } from 'react-toastify'
import { api } from '../config/api'
import { access_token } from '../config/config'

export const ButtonUpload=({onSuccess, accept="", children})=>{
    const uploadFile=async(file)=>{
        let formData=new FormData()
        formData.append("dokumen", file)

        await api(access_token()).post("/file/upload", formData, {
            headers:{
                'content-type':"multipart/form-data"
            }
        })
        .then(res=>res.data)
        .then(data=>{
            onSuccess(data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Upload File Failed!", {position:"bottom-center"})
        })
    }

    return (
        <label>
            {children}
            <input
                type="file"
                style={{display:"none"}}
                accept={accept}
                onChange={e=>{
                    uploadFile(e.target.files[0])
                }}
            />
        </label>
    )
}
