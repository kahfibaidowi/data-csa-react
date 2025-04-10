import { Formik } from "formik"
import React from "react"
import { FiUpload } from "react-icons/fi"
import * as ExcelJS from "exceljs"
import { access_token, isNull, readFile } from "../../config/config"
import { api } from "../../config/api"
import Router from "next/router"
import { toast } from "react-toastify"


class Page extends React.Component{
    state={
        input:{
            date:2025,
            data:[]
        }
    }

    request={
        apiGetsCurahHujan:async(params)=>{
            this.abortGetsCurahHujan.abort()
            this.abortGetsCurahHujan=new AbortController()
            
            return await api(access_token()).get("/curah_hujan/type/treeview", {
                params:{
                    tahun:params.tahun
                },
                signal:this.abortGetsCurahHujan.signal
            })
            .then(res=>res.data)
        },
        apiUpdateCurahHujan:async(params)=>{
            return await api(access_token()).post('/curah_hujan', params).then(res=>res.data)
        },
        apiUpdateCurahHujanMultiple:async(params)=>{
            return await api(access_token()).post("/curah_hujan/type/multiple/chunk", params).then(res=>res.data)
        }
    }

    updateCurahHujanMultiple=async(values, actions)=>{
        const data=values.data

        await this.request.apiUpdateCurahHujanMultiple({
            tahun:this.state.input.date,
            data:data
        })
        .then(data=>{
            actions.setFieldValue("data", [])
            toast.success("sukses!")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            this.setState({
                import_template:update(this.state.import_template, {
                    is_submitting:{$set:false}
                })
            })
                
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Import Data Failed! ", {position:"bottom-center"})
        })
    }

    generateImportedExcel=async(formik, file)=>{

        const workBook=new ExcelJS.Workbook()
        const buffer=await readFile(file)

        const file_excel=await workBook.xlsx.load(buffer)
        const workSheet=file_excel.getWorksheet(1)

        let data_excel=[]
        let imported=[]
        let start_col=6

        workSheet.eachRow((row, row_num)=>{
            if(row_num>1){
                if(row_num%2==0 && !isNull(row.getCell(1).value)){
                    let found_ch=false
                    let col_ch=[]

                    for(var i=start_col; i<=41; i++){

                        if(!isNull(row.getCell(i).value) || !isNull(workSheet.getRow(row_num+1).getCell(i).value)){
                            found_ch=true
                        }

                        if(!isNull(row.getCell(i).value) && !isNull(workSheet.getRow(row_num+1).getCell(i).value)){
                            imported=imported.concat([
                                {
                                    id_region:row.getCell(1).value,
                                    tahun:formik.values.date,
                                    bulan:Math.floor((i-start_col)/3)+1,
                                    input_ke:((i-start_col)%3)+1,
                                    curah_hujan:row.getCell(i).value,
                                    curah_hujan_normal:workSheet.getRow(row_num+1).getCell(i).value
                                }
                            ])
                        }
                    }

                }
            }
        })

        formik.setFieldValue("data", imported)

        console.log(imported)
    }

    inputRef=React.createRef()

    render(){
        return (
            <>
                <Formik initialValues={this.state.input} onSubmit={this.updateCurahHujanMultiple}>
                    {formik=>(
                        <form onSubmit={formik.handleSubmit}>
                            <div className="mb-3">
                                <button className="btn btn-secondary" type="button" onClick={()=>this.inputRef.current.click()}>
                                    <FiUpload/> File Excel
                                </button>
                                <input
                                    ref={this.inputRef}
                                    type="file"
                                    name="file"
                                    onChange={e=>{
                                        this.generateImportedExcel(formik, e.target.files[0])
                                    }}
                                    style={{display:"none"}}
                                    accept=".xlsx"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="fw-bold">Jumlah Data : {formik.values.data.length}</label>
                            </div>
                            <div className="mb-3">
                                <button className="btn btn-primary" type="submit" disabled={formik.isSubmitting}>Import Chunks (1000 data)</button>
                            </div>
                            <span className="form-text">
                                <ol className="mt-4">
                                    <li>Halaman ini digunakan untuk import data curah hujan dengan metode chunk</li>
                                    <li><strong>Penting, Semua data pada tahun 2025 sebelumnya akan dihapus, digantikan data baru!</strong></li>
                                    <li>Digunakan pada tahun 2025</li>
                                    <li>Pilih file excel curah hujan dulu sebelum import data</li>
                                </ol>
                            </span>
                        </form>
                    )}
                </Formik>
            </>
        )
    }
}

export default Page