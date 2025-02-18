import React, { useEffect, useMemo, useRef, useState } from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Layout from "../../../component/layout"
import withAuth from "../../../component/hoc/auth"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { api } from "../../../config/api"
import { access_token, isUndefined, readFile } from "../../../config/config"
import { toast } from "react-toastify"
import Router from "next/router"
import { FiChevronLeft, FiChevronRight, FiDownload, FiEdit, FiMoreVertical, FiPlus, FiTrash, FiTrash2, FiUpload } from "react-icons/fi"
import Avatar from "../../../component/ui/avatar"
import { Dropdown, Modal, Spinner } from "react-bootstrap"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import Select from 'react-select'
import CreatableSelect from "react-select/creatable"
import DataGrid from 'react-data-grid'
import * as ExcelJS from "exceljs"
import FileSaver from "file-saver"
import { Formik } from "formik"
import * as yup from "yup"
import * as turf from "@turf/turf"
import * as _ from "underscore"
import NumberFormat from "react-number-format"


const MySwal=withReactContent(swal)

class Page extends React.Component{
    state={
        provinsi_form:[],
        regency_form:[],
        sebaran_opt:{
            data:[],
            page:1,
            per_page:15,
            last_page:1,
            komoditas:"",
            tahun:"",
            bulan:"",
            province_id:"",
            regency_id:"",
            is_loading:false
        },
        download_template:{
            is_open:false
        },
        import_template:{
            is_open:false,
            province_id:"",
            regency_id:"",
            data:[]
        }
    }

    componentDidMount=()=>{
        this.fetchProvinsiForm()
        this.fetchSebaranOpt()
    }

