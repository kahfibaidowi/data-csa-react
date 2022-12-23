import React, { useState } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import { isUndefined } from "../../../config/config"


const Map=(props)=>{
    const [center, setCenter]=useState({
        latitude:-1.973,
        longitude:116.253,
        zoom:5
    })

    const mapStyle=feature=>{
        let color="#00f"
        // if(feature.properties.count_stunting<=49){
        //     color="#34eb83"
        // }
        // else if(feature.properties.count_stunting<=100){
        //     color="#d3eb34"
        // }
        // else if(feature.properties.count_stunting<=200){
        //     color="#ebab34"
        // }
        // else{
        //     color="#eb3434"
        // }

        return {
            stroke:true,
            color:"#FFF",
            weight:1,
            opacity:1,
            fillColor:color,
            fillOpacity:.7
        }
    }

    return (
        <MapContainer 
            center={[center.latitude, center.longitude]} 
            zoom={center.zoom} 
            scrollWheelZoom={false}
            className={!isUndefined(props.className)?props.className:"map-responsive"}
        >
            <ChangeView center={[center.latitude, center.longitude]} zoom={center.zoom} />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <GeoJSON 
                key={Date.now()} 
                data={props.data} 
                style={mapStyle}
                onEachFeature={(feature, layer)=>{
                    let popupContent=`
                        <div class='d-flex flex-column'>
                            <span>Curah Hujan : ${JSON.stringify(feature.properties)}</span>
                            <span>Curah Hujan Normal : <strong></strong></span>
                        </div>
                    `
                    layer.bindPopup(popupContent)
                }}
            />
        </MapContainer>
    )
}

function ChangeView({center, zoom}){
    const map=useMap()
    map.setView(center, zoom)
    return null
}
 
export default Map