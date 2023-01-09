import React, { useState } from "react"
import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    defaults
} from 'chart.js';
defaults.font.family="Roboto"

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function LineChart(props){
    const [provinsi, setProvinsi]=useState("")

    const dataChart=()=>{
        if(provinsi.toString().trim()=="") return props.data
        else{
            return props.data.filter(f=>f.provinsi.id_region==provinsi)
        }
    }

    return (
        <div className="d-flex flex-column w-100">
            <div className="pb-4">
                <div style={{maxWidth:"200px"}}>
                    <select className="form-select" value={provinsi} onChange={e=>setProvinsi(e.target.value)}>
                        <option value="">Semua Provinsi</option>
                        {props.provinsi_form.map(prov=>(
                            <option value={prov.id_region}>{prov.region}</option>
                        ))}
                    </select>
                </div>
            </div>
            <Line
                data={{
                    labels:["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
                    datasets:dataChart().map(bj=>{
                        return {
                            label:bj.region,
                            data:bj.data,
                            borderWidth:1,
                            borderColor:bj.rgb,
                            backgroundColor:bj.rgb,
                            pointBorderWidth:3,
                            pointHoverBorderWidth:5
                        }
                    })
                }}
                options={{
                    scales:{
                        y:{
                            type:"category",
                            labels:props.labels
                        },
                        x:{
                            grid:{
                                display:false
                            }
                        }
                    },
                    plugins:{
                        legend:{
                            display:false
                        },
                    
                    },
                    interaction:{
                        intersect:false,
                        mode:"point"
                    }
                }}
            />
        </div>
    )
}