    //REQUEST, QUERY, MUTATION
    abortController=new AbortController()
    request={
        apiGetsProvinsiForm:async()=>{
            return await api(access_token()).get("/region/type/provinsi", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    pulau:""
                },
            })
            .then(res=>res.data)
        },
        apiGetsRegencyForm:async(province_id)=>{
            return await api(access_token()).get("/region/type/kabupaten_kota", {
                params:{
                    per_page:"",
                    page:1,
                    q:"",
                    province_id:province_id
                }
            })
            .then(res=>res.data)
        },
        apiGetsSebaranOpt:async(params)=>{
            this.abortController.abort()
            this.abortController=new AbortController()

            return await api(access_token()).get("/sebaran_opt", {
                params:params,
                signal:this.abortController.signal
            })
            .then(res=>res.data)
        },
        apiGetsSebaranOptRegion:async(params)=>{
            return await api(access_token()).get("/sebaran_opt/type/region_kabupaten_kota", {
                params:params
            })
            .then(res=>res.data)
        },
        apiAddSebaranOptMultiple:async(params)=>{
            return await api(access_token()).post("/sebaran_opt/type/import_chunks", params).then(res=>res.data)
        }
    }
    //--data
    fetchProvinsiForm=async()=>{
        await this.request.apiGetsProvinsiForm()
        .then(data=>{
            this.setState({
                provinsi_form:data.data
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
    fetchRegencyForm=async()=>{
        const {sebaran_opt}=this.state

        if(sebaran_opt.province_id.toString().trim()==""){
            this.setState({
                regency_form:[]
            })
            return false
        }

        await this.request.apiGetsRegencyForm(sebaran_opt.province_id)
        .then(data=>{
            this.setState({
                regency_form:data.data
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
    fetchSebaranOpt=async()=>{
        const {data, ...params}=this.state.sebaran_opt

        this.setLoading(true)
        await this.request.apiGetsSebaranOpt(params)
        .then(data=>{
            this.setState({
                sebaran_opt:update(this.state.sebaran_opt, {
                    data:{$set:data.data},
                    page:{$set:data.current_page},
                    last_page:{$set:data.last_page},
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
    downloadTemplate=async(values, actions)=>{
        await this.request.apiGetsSebaranOptRegion(values)
        .then(async data=>{
            let kabkot=data.data

            let aoa_sebaran_opt=[
                [
                    "regency_id(dont edit)",
                    "Pulau",
                    "Provinsi",
                    "Kabupaten/Kota",
                    "Tahun",
                    "Bulan",
                    "Periode",
                    "Kategori",
                    "Komoditas",
                    "Jenis Varietas",
                    "Satuan",
                    "Opt",
                    "lts_ringan",
                    "lts_sedang",
                    "lts_berat",
                    "lts_puso",
                    "lks_ringan",
                    "lks_sedang",
                    "lks_berat",
                    "lks_puso",
                    "lp_pemusnahan",
                    "lp_pestisida_kimia",
                    "lp_cara_lain",
                    "lp_agens_hayati",
                    "sum_lts",
                    "sum_lks",
                    "sum_lp"
                ]
            ]

            let rows_merge=[]
            for(var i=0; i<kabkot.length; i++){
                const row=[
                    kabkot[i].id_region,
                    kabkot[i].parent?.data?.pulau,
                    kabkot[i].parent?.region,
                    kabkot[i].region,
                    ...Array.apply(null, Array(23)).map(String.prototype.valueOf, "")
                ]
                rows_merge=rows_merge.concat(Array(Number(values.jml_data)).fill(row))
            }
            
            const workBook=new ExcelJS.Workbook()
            const workSheet1=workBook.addWorksheet("Sheet 1")
            workSheet1.addRows(aoa_sebaran_opt)
            workSheet1.addRows(rows_merge)
            workSheet1.getColumn(1).hidden=true
            workSheet1.getRow(1).alignment={vertical:"middle"}
            workSheet1.getRow(1).font={bold:true}
            workSheet1.views=[
                {state:"frozen", ySplit:1, xSplit:0}
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
    
                FileSaver.saveAs(new Blob([data]), date+"__template__sebaran-opt.xlsx")
            })
            .catch(err => {
                toast.error("Failed to create generated spreadsheet!", {position:"bottom-center"})
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
    generateImportedExcel=async(file)=>{
        const workBook=new ExcelJS.Workbook()
        const buffer=await readFile(file)

        const file_excel=await workBook.xlsx.load(buffer)
        const workSheet=file_excel.getWorksheet(1)

        let data_excel=[]

        workSheet.eachRow((row, row_num)=>{
            if(row_num>1){
                // const data=[13,14,15,16,17,18,19,20,21,22,23,24,25,26,27]
                // for(var i=0; i<data.length; i++){
                //     if(!_.isNull(row.getCell(data[i]).value) && !_.isNumber(row.getCell(data[i]).value)){
                //         console.log("error row : ", row_num)
                //         break
                //     }
                // }

                data_excel=data_excel.concat([
                    {
                        idx:row_num-2,
                        regency_id:row.getCell(1).value,
                        pulau:row.getCell(2).value.toString(),
                        provinsi:row.getCell(3).value.toString(),
                        kabupaten_kota:row.getCell(4).value.toString(),
                        tahun:!_.isNull(row.getCell(5).value)?row.getCell(5).value:"",
                        bulan:!_.isNull(row.getCell(6).value)?row.getCell(6).value:"",
                        periode:!_.isNull(row.getCell(7).value)?row.getCell(7).value:"",
                        kategori:!_.isNull(row.getCell(8).value)?row.getCell(8).value:"",
                        komoditas:!_.isNull(row.getCell(9).value)?row.getCell(9).value:"",
                        jenis_varietas:!_.isNull(row.getCell(10).value)?row.getCell(10).value:"",
                        satuan:!_.isNull(row.getCell(11).value)?row.getCell(11).value.toString():"",
                        opt:!_.isNull(row.getCell(12).value)?row.getCell(12).value.toString():"",
                        lts_ringan:!_.isNull(row.getCell(13).value)?row.getCell(13).value:"",
                        lts_sedang:!_.isNull(row.getCell(14).value)?row.getCell(14).value:"",
                        lts_berat:!_.isNull(row.getCell(15).value)?row.getCell(15).value:"",
                        lts_puso:!_.isNull(row.getCell(16).value)?row.getCell(16).value:"",
                        lks_ringan:!_.isNull(row.getCell(17).value)?row.getCell(17).value:"",
                        lks_sedang:!_.isNull(row.getCell(18).value)?row.getCell(18).value:"",
                        lks_berat:!_.isNull(row.getCell(19).value)?row.getCell(19).value:"",
                        lks_puso:!_.isNull(row.getCell(20).value)?row.getCell(20).value:"",
                        lp_pemusnahan:!_.isNull(row.getCell(21).value)?row.getCell(21).value:"",
                        lp_pestisida_kimia:!_.isNull(row.getCell(22).value)?row.getCell(22).value:"",
                        lp_cara_lain:!_.isNull(row.getCell(23).value)?row.getCell(23).value:"",
                        lp_agens_hayati:!_.isNull(row.getCell(24).value)?row.getCell(24).value:"",
                        sum_lts:!_.isNull(row.getCell(25).value)?row.getCell(25).value:"",
                        sum_lks:!_.isNull(row.getCell(26).value)?row.getCell(26).value:"",
                        sum_lp:!_.isNull(row.getCell(27).value)?row.getCell(27).value:""
                    }
                ])
            }
        })

        this.setState({
            import_template:{
                is_open:true,
                province_id:"",
                regency_id:"",
                data:data_excel
            }
        })
    }
    updateCurahHujanMultiple=async(values, actions)=>{
        await this.request.apiAddSebaranOptMultiple({
            data:values.data
        })
        .then(data=>{
            this.fetchSebaranOpt()
            this.hideModalImportTemplate()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Import Data Failed! ", {position:"bottom-center"})
        })
    }

    //TABLE
    setLoading=loading=>{
        this.setState({
            sebaran_opt:update(this.state.sebaran_opt, {
                is_loading:{$set:loading}
            })
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            sebaran_opt:update(this.state.sebaran_opt, {
                per_page:{$set:target.value},
                page:{$set:1}
            })
        }, ()=>{
            this.fetchSebaranOpt()
        })
    }
    goToPage=page=>{
        this.setState({
            sebaran_opt:update(this.state.sebaran_opt, {
                page:{$set:page}
            })
        }, ()=>{
            this.fetchSebaranOpt()
        })
    }
    typeFilter=e=>{
        const target=e.target

        this.setState({
            sebaran_opt:update(this.state.sebaran_opt, {
                page:{$set:1},
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            switch(target.name){
                case "province_id":
                    this.setState({
                        sebaran_opt:update(this.state.sebaran_opt, {
                            regency_id:{$set:""}
                        })
                    }, ()=>{
                        this.fetchSebaranOpt()
                        this.fetchRegencyForm()
                    })
                break;
                default:
                    this.fetchSebaranOpt()
            }
        })
    }
    timeout=0

    //DATA ACTIONS
    toggleModalDownloadTemplate=(is_open=false)=>{
        this.setState({
            download_template:{
                is_open:is_open
            }
        })
    }
    hideModalImportTemplate=()=>{
        this.setState({
            import_template:update(this.state.import_template, {
                is_open:{$set:false}
            })
        }, ()=>{
            setTimeout(() => {
                this.setState({
                    import_template:{
                        is_open:false,
                        data:[],
                        province_id:"",
                        regency_id:""
                    }
                })
            }, 150);
        })
    }


    //RENDER
    render(){
        const {sebaran_opt, provinsi_form, regency_form, import_template, download_template}=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Sebaran OPT</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                            <Dropdown align="end">
                                <Dropdown.Toggle variant="light" className="btn-icon-text ms-1">
                                    <FiMoreVertical className="btn-icon-prepend"/>
                                    Tools
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item 
                                        href="#/download-template-excel" 
                                        onClick={e=>{
                                            e.preventDefault()
                                            this.toggleModalDownloadTemplate(true)
                                        }}
                                    >
                                        Download Template Excel
                                    </Dropdown.Item>
                                    <label className="w-100">
                                        <Dropdown.Item className="d-block w-100 cursor-pointer" as="span">
                                            Import dari Template
                                        </Dropdown.Item>
                                        <input
                                            type="file"
                                            name="file"
                                            onChange={e=>{
                                                this.generateImportedExcel(e.target.files[0])
                                            }}
                                            style={{display:"none"}}
                                            accept=".xlsx"
                                        />
                                    </label>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <Table 
                                        data={sebaran_opt} 
                                        provinsi_form={provinsi_form}
                                        regency_form={regency_form}
                                        setPerPage={this.setPerPage}
                                        goToPage={this.goToPage}
                                        typeFilter={this.typeFilter}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>

                <ModalImportTemplate
                    data={import_template}
                    provinsi_form={provinsi_form}
                    onHide={this.hideModalImportTemplate}
                    importTemplate={this.updateCurahHujanMultiple}
                    request={this.request}
                />

                <ModalDownloadTemplate
                    data={download_template}
                    downloadTemplate={this.downloadTemplate}
                    onHide={this.toggleModalDownloadTemplate}
                />
            </>
        )
    }
}

const Table=({data, provinsi_form, regency_form, setPerPage, goToPage, typeFilter})=>{

    const data_komoditas=[
        {label:"Semua Komoditas", value:""},
        {label:"Aneka Cabai", value:"Aneka Cabai"},
        {label:"Bawang Merah", value:"Bawang Merah"}
    ]
    const data_tahun=[
        {label:"Semua Tahun", value:""},
        {label:"2020", value:"2020"},
        {label:"2021", value:"2021"},
        {label:"2022", value:"2022"}
    ]
    const data_bulan=()=>{
        return [{label:"Semua Bulan", value:""}].concat(Array.from({length:12}, (_, i)=>{
            return {
                label:i+1,
                value:i+1
            }
        }))
    }
    const data_provinsi=()=>{
        let prov=provinsi_form

        return [{label:"Semua Provinsi", value:""}].concat(prov.map(p=>{
            return {
                label:p.region,
                value:p.id_region
            }
        }))
    }
    const data_kab_kota=()=>{
        if(data.province_id==""){
            return [{label:"Semua Kabupaten/Kota", value:""}]
        }

        return [{label:"Semua Kabupaten/Kota", value:""}].concat(regency_form.map(p=>{
            return {
                label:p.region,
                value:p.id_region
            }
        }))
    }
    

    return (
        <>
            <div className="card mb-4">
                <div className="card-body p-4">
                    <div className="d-none d-md-flex mb-3 mt-3">
                        <div style={{width:"200px"}} className="me-2">
                            <Select
                                options={data_provinsi()}
                                value={data_provinsi().find(f=>f.value==data.province_id)}
                                onChange={e=>{
                                    typeFilter({target:{name:"province_id", value:e.value}})
                                }}
                                placeholder="Semua Provinsi"
                            />
                        </div>
                        <div style={{width:"200px"}} className="me-2">
                            <Select
                                options={data_kab_kota()}
                                value={data_kab_kota().find(f=>f.value==data.regency_id)}
                                onChange={e=>{
                                    typeFilter({target:{name:"regency_id", value:e.value}})
                                }}
                                placeholder="Semua Kabupaten/Kota"
                            />
                        </div>
                        <div style={{width:"200px"}} className="me-2">
                            <Select
                                options={data_komoditas}
                                value={data_komoditas.find(f=>f.value==data.komoditas)}
                                onChange={e=>{
                                    typeFilter({target:{name:"komoditas", value:e.value}})
                                }}
                                placeholder="Semua Komoditas"
                            />
                        </div>
                        <div style={{width:"170px"}} className="me-2">
                            <CreatableSelect
                                options={data_tahun}
                                onChange={e=>{
                                    typeFilter({target:{name:"tahun", value:e.value}})
                                }}
                                value={data_tahun.find(f=>f.value==data.tahun)}
                                placeholder="Pilih Tahun"
                            />
                        </div>
                        <div style={{width:"170px"}} className="me-2">
                            <Select
                                options={data_bulan()}
                                value={data_bulan().find(f=>f.value==data.bulan)}
                                onChange={e=>{
                                    typeFilter({target:{name:"bulan", value:e.value}})
                                }}
                                placeholder="Semua Bulan"
                            />
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover table-hover table-custom table-wrap mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th className="" width="50">#</th>
                                    <th className="">Provinsi</th>
                                    <th className="">Kabupaten/Kota</th>
                                    <th className="">Bulan</th>
                                    <th className="">Tahun</th>
                                    <th className="">Periode</th>
                                    <th className="">Kategori</th>
                                    <th className="">Komoditas</th>
                                    <th className="">Jenis Varietas</th>
                                    <th className="">Satuan</th>
                                    <th className="">Jenis OPT</th>
                                    <th className="">LTS (Ringan)</th>
                                    <th className="">LTS (Sedang)</th>
                                    <th className="">LTS (Berat)</th>
                                    <th className="">LTS (Puso)</th>
                                    <th className="">LKS (Ringan)</th>
                                    <th className="">LKS (Sedang)</th>
                                    <th className="">LKS (Berat)</th>
                                    <th className="">LKS (Puso)</th>
                                    <th className="">LP (Pemusnahan)</th>
                                    <th className="">LP (Pestisida Kimia)</th>
                                    <th className="">LP (Cara Lain)</th>
                                    <th className="">LP (Agens Hayati)</th>
                                    <th className="">SUM LTS</th>
                                    <th className="">SUM LKS</th>
                                    <th className="">SUM LP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!data.is_loading?
                                    <>
                                        {data.data.map((list, idx)=>(
                                            <tr key={list}>
                                                <td className="align-middle">{(idx+1)+((data.page-1)*data.per_page)}</td>
                                                <td>{list.region.parent.region}</td>
                                                <td>{list.region.region}</td>
                                                <td>{list.bulan}</td>
                                                <td>{list.tahun}</td>
                                                <td>{list.periode}</td>
                                                <td>{list.kategori}</td>
                                                <td>{list.komoditas}</td>
                                                <td>{list.jenis_varietas}</td>
                                                <td>{list.satuan}</td>
                                                <td>{list.opt}</td>
                                                <td>{list.lts_ringan}</td>
                                                <td>{list.lts_sedang}</td>
                                                <td>{list.lts_berat}</td>
                                                <td>{list.lts_puso}</td>
                                                <td>{list.lks_ringan}</td>
                                                <td>{list.lks_sedang}</td>
                                                <td>{list.lks_berat}</td>
                                                <td>{list.lks_puso}</td>
                                                <td>{list.lp_pemusnahan}</td>
                                                <td>{list.lp_pestisida_kimia}</td>
                                                <td>{list.lp_cara_lain}</td>
                                                <td>{list.lp_agens_hayati}</td>
                                                <td>{list.sum_lts}</td>
                                                <td>{list.sum_lks}</td>
                                                <td>{list.sum_lp}</td>
                                            </tr>
                                        ))}
                                        {data.data.length==0&&
                                            <tr>
                                                <td colSpan={26} className="text-center">Data tidak ditemukan!</td>
                                            </tr>
                                        }
                                    </>
                                :
                                    <tr>
                                        <td colSpan={26} className="text-center">
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
                                }
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center mt-4">
                        <div className="d-flex flex-column">
                            <div>Halaman {data.page} dari {data.last_page}</div>
                        </div>
                        <div className="d-flex align-items-center me-auto ms-3">
                            <select className="form-select" name="per_page" value={data.per_page} onChange={e=>setPerPage(e)}>
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
                </div>
            </div>
        </>
    )
}

//DOWNLOAD TEMPLATE
const ModalDownloadTemplate=({data, downloadTemplate, onHide})=>{
    const [pulau_form, setPulauForm]=useState([])
    const [provinsi_form, setProvinsiForm]=useState([])

    useEffect(()=>{
        if(data.is_open){
            fetchPulauForm()
            setProvinsiForm([])
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
    
    //options
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
                    jml_data:10
                }}
                onSubmit={downloadTemplate}
                validationSchema={
                    yup.object().shape({
                        pulau:yup.string().optional(),
                        province_id:yup.string().optional(),
                        jml_data:yup.number().required()
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
                                <label className="my-1 me-2">Data per Kabupaten/Kota</label>
                                <NumberFormat
                                    className="form-control"
                                    thousandSeparator
                                    value={formik.values.jml_data}
                                    onValueChange={values=>{
                                        const {value}=values
                                        formik.setFieldValue("jml_data", value)
                                    }}
                                    allowNegative={false}
                                />
                                <span className="form-text">
                                    <ol className="mt-4">
                                        <li>Nilai Bulan antara 1-12</li>
                                        <li>Jenis Komoditas : Aneka Cabai, Bawang Merah (Case Sensitif)</li>
                                        <li>Nilai LTS, LKS, LP Berupa Angka</li>
                                        <li>jangan menambahkan data baris baru/mengedit kolom regency_id di excel, setiap baris terdapat id untuk mengenali kabupaten/kota!</li>
                                        <li>jika anda ingin tetap menambah baris baru, copy baris di excel ini yang ingin anda tambahkan, pastikan regency_id sama dengan baris yang anda copy!</li>
                                        <li>hapus data baris kabupaten/kota yang tidak diperlukan!</li>
                                    </ol>
                                </span>
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
                                {formik.isSubmitting?
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2 btn-icon-prepend"
                                        />
                                        Mendownload...
                                    </>
                                :
                                    <>
                                        <FiDownload className="btn-icon-prepend"/>
                                        Download
                                    </>
                                }
                            </button>
                        </Modal.Footer>
                    </form>
                )}
            </Formik>
        </Modal>
    )
}

//IMPORT TEMPLATE
const ModalImportTemplate=({data, provinsi_form, onHide, importTemplate, request})=>{
    const [provinsi, setProvinsi]=useState([])
    const [regency, setRegency]=useState([])

    useEffect(()=>{
        if(data.is_open){
            setProvinsi(provinsi_form)
        }
        else{
            setRegency([])
            setProvinsi([])
        }
    }, [data.is_open])

    //values
    const provinsi_options=()=>{
        let data=provinsi.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Pilih Provinsi", value:""}].concat(data)

        return data
    }
    const regency_options=()=>{
        let data=regency.map(op=>{
            return {label:op.region, value:op.id_region}
        })
        data=[{label:"Pilih Kabupaten/Kota", value:""}].concat(data)

        return data
    }

    //fetch data
    const fetchRegencyForm=async(province_id)=>{

        if(province_id.toString().trim()==""){
            setRegency([])
            return false
        }

        await request.apiGetsRegencyForm(province_id)
        .then(data=>{
            setRegency(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }

    //grid
    const columns=[
        {
            key:'no',
            name:'No.',
            width: 30,
            frozen: true,
            formatter:({row})=>{
                return <span>{row.idx+1}</span>
            }
        },
        {
            key: 'pulau',
            name: 'Pulau',
            resizable: true,
            width: 120,
            formatter:({row})=>{
                return <span>{row.pulau}</span>
            }
        },
        {
            key: 'provinsi',
            name: 'Provinsi',
            resizable: true,
            width: 150,
            formatter:({row})=>{
                return <span>{row.provinsi}</span>
            }
        },
        {
            key: 'kabupaten_kota',
            name: 'Kabupaten/Kota',
            resizable: true,
            width: 180,
            formatter:({row})=>{
                return <span>{row.kabupaten_kota}</span>
            }
        },
        {
            key: 'tahun',
            name: 'Tahun',
            width: 120,
            formatter:({row})=>{
                return <span>{row.tahun}</span>
            }
        },
        {
            key: 'bulan',
            name: 'Bulan',
            width: 120,
            formatter:({row})=>{
                return <span>{row.bulan}</span>
            }
        },
        {
            key: 'periode',
            name: 'Periode',
            width: 120,
            formatter:({row})=>{
                return <span>{row.periode}</span>
            }
        },
        {
            key: 'kategori',
            name: 'Kategori',
            width: 120,
            formatter:({row})=>{
                return <span>{row.kategori}</span>
            }
        },
        {
            key: 'komoditas',
            name: 'Komoditas',
            width: 180,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.komoditas}</span>
            }
        },
        {
            key: 'jenis_varietas',
            name: 'Jenis Varietas',
            width: 180,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.jenis_varietas}</span>
            }
        },
        {
            key: 'satuan',
            name: 'Satuan',
            width: 180,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.satuan}</span>
            }
        },
        {
            key: 'opt',
            name: 'Opt',
            width: 230,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.opt}</span>
            }
        },
        {
            key: 'lts_ringan',
            name: 'lts_ringan',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lts_ringan}</span>
            }
        },
        {
            key: 'lts_sedang',
            name: 'lts_sedang',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lts_sedang}</span>
            }
        },
        {
            key: 'lts_berat',
            name: 'lts_berat',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lts_berat}</span>
            }
        },
        {
            key: 'lts_puso',
            name: 'lts_puso',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lts_puso}</span>
            }
        },
        {
            key: 'lks_ringan',
            name: 'lks_ringan',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lks_ringan}</span>
            }
        },
        {
            key: 'lks_sedang',
            name: 'lks_sedang',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lks_sedang}</span>
            }
        },
        {
            key: 'lks_berat',
            name: 'lks_berat',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lks_berat}</span>
            }
        },
        {
            key: 'lks_puso',
            name: 'lks_puso',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lks_puso}</span>
            }
        },
        {
            key: 'lp_pemusnahan',
            name: 'lp_pemusnahan',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lp_pemusnahan}</span>
            }
        },
        {
            key: 'lp_pestisida_kimia',
            name: 'lp_pestisida_kimia',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lp_pestisida_kimia}</span>
            }
        },
        {
            key: 'lp_cara_lain',
            name: 'lp_cara_lain',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lp_cara_lain}</span>
            }
        },
        {
            key: 'lp_agens_hayati',
            name: 'lp_agens_hayati',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.lp_agens_hayati}</span>
            }
        },
        {
            key: 'sum_lts',
            name: 'sum_lts',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.sum_lts}</span>
            }
        },
        {
            key: 'sum_lks',
            name: 'sum_lks',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.sum_lks}</span>
            }
        },
        {
            key: 'sum_lp',
            name: 'sum_lp',
            width: 150,
            resizable: true,
            formatter:({row})=>{
                return <span>{row.sum_lp}</span>
            }
        },
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
            <Formik
                initialValues={data}
                onSubmit={importTemplate}
                validationSchema={
                    yup.object().shape({
                        data:yup.array().required()
                    })
                }
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Preview Import Excel (Sebaran OPT)</h4>
                        </Modal.Header>
                        <Modal.Body className="p-0">
                            <ol className="mb-4 mt-4">
                                <li>Nilai Bulan antara 1-12</li>
                                <li>Jenis Komoditas : Aneka Cabai, Bawang Merah (Case Sensitif)</li>
                                <li>Nilai LTS, LKS, LP Berupa Angka</li>
                                <li>jangan menambahkan data baris baru/mengedit kolom regency_id di excel, setiap baris terdapat id untuk mengenali kabupaten/kota!</li>
                                <li>jika anda ingin tetap menambah baris baru, copy baris di excel ini yang ingin anda tambahkan, pastikan regency_id sama dengan baris yang anda copy!</li>
                                <li>hapus data baris kabupaten/kota yang tidak diperlukan!</li>
                            </ol>
                            <DataGrid
                                rows={data.data}
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
                                type="submit" 
                                className="btn btn-primary btn-icon-text"
                                disabled={formik.isSubmitting}
                            >
                                <FiUpload className="btn-icon-prepend"/>
                                Import Excel
                            </button>
                        </Modal.Footer>
                    </form>
                )}
            </Formik>
        </Modal>
    )
}


export default withAuth(Page)