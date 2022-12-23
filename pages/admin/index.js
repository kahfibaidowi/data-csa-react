import React, { useContext } from "react"
import Layout from "../../component/layout"
import withAuth from "../../component/hoc/auth"
import { useTable, useBlockLayout, useResizeColumns } from 'react-table'
import useMouseDelta from "../../component/hook/size"
import useSize from "../../component/hook/size"
import { FixedSizeGrid, FixedSizeList } from "react-window"
import VirtualTable, { VirtualTableContext } from "../../component/ui/virtual_table"
import DataGrid from 'react-data-grid'


class Dashboard extends React.Component{

    //RENDER
    render(){
        return (
            <>
                <Layout>
                </Layout>
            </>
        )
    }
}

export default withAuth(Dashboard)