import React from "react"
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
    return (
        <Line
            data={{
                labels:["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
                datasets:props.data.map(bj=>{
                    return {
                        label:bj.region,
                        data:bj.data,
                        borderWidth:1,
                        borderColor:bj.rgb,
                        backgroundColor:bj.rgb
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
                    mode:"index"
                }
            }}
        />
    )
}