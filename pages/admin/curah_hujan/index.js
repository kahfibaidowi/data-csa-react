import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Layout from "../../../component/layout"
import withAuth from "../../../component/hoc/auth"
import { Query, useMutation, useQuery, useQueryClient } from "react-query"
import { api } from "../../../config/api"
import { access_token, isNull, isUndefined, readFile } from "../../../config/config"
import { toast } from "react-toastify"
import Router from "next/router"
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp, FiDownload, FiEdit, FiExternalLink, FiMoreVertical, FiPlus, FiTrash, FiTrash2, FiUpload, FiX } from "react-icons/fi"
import Avatar from "../../../component/ui/avatar"
import { Dropdown, Modal, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import Select from 'react-select'
import CreatableSelect from "react-select/creatable"
import AsyncCreatableSelect from 'react-select/async-creatable'
import { Formik } from "formik"
import * as yup from "yup"
import NumberFormat from "react-number-format"
import VirtualTable, { VirtualTableContext } from "../../../component/ui/virtual_table"
import BaseTable, {AutoResizer, Column} from "react-base-table"
import DataGrid from 'react-data-grid'
import { read, utils, writeFile } from "xlsx"
import * as ExcelJS from "exceljs"
import { arrayMonths, sheetColumn } from "../../../config/helpers"
import FileSaver from "file-saver"
import _ from "underscore"


//MAIN
class CurahHujan extends React.Component{
    state={
        kabupaten_kota_form:[],
        provinsi_form:[],
        pulau_form:[],
        curah_hujan:{
            q:"",
            tahun:"",
            regency_id:"",
            province_id:"",
            pulau:"",
            data:[],
            is_loading:false
        },
        edit_curah_hujan:{
            is_open:false,
            curah_hujan:{}
        },
        download_template:{
            is_open:false
        },
        import_template:{
            is_open:false,
            data:{
                template:[],
                imported:[]
            },
            is_submitting:false
        }
    }


    //REQUEST DATA
    abortGetsCurahHujan=new AbortController()
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
            return await api(access_token()).post("/curah_hujan/type/multiple", params).then(res=>res.data)
        }
    }

    fetchCurahHujan=async()=>{
        const {data, ...params}=this.state.curah_hujan

        if(params.tahun.toString().trim()==""){
            this.setState({
                curah_hujan:update(this.state.curah_hujan, {
                    data:{$set:[]}
                })
            })
            return false
        }

        this.setLoading(true)
        await this.request.apiGetsCurahHujan(params)
        .then(data=>{
            const new_data=data.data.map(prov=>{
                return Object.assign({}, prov, {
                    kabupaten_kota:prov.kabupaten_kota.map(kab_kota=>{
                        return Object.assign({}, kab_kota, {
                            kecamatan:kab_kota.kecamatan.map(kec=>{
                                let curah_hujan=[]
                                this.months_year().map(month=>{
                                    //curah hujan
                                    for(var i=1; i<=3; i++){
                                        const find_curah_hujan=kec.curah_hujan.find(f=>(f.bulan.toString()==month.toString()&&f.input_ke.toString()==i.toString()))
                                        if(!isUndefined(find_curah_hujan)){
                                            curah_hujan=curah_hujan.concat([find_curah_hujan])
                                        }
                                        else{
                                            const data_curah_hujan={
                                                id_curah_hujan:null,
                                                id_region:kec.id_region,
                                                tahun:params.tahun,
                                                bulan:month,
                                                input_ke:i,
                                                curah_hujan:"",
                                                curah_hujan_normal:"",
                                                sifat:""
                                            }
                                            curah_hujan=curah_hujan.concat([data_curah_hujan])
                                        }
                                    }
                                })
        
                                return Object.assign({}, kec, {
                                    curah_hujan:curah_hujan
                                })
                            }),
                            expanded:false
                        })
                    }),
                    expanded:false
                })
            })
            
            this.setState({
                curah_hujan:update(this.state.curah_hujan, {
                    data:{$set:new_data},
                    is_loading:{$set:false}
                })
            })
        })
        .catch(err=>{
            if(err.name=="CanceledError"){
                toast.warn("Request Aborted!", {position:"bottom-center"})
            }
            else{
                if(err.response.status===401){
                    localStorage.removeItem("login_data")
                    Router.push("/login")
                }
                toast.error("Gets Data Failed!", {position:"bottom-center"})
                this.setLoading(false)
            }
        })
    }
    updateCurahHujan=async(values, actions)=>{
        await this.request.apiUpdateCurahHujan(values)
        .then(data=>{
            this.setState({
                curah_hujan:update(this.state.curah_hujan, {
                    data:{
                        [values.index_provinsi]:{
                            kabupaten_kota:{
                                [values.index_kabupaten_kota]:{
                                    kecamatan:{
                                        [values.index]:{
                                            curah_hujan:{
                                                [(Number(values.bulan)-1)*3+(Number(values.input_ke)-1)]:{$set:data.data}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
            })
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
    downloadTemplate=async(values, actions)=>{
        const {curah_hujan}=this.state

        actions.setSubmitting(true)

        let months=[]
        let rows_merge=[]
        let months_merge=[]
        arrayMonths.map((month, idx)=>{
            for(var i=1; i<=3; i++){
                months=months.concat([month.toString().trim()+" "+i])
            }
        })

        let aoa_curah_hujan=[
            [
                "district_id(dont edit)",
                "Provinsi",
                "Kabupaten/Kota",
                "Kecamatan",
                "Parameter",
                ...months
            ]
        ]
        
        let row=0;
        for(var i=0; i<curah_hujan.data.length; i++){
            if(values.pulau.toString().trim()!="" && curah_hujan.data[i].data.pulau.toString().trim()!=values.pulau.toString().trim()){
                continue
            }
            if(values.province_id.toString().trim()!="" && curah_hujan.data[i].id_region.toString().trim()!=values.province_id.toString().trim()){
                continue
            }

            for(var j=0; j<curah_hujan.data[i].kabupaten_kota.length; j++){
                if(values.regency_id.toString().trim()!="" && curah_hujan.data[i].kabupaten_kota[j].id_region.toString().trim()!=values.regency_id.toString().trim()){
                    continue
                }

                for(var k=0; k<curah_hujan.data[i].kabupaten_kota[j].kecamatan.length; k++){
                    aoa_curah_hujan=aoa_curah_hujan.concat([
                        [
                            curah_hujan.data[i].kabupaten_kota[j].kecamatan[k].id_region,
                            curah_hujan.data[i].region.toString().trim(),
                            curah_hujan.data[i].kabupaten_kota[j].region.toString().trim(),
                            curah_hujan.data[i].kabupaten_kota[j].kecamatan[k].region.toString().trim(),
                            "CH Prediksi",
                            ...Array.apply(null, Array(36)).map(String.prototype.valueOf, "")
                        ],
                        [
                            "",
                            "",
                            "",
                            "",
                            "CH Normal",
                            ...Array.apply(null, Array(36)).map((item, idx)=>curah_hujan.data[i].kabupaten_kota[j].kecamatan[k].curah_hujan[idx].curah_hujan_normal)
                        ]
                    ])

                    rows_merge=rows_merge.concat([
                        {s:{r:row*2+2, c:1}, e:{r:row*2+3, c:1}}
                    ])
                    row++
                }
            }
        }
        
        const workBook=new ExcelJS.Workbook()
        const workSheet1=workBook.addWorksheet("Sheet 1")
        workSheet1.addRows(aoa_curah_hujan)
        rows_merge.map(rm=>{
            workSheet1.mergeCells(`${sheetColumn(rm.s.c)}${rm.s.r}`, `${sheetColumn(rm.e.c)}${rm.e.r}`)
            workSheet1.mergeCells(`${sheetColumn(rm.s.c+1)}${rm.s.r}`, `${sheetColumn(rm.e.c+1)}${rm.e.r}`)
            workSheet1.mergeCells(`${sheetColumn(rm.s.c+2)}${rm.s.r}`, `${sheetColumn(rm.e.c+2)}${rm.e.r}`)
            workSheet1.mergeCells(`${sheetColumn(rm.s.c+3)}${rm.s.r}`, `${sheetColumn(rm.e.c+3)}${rm.e.r}`)
        })
        workSheet1.getColumn(1).hidden=true
        workSheet1.getRow(1).alignment={vertical:"middle"}
        workSheet1.getRow(1).font={bold:true}
        workSheet1.views=[
            {state:"frozen", ySplit:1, xSplit:5}
        ]


        await workBook.xlsx.writeBuffer()
        .then((data)=>{
            let today=new Date()
            let date=today.getFullYear()+
                (today.getMonth()+1).toString().padStart(2, "0")+
                today.getDate().toString().padStart(2, "0")+
                today.getHours().toString().padStart(2, "0")+
                today.getMinutes().toString().padStart(2, "0")+
                today.getSeconds().toString().padStart(2, "0")

            FileSaver.saveAs(new Blob([data]), date+"__template__curah-hujan.xlsx")

            this.toggleModalDownloadTemplate()
            actions.setSubmitting(false)
        })
        .catch(err => {
            toast.error("Failed to create generated spreadsheet!", {position:"bottom-center"})
            actions.setSubmitting(false)
        })
    }
    generateImportedExcel=async(file)=>{
        const {curah_hujan}=this.state

        if(curah_hujan.tahun.toString().trim()==""){
            toast.warn("Pilih tahun terlebih dahulu!", {position:"bottom-center"})
            return
        }

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
                        col_ch=col_ch.concat([
                            {
                                ch_prediksi:row.getCell(i).value,
                                ch_normal:workSheet.getRow(row_num+1).getCell(i).value
                            }
                        ])

                        if(!isNull(row.getCell(i).value) || !isNull(workSheet.getRow(row_num+1).getCell(i).value)){
                            found_ch=true
                        }

                        if(!isNull(row.getCell(i).value) && !isNull(workSheet.getRow(row_num+1).getCell(i).value)){
                            imported=imported.concat([
                                {
                                    id_region:row.getCell(1).value,
                                    tahun:curah_hujan.tahun,
                                    bulan:Math.floor((i-start_col)/3)+1,
                                    input_ke:((i-start_col)%3)+1,
                                    curah_hujan:row.getCell(i).value,
                                    curah_hujan_normal:workSheet.getRow(row_num+1).getCell(i).value
                                }
                            ])
                        }
                    }

                    if(found_ch){
                        data_excel=data_excel.concat([
                            {
                                id_region:row.getCell(1).value,
                                provinsi:row.getCell(2).value,
                                kabupaten_kota:row.getCell(3).value,
                                kecamatan:row.getCell(4).value,
                                curah_hujan:col_ch
                            }
                        ])
                    }
                }
            }
        })

        this.setState({
            import_template:{
                is_open:true,
                data:{
                    template:data_excel,
                    imported:imported
                },
                is_submitting:false
            }
        })
    }
    updateCurahHujanMultiple=async()=>{
        const {curah_hujan, import_template}=this.state
        this.setState({
            import_template:update(this.state.import_template, {
                is_submitting:{$set:true}
            })
        })

        await this.request.apiUpdateCurahHujanMultiple({
            tahun:curah_hujan.tahun,
            data:import_template.data.imported
        })
        .then(data=>{
            this.fetchCurahHujan()
            this.hideModalImportTemplate()
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

    //DATA
    months_year=()=>{
        let months=[]
        for(var i=1; i<=12; i++){
            months=months.concat([i])
        }

        return months
    }
    setLoading=loading=>{
        this.setState({
            curah_hujan:update(this.state.curah_hujan, {
                is_loading:{$set:loading}
            })
        })
    }
    typeFilter=e=>{
        const target=e.target

        this.setState({
            curah_hujan:update(this.state.curah_hujan, {
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            switch(target.name){
                case "tahun":
                    this.fetchCurahHujan()
                break
            }
        })
    }
    setCurahHujan=(curah_hujan, afterSet=()=>{})=>{
        this.setState({curah_hujan:curah_hujan}, afterSet)
    }
    setData=data=>{
        this.setState({
            curah_hujan:update(this.state.curah_hujan, {
                data:{$set:data}
            })
        })
    }

    //DATA ACTIONS
    toggleModalEdit=(idx_provinsi="", idx_kabupaten_kota="", idx="", list={}, show=false)=>{
        this.setState({
            edit_curah_hujan:{
                is_open:show,
                curah_hujan:show?Object.assign({}, list, {
                    index:idx,
                    index_provinsi:idx_provinsi,
                    index_kabupaten_kota:idx_kabupaten_kota
                }):{}
            }
        })
    }
    toggleModalDownloadTemplate=(is_open=false)=>{
        const {curah_hujan}=this.state

        if(curah_hujan.tahun.toString().trim()==""){
            toast.warn("Pilih tahun terlebih dahulu!", {position:"bottom-center"})
            return
        }
        if(curah_hujan.data.length==0 || curah_hujan.data.is_loading){
            toast.warn("Data Kecamatan tidak ditemukan!", {position:"bottom-center"})
            return
        }

        this.setState({
            download_template:{
                is_open:is_open
            }
        })
    }
    hideModalImportTemplate=()=>{
        this.setState({
            import_template:update(this.state.import_template, {
                is_open:{$set:false},
                is_submitting:{$set:false}
            })
        }, ()=>{
            setTimeout(() => {
                this.setState({
                    import_template:{
                        is_open:false,
                        data:{
                            template:[],
                            imported:[]
                        }
                    }
                })
            }, 150);
        })
    }


    //RENDER
    render(){
        const {curah_hujan, edit_curah_hujan, download_template, import_template}=this.state

        return (
            <>
                <Layout>
                    <div className="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 className="mb-3 mb-md-0">Data Curah Hujan</h4>
                        </div>
                        <div className="d-flex align-items-center flex-wrap text-nowrap">
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <Table 
                                        data={curah_hujan} 
                                        typeFilter={this.typeFilter}
                                        setData={this.setData}
                                        setCurahHujan={this.setCurahHujan}
                                        toggleModalEdit={this.toggleModalEdit}
                                        toggleModalDownloadTemplate={this.toggleModalDownloadTemplate}
                                        generateImportedExcel={this.generateImportedExcel}
                                        months_year={this.months_year}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
                
                <ModalEdit
                    data={edit_curah_hujan}
                    toggleModalEdit={this.toggleModalEdit}
                    updateCurahHujan={this.updateCurahHujan}
                />

                <ModalDownloadTemplate
                    data={download_template}
                    downloadTemplate={this.downloadTemplate}
                    onHide={this.toggleModalDownloadTemplate}
                />

                <ModalImportTemplate
                    data={import_template}
                    onHide={this.hideModalImportTemplate}
                    importTemplate={this.updateCurahHujanMultiple}
                />
            </>
        )
    }
}

//TABLE
const Table=({data, typeFilter, toggleModalEdit, setData, setCurahHujan, toggleModalDownloadTemplate, generateImportedExcel})=>{
    const [full_screen, setFullScreen]=useState(false)
    const [pulau_form, setPulauForm]=useState([])
    const [provinsi_form, setProvinsiForm]=useState([])
    const [kabupaten_kota_form, setKabupatenKotaForm]=useState([])

    useEffect(()=>{
        fetchPulauForm()
    }, [])

    //request data
    const request={
        apiGetsPulauForm:async()=>{
            return await api(access_token()).get("/region/type/pulau", {
                params:{
                    per_page:"",
                    page:1,
                    q:""
                }
            })
            .then(res=>res.data)
        },
        apiGetsProvinsiForm:async(pulau)=>{
            return await api(access_token()).get("/region/type/provinsi", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    pulau:pulau
                },
            })
            .then(res=>res.data)
        },
        apiGetsKabupatenKotaForm:async(provinsi)=>{
            return await api(access_token()).get("/region/type/kabupaten_kota", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    province_id:provinsi
                },
            })
            .then(res=>res.data)
        }
    }
    //data
    const fetchPulauForm=async()=>{
        await request.apiGetsPulauForm()
        .then(data=>{
            setPulauForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchProvinsiForm=async(pulau)=>{
        await request.apiGetsProvinsiForm(pulau)
        .then(data=>{
            setProvinsiForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchKabupatenKotaForm=async(province_id)=>{
        await request.apiGetsKabupatenKotaForm(province_id)
        .then(data=>{
            setKabupatenKotaForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }

    //options
    const tahun_options=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-3; i<=year+2; i++){
            years=years.concat([{value:i, label:i}])
        }

        return [{value:"", label:"Pilih Tahun"}].concat(years)
    }
    const kabupaten_kota_options=()=>{
        let data=kabupaten_kota_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Kab/Kota", value:""}].concat(data)

        return data
    }
    const provinsi_options=()=>{
        let data=provinsi_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Provinsi", value:""}].concat(data)

        return data
    }
    const pulau_options=()=>{
        let data=pulau_form.map(p=>{
            return {label:p.pulau, value:p.pulau}
        })
        data=[{label:"Semua Pulau", value:""}].concat(data)

        return data
    }

    //generated data
    const data_generated=()=>{
        let new_data=[]

        if(!data.is_loading){
            for(var i=0; i<data.data.length; i++){
                if(data.pulau.toString().trim()!="" && data.data[i].data.pulau.toString().trim()!=data.pulau.toString().trim()){
                    continue
                }
                if(data.province_id.toString().trim()!="" && data.data[i].id_region.toString().trim()!=data.province_id.toString().trim()){
                    continue
                }

                const test=[
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+0,
                        kabupaten_kota:undefined
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+1,
                        kabupaten_kota:undefined
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+2,
                        kabupaten_kota:undefined
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+3,
                        kabupaten_kota:undefined
                    }),
                    Object.assign({}, data.data[i], {
                        index:i,
                        index_table:i*5+4,
                        kabupaten_kota:undefined
                    })
                ]
                new_data=new_data.concat(test)

                //provinsi expanded
                if(data.data[i].expanded){
                    for(var j=0; j<data.data[i].kabupaten_kota.length; j++){
                        if(data.regency_id.toString().trim()!="" && data.data[i].kabupaten_kota[j].id_region.toString().trim()!=data.regency_id.toString().trim()){
                            continue
                        }

                        const test2=[
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+0,
                                kecamatan:undefined
                            }),
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+1,
                                kecamatan:undefined
                            }),
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+2,
                                kecamatan:undefined
                            }),
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+3,
                                kecamatan:undefined
                            }),
                            Object.assign({}, data.data[i].kabupaten_kota[j], {
                                index:j,
                                index_provinsi:i,
                                index_table:j*5+4,
                                kecamatan:undefined
                            }),
                        ]
                        new_data=new_data.concat(test2)
                        
                        //kabupaten kota expanded
                        if(data.data[i].kabupaten_kota[j].expanded){
                            for(var k=0; k<data.data[i].kabupaten_kota[j].kecamatan.length; k++){
                                if(data.data[i].kabupaten_kota[j].kecamatan[k].region.toString().toLowerCase().indexOf(data.q.toLowerCase())==-1){
                                    continue
                                }

                                const test3=[
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+0,
                                        kecamatan:undefined
                                    }),
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+1,
                                        kecamatan:undefined
                                    }),
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+2,
                                        kecamatan:undefined
                                    }),
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+3,
                                        kecamatan:undefined
                                    }),
                                    Object.assign({}, data.data[i].kabupaten_kota[j].kecamatan[k], {
                                        index:k,
                                        index_provinsi:i,
                                        index_kabupaten_kota:j,
                                        index_table:k*5+4,
                                        kecamatan:undefined
                                    })
                                ];

                                new_data=new_data.concat(test3)
                            }
                        }
                    }
                }
            }

            if(data.data.length>0){
                new_data=new_data.concat([{index:-1, index_table:-1, type:"space"}, {index:-1, index_table:-1, type:"space"}])
            }
        }
        return new_data
    }

    //helper
    const valueSifatHujan=(curah_hujan, normal)=>{
        if(curah_hujan.toString().trim()==""||normal.toString().trim()==""){
            return ""
        }
        if(Number(normal)==0){
            return "?";
        }

        const value=curah_hujan/normal;
        if(value<0.85){
            return "Bawah Normal";
        }
        if(value>=0.85 && value<=1.15){
            return "Normal";
        }
        if(value>1.15){
            return "Atas Normal";
        }
    }
    const valueSifatBulan=(curah_hujan)=>{
        if(curah_hujan.toString().trim()==""){
            return ""
        }

        if(curah_hujan>200){
            return "Bulan Basah"
        }
        else if(curah_hujan>=100 && curah_hujan<=200){
            return "Bulan Lembab"
        }
        else if(curah_hujan>=60 && curah_hujan<100){
            return "Bulan Kering"
        }
        else if(curah_hujan<60){
            return "Bulan Sangat Kering"
        }
    }
    const valueCurahHujanSumTahunan=(curah_hujan=[])=>{
        const sum_curah_hujan=curah_hujan.reduce((total, value)=>{
            let ch=0
            if(value.curah_hujan.toString()!=""){
                ch=Number(value.curah_hujan)
            }

            return total+ch
        }, 0)

        return sum_curah_hujan
    }
    const valueCurahHujanNormalSumTahunan=(curah_hujan=[])=>{
        const sum_curah_hujan=curah_hujan.reduce((total, value)=>{
            let ch=0
            if(value.curah_hujan_normal.toString()!=""){
                ch=Number(value.curah_hujan_normal)
            }

            return total+ch
        }, 0)

        return sum_curah_hujan
    }
    const valueCountSifatBulan=(curah_hujan=[], type)=>{
        let sifat_bulan=[]
        curah_hujan.map(ch=>{
            sifat_bulan=sifat_bulan.concat([valueSifatBulan(ch.curah_hujan)])
        })
        
        let count=0;
        for(var i=0; i<sifat_bulan.length; i++){
            if(sifat_bulan[i].toString()==type.toString()){
                count+=1
            }
        }

        return count
    }
    //--value tree
    const valueAkumulasiCH=(arr_curah_hujan)=>{
        //calculate
        var curah_hujan=arr_curah_hujan.filter(f=>f.curah_hujan!="")
        if(curah_hujan.length>0){
            const sum_curah_hujan=curah_hujan.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan)
            }, 0)

            return sum_curah_hujan/curah_hujan.length
        }
        return ""

    }
    const valueAkumulasiCHNormal=(arr_curah_hujan)=>{
        //calculate
        var curah_hujan=arr_curah_hujan.filter(f=>f.curah_hujan_normal!="")
        if(curah_hujan.length>0){
            const sum_curah_hujan=curah_hujan.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan_normal)
            }, 0)

            return sum_curah_hujan/curah_hujan.length
        }
        return ""
    }
    const valueProvinsiCurahHujanColumn=(idx_provinsi, idx_column)=>{
        let curah_hujan=[]

        data.data[idx_provinsi].kabupaten_kota.map((kabkota, idx)=>{
            const avg_kabupaten_kota=valueKabupatenKotaCurahHujanColumn(idx_provinsi, idx, idx_column)

            var ch_norm=avg_kabupaten_kota.filter(f=>f.curah_hujan_normal!="")
            var ch_pred=avg_kabupaten_kota.filter(f=>f.curah_hujan!="")

            const ch=ch_pred.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan)
            }, 0)
            const ch_normal=ch_norm.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan_normal)
            }, 0)
            
            curah_hujan=curah_hujan.concat([{
                id_curah_hujan:ch_pred.length>0?-1:null,
                curah_hujan:ch_pred.length>0?ch/ch_pred.length:"",
                curah_hujan_normal:ch_norm.length>0?ch_normal/ch_norm.length:""
            }])
        })

        return curah_hujan
    }
    const valueKabupatenKotaCurahHujanColumn=(idx_provinsi, idx_kabupaten_kota, idx_column)=>{
        let curah_hujan=[]

        data.data[idx_provinsi].kabupaten_kota[idx_kabupaten_kota].kecamatan.map(kec=>{
            curah_hujan=curah_hujan.concat([kec.curah_hujan[idx_column]])
        })

        return curah_hujan
    }
    const valueProvinsiCurahHujan=(idx_provinsi)=>{
        let curah_hujan=[]

        for(var i=0; i<36; i++){
            const ch_provinsi_column=valueProvinsiCurahHujanColumn(idx_provinsi, i)

            var ch_norm=ch_provinsi_column.filter(f=>f.curah_hujan_normal!="")
            var ch_pred=ch_provinsi_column.filter(f=>f.curah_hujan!="")

            const ch=ch_pred.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan)
            }, 0)
            const ch_normal=ch_norm.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan_normal)
            }, 0)
            
            curah_hujan=curah_hujan.concat([{
                id_curah_hujan:ch_pred.length>0?-1:null,
                curah_hujan:ch_pred.length>0?ch/ch_pred.length:"",
                curah_hujan_normal:ch_norm.length>0?ch_normal/ch_norm.length:""
            }])
        }

        return curah_hujan
    }
    const valueKabupatenKotaCurahHujan=(idx_provinsi, idx_kabupaten_kota)=>{
        let curah_hujan=[]

        for(var i=0; i<36; i++){
            const ch_kabupaten_kota_column=valueKabupatenKotaCurahHujanColumn(idx_provinsi, idx_kabupaten_kota, i)

            var ch_norm=ch_kabupaten_kota_column.filter(f=>f.curah_hujan_normal!="")
            var ch_pred=ch_kabupaten_kota_column.filter(f=>f.curah_hujan!="")

            const ch=ch_pred.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan)
            }, 0)
            const ch_normal=ch_norm.reduce((carry, item)=>{
                return Number(carry)+Number(item.curah_hujan_normal)
            }, 0)
            
            curah_hujan=curah_hujan.concat([{
                id_curah_hujan:ch_pred.length>0?-1:null,
                curah_hujan:ch_pred.length>0?ch/ch_pred.length:"",
                curah_hujan_normal:ch_norm.length>0?ch_normal/ch_norm.length:""
            }])
        }

        return curah_hujan
    }

    //action
    const toggleProvinsi=(idx_provinsi)=>{
        const new_data=update(data.data, {
            [idx_provinsi]:{
                expanded:{$set:!data.data[idx_provinsi].expanded}
            }
        })

        setData(new_data)
    }
    const toggleKabupatenKota=(idx_provinsi, idx_kabupaten_kota)=>{
        const new_data=update(data.data, {
            [idx_provinsi]:{
                kabupaten_kota:{
                    [idx_kabupaten_kota]:{
                        expanded:{$set:!data.data[idx_provinsi].kabupaten_kota[idx_kabupaten_kota].expanded}
                    }
                }
            }
        })
        
        setData(new_data)
    }

    //table
    const columns=[
        {
            key:'no',
            name:'#',
            width: 30,
            frozen: true,
            formatter:({row})=>{
                if(row.index*5+0==row.index_table && row.type=="provinsi"){
                    return <span>{row.index+1}</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'provinsi',
            name: 'Provinsi',
            width: 220,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                if(row.index*5+0==row.index_table && row.type=="provinsi"){
                    return <span>{row.region}</span>
                }
                else if(!["provinsi", "space"].includes(row.type)){
                    return <div className="treeview"></div>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'kabupaten_kota',
            name: 'Kabupaten/Kota',
            width: 220,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                if(row.index*5+0==row.index_table && row.type=="kabupaten_kota"){
                    return <span>{row.region}</span>
                }
                else if(row.index*5+0==row.index_table && row.type=="provinsi"){
                    return (
                        <div className="d-flex justify-content-end">
                            <button 
                                className={classNames("d-flex flex-fill align-items-center justify-content-center btn py-0 px-1 btn-secondary", {"btn-dark":row.expanded})}
                                type="button"
                                onClick={ev=>toggleProvinsi(row.index)}
                            >
                                {row.expanded?
                                    <>
                                        Sembunyikan
                                        <span className="ms-1">
                                            <FiChevronUp/>
                                        </span>
                                    </>
                                :
                                    <>
                                        Tampilkan
                                        <span className="ms-1">
                                            <FiChevronDown/>
                                        </span>
                                    </>
                                }
                            </button>
                        </div>
                    )
                }
                else if(!["kabupaten_kota", "provinsi", "space"].includes(row.type)){
                    return <div className="treeview"></div>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'kecamatan',
            name: 'Kecamatan',
            width: 220,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                if(row.index*5+0==row.index_table && row.type=="kecamatan"){
                    return <span>{row.region}</span>
                }
                else if(row.index*5+0==row.index_table && row.type=="kabupaten_kota"){
                    return (
                        <div className="d-flex justify-content-end">
                            <button 
                                className={classNames("d-flex flex-fill align-items-center justify-content-center btn py-0 px-1 btn-secondary", {"btn-dark":row.expanded})}
                                type="button"
                                onClick={ev=>toggleKabupatenKota(row.index_provinsi, row.index)}
                            >
                                {row.expanded?
                                    <>
                                        Sembunyikan
                                        <span className="ms-1">
                                            <FiChevronUp/>
                                        </span>
                                    </>
                                :
                                    <>
                                        Tampilkan
                                        <span className="ms-1">
                                            <FiChevronDown/>
                                        </span>
                                    </>
                                }
                            </button>
                        </div>
                    )
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'parameter',
            name: 'Parameter',
            width: 150,
            frozen: true,
            formatter:({row})=>{
                if(row.index*5+0==row.index_table){
                    return <span>Curah Hujan (mm)</span>
                }
                else if(row.index*5+1==row.index_table){
                    return <span>CH Normal (mm)</span>
                }
                else if(row.index*5+2==row.index_table){
                    return <span>Sifat CH</span>
                }
                else if(row.index*5+3==row.index_table){
                    return <span>Sifat Bulan</span>
                }
                else{
                    return <span></span>
                }
            }
        },
        {
            key: 'bulan1_1',
            name: 'Januari 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=0
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan1_2',
            name: 'Januari 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=1
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan1_3',
            name: 'Januari 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=2
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan2_1',
            name: 'Februari 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=3
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan2_2',
            name: 'Februari 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=4
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan2_3',
            name: 'Februari 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=5
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan3_1',
            name: 'Maret 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=6
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan3_2',
            name: 'Maret 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=7
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan3_3',
            name: 'Maret 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=8
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan4_1',
            name: 'April 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=9
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan4_2',
            name: 'April 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=10
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan4_3',
            name: 'April 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=11
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan5_1',
            name: 'Mei 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=12
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan5_2',
            name: 'Mei 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=13
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan5_3',
            name: 'Mei 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=14
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan6_1',
            name: 'Juni 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=15
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan6_2',
            name: 'Juni 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=16
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan6_3',
            name: 'Juni 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=17
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan7_1',
            name: 'Juli 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=18
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan7_2',
            name: 'Juli 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=19
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan7_3',
            name: 'Juli 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=20
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan8_1',
            name: 'Agustus 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=21
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan8_2',
            name: 'Agustus 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=22
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan8_3',
            name: 'Agustus 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=23
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan9_1',
            name: 'September 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=24
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan9_2',
            name: 'September 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=25
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan9_3',
            name: 'September 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=26
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan10_1',
            name: 'Oktober 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=27
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan10_2',
            name: 'Oktober 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=28
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan10_3',
            name: 'Oktober 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=29
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan11_1',
            name: 'November 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=30
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan11_2',
            name: 'November 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=31
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan11_3',
            name: 'November 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=32
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan12_1',
            name: 'Desember 1',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=33
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan12_2',
            name: 'Desember 2',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=34
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'bulan12_3',
            name: 'Desember 3',
            width: 120,
            resizable: true,
            formatter:({row})=>{
                const row_index=35
                return renderColumnBulan(row, row_index)
            }
        },
        {
            key: 'avg_tahunan',
            name: 'Rata Rata Tahunan',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                let ch="", ch_normal=""

                if(row.type=="provinsi"){
                    const curah_hujan=valueProvinsiCurahHujan(row.index)

                    ch=valueAkumulasiCH(curah_hujan)
                    ch_normal=valueAkumulasiCHNormal(curah_hujan)
                }
                else if(row.type=="kabupaten_kota"){
                    const curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)

                    ch=valueAkumulasiCH(curah_hujan)
                    ch_normal=valueAkumulasiCHNormal(curah_hujan)
                }
                else if(row.type=="kecamatan"){
                    const curah_hujan=row.curah_hujan

                    ch=valueAkumulasiCH(curah_hujan)
                    ch_normal=valueAkumulasiCHNormal(curah_hujan)
                }

                //return
                if(row.index*5+0==row.index_table){
                    return <span>{ch}</span>
                }
                else if(row.index*5+1==row.index_table){
                    return <span>{ch_normal}</span>
                }
                else if(row.index*5+2==row.index_table){
                    return <span>{valueSifatHujan(ch, ch_normal)}</span>
                }
                else if(row.index*5+3==row.index_table){
                    return <span>{valueSifatBulan(ch)}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'jumlah_tahunan',
            name: 'Jumlah Tahunan',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                let ch="", ch_normal=""

                if(row.type=="provinsi"){
                    const curah_hujan=valueProvinsiCurahHujan(row.index)

                    ch=valueCurahHujanSumTahunan(curah_hujan)
                    ch_normal=valueCurahHujanNormalSumTahunan(curah_hujan)
                }
                else if(row.type=="kabupaten_kota"){
                    const curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)

                    ch=valueCurahHujanSumTahunan(curah_hujan)
                    ch_normal=valueCurahHujanNormalSumTahunan(curah_hujan)
                }
                else if(row.type=="kecamatan"){
                    const curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))

                    ch=valueCurahHujanSumTahunan(curah_hujan)
                    ch_normal=valueCurahHujanNormalSumTahunan(curah_hujan)
                }

                //return
                if(row.index*5+0==row.index_table){
                    return <span>{ch}</span>
                }
                else if(row.index*5+1==row.index_table){
                    return <span>{ch_normal}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'jumlah_bulan_basah',
            name: 'Jumlah Bulan Basah',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const type="Bulan Basah"
                let curah_hujan=[]

                if(row.type=="provinsi"){
                    curah_hujan=valueProvinsiCurahHujan(row.index)
                }
                else if(row.type=="kabupaten_kota"){
                    curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)
                }
                else if(row.type=="kecamatan"){
                    curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))
                }
    
                if(row.index*5+3==row.index_table){
                    return <span>{valueCountSifatBulan(curah_hujan, type)}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'jumlah_bulan_lembab',
            name: 'Jumlah Bulan Lembab',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const type="Bulan Lembab"
                let curah_hujan=[]

                if(row.type=="provinsi"){
                    curah_hujan=valueProvinsiCurahHujan(row.index)
                }
                else if(row.type=="kabupaten_kota"){
                    curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)
                }
                else if(row.type=="kecamatan"){
                    curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))
                }
    
                if(row.index*5+3==row.index_table){
                    return <span>{valueCountSifatBulan(curah_hujan, type)}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'jumlah_bulan_kering',
            name: 'Jumlah Bulan Kering',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const type="Bulan Kering"
                let curah_hujan=[]

                if(row.type=="provinsi"){
                    curah_hujan=valueProvinsiCurahHujan(row.index)
                }
                else if(row.type=="kabupaten_kota"){
                    curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)
                }
                else if(row.type=="kecamatan"){
                    curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))
                }
    
                if(row.index*5+3==row.index_table){
                    return <span>{valueCountSifatBulan(curah_hujan, type)}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'jumlah_bulan_sangat_kering',
            name: 'Jumlah Bulan Sangat Kering',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                const type="Bulan Sangat Kering"
                let curah_hujan=[]

                if(row.type=="provinsi"){
                    curah_hujan=valueProvinsiCurahHujan(row.index)
                }
                else if(row.type=="kabupaten_kota"){
                    curah_hujan=valueKabupatenKotaCurahHujan(row.index_provinsi, row.index)
                }
                else if(row.type=="kecamatan"){
                    curah_hujan=row.curah_hujan.filter(f=>!isUndefined(f.id_curah_hujan))
                }
    
                if(row.index*5+3==row.index_table){
                    return <span>{valueCountSifatBulan(curah_hujan, type)}</span>
                }
                else{
                    return (
                        <span></span>
                    )
                }
            }
        },
        {
            key: 'blankcell1',
            name: '',
            width: 150,
            resizable: true,
            formatter:(row)=>{
                return <></>
            }
        }
    ]
    const renderColumnBulan=(row, row_index)=>{
        let ch="", ch_normal=""

        if(row.type=="provinsi"){
            const curah_hujan_column=valueProvinsiCurahHujanColumn(row.index, row_index)

            ch=valueAkumulasiCH(curah_hujan_column)
            ch_normal=valueAkumulasiCHNormal(curah_hujan_column)
        }
        else if(row.type=="kabupaten_kota"){
            const curah_hujan_column=valueKabupatenKotaCurahHujanColumn(row.index_provinsi, row.index, row_index)

            ch=valueAkumulasiCH(curah_hujan_column)
            ch_normal=valueAkumulasiCHNormal(curah_hujan_column)
        }
        else if(row.type=="kecamatan"){
            ch=row.curah_hujan[row_index].curah_hujan
            ch_normal=row.curah_hujan[row_index].curah_hujan_normal
        }

        //return
        if(row.index*5+0==row.index_table){
            return <span>{ch}</span>
        }
        else if(row.index*5+1==row.index_table){
            return <span>{ch_normal}</span>
        }
        else if(row.index*5+2==row.index_table){
            return <span>{valueSifatHujan(ch, ch_normal)}</span>
        }
        else if(row.index*5+3==row.index_table){
            return <span>{valueSifatBulan(ch)}</span>
        }
        else{
            return (
                <span></span>
            )
        }
    }


    return (
        <>
            <div className="d-flex mb-4">
                <div className="d-flex">
                    <div style={{width:"200px"}} className="me-2">
                        <Select
                            options={pulau_options()}
                            value={pulau_options().find(f=>f.value==data.pulau)}
                            onChange={e=>{
                                setCurahHujan(
                                    update(data, {
                                        pulau:{$set:e.value},
                                        province_id:{$set:""},
                                        regency_id:{$set:""}
                                    }),
                                    ()=>{
                                        setProvinsiForm([])
                                        setKabupatenKotaForm([])
                                        fetchProvinsiForm(e.value)
                                    }
                                )
                            }}
                            placeholder="Semua Pulau"
                            classNamePrefix="form-select"
                        />
                    </div>
                    <div style={{width:"200px"}} className="me-2">
                        <Select
                            options={provinsi_options()}
                            value={provinsi_options().find(f=>f.value==data.province_id)}
                            onChange={e=>{
                                setCurahHujan(
                                    update(data, {
                                        province_id:{$set:e.value},
                                        regency_id:{$set:""}
                                    }),
                                    ()=>{
                                        setKabupatenKotaForm([])
                                        fetchKabupatenKotaForm(e.value)
                                    }
                                )
                            }}
                            placeholder="Semua Provinsi"
                            classNamePrefix="form-select"
                        />
                    </div>
                    <div style={{width:"200px"}} className="me-2">
                        <Select
                            options={kabupaten_kota_options()}
                            value={kabupaten_kota_options().find(f=>f.value==data.regency_id)}
                            onChange={e=>{
                                setCurahHujan(
                                    update(data, {
                                        regency_id:{$set:e.value}
                                    })
                                )
                            }}
                            placeholder="Semua Kab/Kota"
                            classNamePrefix="form-select"
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
                <div className="ms-auto d-flex">
                    <div style={{width:"200px"}} className="me-3 position-relative">
                        <CreatableSelect
                            options={tahun_options()}
                            onChange={e=>{
                                typeFilter({target:{name:"tahun", value:e.value}})
                            }}
                            value={tahun_options().find(f=>f.value==data.tahun)}
                            placeholder="Pilih Tahun"
                        />
                    </div>
                    <button className="btn btn-light btn-icon ms-1" type="button" onClick={e=>setFullScreen(true)} title="full screen">
                        <FiExternalLink className="icon"/>
                    </button>
                </div>
            </div>

            {!full_screen&&
                <div className="position-relative" style={{height:"600px"}}>
                    <DataGrid
                        rows={data_generated()}
                        columns={columns}
                        className={classNames("rdg-light","fill-grid")}
                        rowHeight={25}
                        headerRowHeight={40}
                        style={{height:"100%"}}
                        renderers
                    />
                    {data.is_loading&&
                        <div
                            className="d-flex align-items-center justify-content-center position-absolute top-0 left-0 w-100 h-100 text-secondary"
                        >
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
                    }
                    {(data.data.length==0&&!data.is_loading)&&
                        <div
                            className="d-flex align-items-center justify-content-center position-absolute top-0 left-0 w-100 h-100 text-secondary"
                        >
                            Data tidak ditemukan!
                        </div>
                    }
                </div>
            }

            <Modal show={full_screen} backdrop="static" fullscreen={true} onHide={()=>setFullScreen(false)} animation={false}>
                <Modal.Header>
                    <div className="d-flex w-100">
                        <div className="d-flex">
                            <div style={{width:"200px"}} className="me-2">
                                <Select
                                    options={pulau_options()}
                                    value={pulau_options().find(f=>f.value==data.pulau)}
                                    onChange={e=>{
                                        setCurahHujan(
                                            update(data, {
                                                pulau:{$set:e.value},
                                                province_id:{$set:""},
                                                regency_id:{$set:""}
                                            }),
                                            ()=>{
                                                setProvinsiForm([])
                                                setKabupatenKotaForm([])
                                                fetchProvinsiForm(e.value)
                                            }
                                        )
                                    }}
                                    placeholder="Semua Pulau"
                                    classNamePrefix="form-select"
                                />
                            </div>
                            <div style={{width:"200px"}} className="me-2">
                                <Select
                                    options={provinsi_options()}
                                    value={provinsi_options().find(f=>f.value==data.province_id)}
                                    onChange={e=>{
                                        setCurahHujan(
                                            update(data, {
                                                province_id:{$set:e.value},
                                                regency_id:{$set:""}
                                            }),
                                            ()=>{
                                                setKabupatenKotaForm([])
                                                fetchKabupatenKotaForm(e.value)
                                            }
                                        )
                                    }}
                                    placeholder="Semua Provinsi"
                                    classNamePrefix="form-select"
                                />
                            </div>
                            <div style={{width:"200px"}} className="me-2">
                                <Select
                                    options={kabupaten_kota_options()}
                                    value={kabupaten_kota_options().find(f=>f.value==data.regency_id)}
                                    onChange={e=>{
                                        setCurahHujan(
                                            update(data, {
                                                regency_id:{$set:e.value}
                                            })
                                        )
                                    }}
                                    placeholder="Semua Kab/Kota"
                                    classNamePrefix="form-select"
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
                        <div className="ms-auto d-flex">
                            <div style={{width:"200px"}} className="me-3 position-relative">
                                <CreatableSelect
                                    options={tahun_options()}
                                    onChange={e=>{
                                        typeFilter({target:{name:"tahun", value:e.value}})
                                    }}
                                    value={tahun_options().find(f=>f.value==data.tahun)}
                                    placeholder="Pilih Tahun"
                                />
                            </div>
                            <button className="btn btn-light btn-icon ms-1" type="button" onClick={e=>setFullScreen(false)} title="close full screen">
                                <FiX className="icon"/>
                            </button>
                        </div>
                    </div>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <DataGrid
                        rows={data_generated()}
                        columns={columns}
                        className={classNames("rdg-light","fill-grid")}
                        rowHeight={25}
                        headerRowHeight={40}
                        style={{height:"100%"}}
                        renderers
                    />
                    {data.is_loading&&
                        <div
                            className="d-flex align-items-center justify-content-center position-absolute top-0 left-0 w-100 h-100 text-secondary"
                        >
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
                    }
                    {(data.data.length==0&&!data.is_loading)&&
                        <div
                            className="d-flex align-items-center justify-content-center position-absolute top-0 left-0 w-100 h-100 text-secondary"
                        >
                            Data tidak ditemukan!
                        </div>
                    }
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between align-items-center py-1">
                    <Modal.Title>Data Curah Hujan (Kabupaten/Kota)</Modal.Title>
                    <button className="btn btn-light" type="button" onClick={e=>setFullScreen(false)}>
                        Tutup Full Screen
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

//DOWNLOAD TEMPLATE
const ModalDownloadTemplate=({data, downloadTemplate, onHide})=>{
    const [pulau_form, setPulauForm]=useState([])
    const [provinsi_form, setProvinsiForm]=useState([])
    const [kabupaten_kota_form, setKabupatenKotaForm]=useState([])

    useEffect(()=>{
        if(data.is_open){
            fetchPulauForm()
            setProvinsiForm([])
            setKabupatenKotaForm([])
        }
    }, [data])

    //request data
    const request={
        apiGetsPulauForm:async()=>{
            return await api(access_token()).get("/region/type/pulau", {
                params:{
                    per_page:"",
                    page:1,
                    q:""
                }
            })
            .then(res=>res.data)
        },
        apiGetsProvinsiForm:async(pulau)=>{
            return await api(access_token()).get("/region/type/provinsi", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    pulau:pulau
                },
            })
            .then(res=>res.data)
        },
        apiGetsKabupatenKotaForm:async(provinsi)=>{
            return await api(access_token()).get("/region/type/kabupaten_kota", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    province_id:provinsi
                },
            })
            .then(res=>res.data)
        }
    }
    //data
    const fetchPulauForm=async()=>{
        await request.apiGetsPulauForm()
        .then(data=>{
            setPulauForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchProvinsiForm=async(pulau)=>{
        await request.apiGetsProvinsiForm(pulau)
        .then(data=>{
            setProvinsiForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchKabupatenKotaForm=async(province_id)=>{
        await request.apiGetsKabupatenKotaForm(province_id)
        .then(data=>{
            setKabupatenKotaForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    
    //options
    const kabupaten_kota_options=()=>{
        let data=kabupaten_kota_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Kab/Kota", value:""}].concat(data)

        return data
    }
    const provinsi_options=()=>{
        let data=provinsi_form.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Semua Provinsi", value:""}].concat(data)

        return data
    }
    const pulau_options=()=>{
        let data=pulau_form.map(p=>{
            return {label:p.pulau, value:p.pulau}
        })
        data=[{label:"Semua Pulau", value:""}].concat(data)

        return data
    }

    return (
        <Modal 
            show={data.is_open} 
            onHide={onHide} 
            backdrop="static" 
            size="sm" 
            className="modal-nested"
            backdropClassName="backdrop-nested"
            scrollable
        >
            <Formik
                initialValues={{
                    pulau:"",
                    province_id:"",
                    regency_id:""
                }}
                onSubmit={downloadTemplate}
                validationSchema={
                    yup.object().shape({
                        pulau:yup.string().optional(),
                        province_id:yup.string().optional(),
                        regency_id:yup.string().optional()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Download Template Excel</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2">Pulau</label>
                                <Select
                                    options={pulau_options()}
                                    value={pulau_options().find(f=>f.value==formik.values.pulau)}
                                    onChange={e=>{
                                        setProvinsiForm([])
                                        setKabupatenKotaForm([])
                                        fetchProvinsiForm(e.value)
                                        formik.setFieldValue("pulau", e.value)
                                    }}
                                    placeholder="Semua Pulau"
                                    classNamePrefix="form-select"
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal:base=>({
                                           ...base,
                                           zIndex: 999999
                                        })
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2">Provinsi</label>
                                <Select
                                    options={provinsi_options()}
                                    value={provinsi_options().find(f=>f.value==formik.values.province_id)}
                                    onChange={e=>{
                                        setKabupatenKotaForm([])
                                        fetchKabupatenKotaForm(e.value)
                                        formik.setFieldValue("province_id", e.value)
                                    }}
                                    placeholder="Semua Provinsi"
                                    classNamePrefix="form-select"
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal:base=>({
                                           ...base,
                                           zIndex: 999999
                                        })
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2">Kabupaten/Kota</label>
                                <Select
                                    options={kabupaten_kota_options()}
                                    value={kabupaten_kota_options().find(f=>f.value==formik.values.regency_id)}
                                    onChange={e=>{
                                        formik.setFieldValue("regency_id", e.value)
                                    }}
                                    placeholder="Semua Kabupaten/kota"
                                    classNamePrefix="form-select"
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal:base=>({
                                           ...base,
                                           zIndex: 999999
                                        })
                                    }}
                                />
                            </div>
                            <div className="mt-4">
                                <span className="form-text">*CH Prediksi dan CH Normal harus diisi di baris kolom yg dipilih, jika tidak diisi atau salah satu diisi maka akan diabaikan!</span>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="mt-3 border-top pt-2">
                            <button 
                                type="button" 
                                className="btn btn-link text-gray me-auto" 
                                onClick={(e)=>onHide()}
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-icon-text"
                                disabled={formik.isSubmitting||!(formik.isValid)}
                            >
                                <FiDownload className="btn-icon-prepend"/>
                                Download
                            </button>
                        </Modal.Footer>
                    </form>
                )}
            </Formik>
        </Modal>
    )
}

//IMPORT TEMPLATE
const ModalImportTemplate=({data, onHide, importTemplate})=>{
    const input_generated=()=>{
        let months=[]
        arrayMonths.map((month, idx_month)=>{
            for(var i=1; i<=3; i++){
                const input_ke=i

                months=months.concat([
                    {
                        key:"month-"+(idx_month+1)+"-"+i.toString(),
                        name:month+" "+i.toString(),
                        width:120,
                        frozen:false,
                        resizable:true,
                        formatter:({row})=>{
                            const index=idx_month*3+(input_ke-1)
                            const decoration=(!isNull(row.curah_hujan[index].ch_prediksi)&&!isNull(row.curah_hujan[index].ch_normal))?"none":"line-through"

                            return (
                                <>
                                    {(!isNull(row.curah_hujan[index].ch_prediksi)||!isNull(row.curah_hujan[index].ch_normal))&&
                                        <span style={{textDecoration:decoration}}>
                                            {!isNull(row.curah_hujan[index].ch_prediksi)?
                                                row.curah_hujan[index].ch_prediksi
                                            :
                                                "?"
                                            }
                                            , 
                                            {!isNull(row.curah_hujan[index].ch_normal)?
                                                row.curah_hujan[index].ch_normal
                                            :
                                                "?"
                                            }
                                        </span>
                                    }
                                </>
                                
                            )
                        }
                    }
                ])
            }
        })

        return months
    }
    const columns=[
        {
            key:'ID',
            name:'ID',
            width: 30,
            frozen: true,
            formatter:({row})=>{
                return <span>{row.id_region}</span>
            }
        },
        {
            key: 'provinsi',
            name: 'Provinsi',
            width: 180,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                return <span>{row.provinsi}</span>
            }
        },
        {
            key: 'kabupaten_kota',
            name: 'Kabupaten/Kota',
            width: 180,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                return <span>{row.kabupaten_kota}</span>
            }
        },
        {
            key: 'kecamatan',
            name: 'Kecamatan',
            width: 180,
            resizable: true,
            frozen: true,
            formatter:({row})=>{
                return <span>{row.kecamatan}</span>
            }
        },
        ...input_generated()
    ]

    return (
        <Modal 
            show={data.is_open} 
            onHide={onHide} 
            backdrop="static" 
            size="xl" 
            className="modal-nested"
            backdropClassName="backdrop-nested"
        >
            <Modal.Header closeButton>
                <h4 className="modal-title">Preview Import Excel (CH Prediksi, CH Normal)</h4>
            </Modal.Header>
            <Modal.Body className="p-0">
                <div className="mb-4 mt-4">
                    <ol>
                        <li>Pastikan Curah Hujan Normal pada Region Bulan Sudah Diinput, Jika Belum diinput proses import akan gagal!</li>
                        <li>Isilah Hanya inputan CH Prediksi dari template excel, Jangan input CH Prediksi jika tidak ada nilai CH Normal Pada Region Bulan!</li>
                    </ol>
                </div>
                <DataGrid
                    rows={data.data.template}
                    columns={columns}
                    className={classNames("rdg-light","fill-grid")}
                    rowHeight={25}
                    headerRowHeight={40}
                    style={{height:"300px"}}
                    renderers
                />
            </Modal.Body>
            <Modal.Footer className="border-top pt-2">
                <button 
                    type="button" 
                    className="btn btn-link text-gray me-auto" 
                    onClick={(e)=>onHide()}
                >
                    Batal
                </button>
                <button 
                    type="button" 
                    className="btn btn-primary btn-icon-text"
                    onClick={importTemplate}
                    disabled={data.is_submitting}
                >
                    <FiUpload className="btn-icon-prepend"/>
                    Import Excel
                </button>
            </Modal.Footer>
        </Modal>
    )
}

//EDIT EWS
const ModalEdit=({data, toggleModalEdit, updateCurahHujan})=>{

    return (
        <Modal 
            show={data.is_open} 
            onHide={toggleModalEdit} 
            backdrop="static" 
            size="sm" 
            className="modal-nested"
            backdropClassName="backdrop-nested" 
            scrollable
        >
            <Formik
                initialValues={data.curah_hujan}
                onSubmit={updateCurahHujan}
                validationSchema={
                    yup.object().shape({
                        id_region:yup.string().required(),
                        tahun:yup.string().required(),
                        bulan:yup.string().required(),
                        curah_hujan:yup.number().required(),
                        curah_hujan_normal:yup.number().required()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit Curah Hujan</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-2">
                                <label className="my-1 me-2">Curah Hujan</label>
                                <NumberFormat
                                    className="form-control"
                                    thousandSeparator
                                    value={formik.values.curah_hujan}
                                    onValueChange={values=>{
                                        const {value}=values
                                        formik.setFieldValue("curah_hujan", value)
                                    }}
                                    suffix=" mm"
                                    allowNegative={false}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="my-1 me-2">Curah Hujan Normal</label>
                                <NumberFormat
                                    className="form-control"
                                    thousandSeparator
                                    value={formik.values.curah_hujan_normal}
                                    onValueChange={values=>{
                                        const {value}=values
                                        formik.setFieldValue("curah_hujan_normal", value)
                                    }}
                                    suffix=" mm"
                                    allowNegative={false}
                                />
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



export default withAuth(CurahHujan)