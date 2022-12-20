import React from 'react'
import { useState, useRef } from 'react'
import { FixedSizeList } from 'react-window'

const VirtualTableContext=React.createContext({
    top: 0,
    setTop: (value) => {},
    header: <></>,
    footer: <></>,
    colRef:[],
    setColRef:(data)=>{}
})

export default function VirtualTable({row, Header, Inner, isLoading, dataLength, minWidth, ...rest}){
    const listRef=useRef()
    const [top, setTop]=useState(0)

    const [colRefs, setColRefs]=useState([])

    return (
        <VirtualTableContext.Provider value={{top, setTop, colRefs, setColRefs, isLoading, dataLength}}>
            <div style={{overflowX:"auto", display:"flex", flexWrap:"nowrap"}}>
                <div style={{display:"inline-block", minWidth}}>
                    <Header/>
                    <FixedSizeList
                        {...rest}
                        innerElementType={Inner}
                        onItemsRendered={props=>{
                            const style=listRef.current && listRef.current._getItemStyle(props.overscanStartIndex)
                            setTop((style && style.top) || 0)

                            rest.onItemsRendered && rest.onItemsRendered(props)
                        }}
                        ref={el=>(listRef.current=el)}
                    >
                        {row}
                    </FixedSizeList>
                </div>
            </div>
        </VirtualTableContext.Provider>
    )
}

export {VirtualTableContext}