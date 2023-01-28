import { checkIsManualRevalidate } from 'next/dist/server/api-utils'
import React, { useState } from 'react'
import DataGrid from 'react-data-grid'

export const Test=()=>{
    const [data, setData]=useState([
        {
            id:1,
            nama:"kahfi baidowi",
            children:[
                {
                    id:1.1,
                    nama:"khafi0502@gmail.com",
                    children:[
                        {
                            id:1.11,
                            nama:"-> khafi0502@gmail.com"
                        },
                        {
                            id:1.12,
                            nama:"--> khafi0502@gmail.com"
                        }
                    ],
                    expanded:false
                },
                {
                    id:1.2,
                    nama:"kahfibaidowi@gmail.com"
                }
            ],
            expanded:false
        },
        {
            id:2,
            nama:"yana nur arikah",
            children:[
                {
                    id:2.1,
                    nama:"yana@gmail.com"
                }
            ],
            expanded:false
        }
    ])

    const columns=[
        {
            key:"toggle",
            name:"",
            width:50,
            frozen:true,
            formatter:({row})=>{
                return (
                    <button onClick={e=>toggleSubRow(row.id)}>lk</button>
                )
            }
        },
        {
            key:'id',
            name:'#',
            width: 50,
            frozen: true,
            formatter:({row})=>{
                return <span>{row.id}</span>
            }
        },
        {
            key:"nama",
            name:"Nama Lengkap/Email",
            width:250,
            frozen:true,
            formatter:({row})=>{
                return <span>{row.nama}</span>
            }
        }
    ]

    const toggleSubRow=(id)=>{
        const rowIdx=data.findIndex(r=>r.id==id)
        const row=data[rowIdx]

        if(!row.children) setData(data)

        const newRows=[...data]
        newRows[rowIdx]={...row, expanded:!row.expanded}

        if(!row.expanded){
            newRows.splice(rowIdx+1, 0, ...row.children)
        }
        else{
            newRows.splice(rowIdx+1, row.children.length)
        }

        setData(newRows)
    }

    const findd=()=>{
        const ss=data.filter(f=>f.expanded==true)
    }
    
    return (
        <div>
            <DataGrid
                rows={data}
                columns={columns}
                className="rdg-light fill-grid"
                rowHeight={25}
                headerRowHeight={40}
                style={{height:"500px"}}
                renderers
            />
            {findd()}
        </div>
    )
}

export default Test