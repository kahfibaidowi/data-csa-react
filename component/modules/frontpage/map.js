import React, { useEffect, useRef, useState } from "react"
import { isUndefined, mapbox_access_token } from "../../../config/config"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import L from 'leaflet'


const Map=(props)=>{
    const [bulan, setBulan]=useState("")
    const [center, setCenter]=useState({
        latitude:-1.973,
        longitude:116.253,
        zoom:5
    })

    //helpers
    const month=[
        {label:1, value:'Januari'},
        {label:2, value:'Februari'},
        {label:3, value:'Maret'},
        {label:4, value:'April'},
        {label:5, value:'Mei'},
        {label:6, value:'Juni'},
        {label:7, value:'Juli'},
        {label:8, value:'Agustus'},
        {label:9, value:'September'},
        {label:10, value:'Oktober'},
        {label:11, value:'November'},
        {label:12, value:'Desember'},
    ]
    const mapStyle=feature=>{
        let color="#fefe00"
        if(bulan!=""){
            const curah_hujan=feature.properties.curah_hujan[bulan-1]

            color=blockColor(curah_hujan.curah_hujan, curah_hujan.curah_hujan_normal)
        }
        else{
            const curah_hujan=feature.properties.curah_hujan

            let ch=0, curah_hujan_normal=0
            for(var i=0; i<curah_hujan.length; i++){
                if(curah_hujan[i].curah_hujan.toString().trim()!=""){
                    ch+=Number(curah_hujan[i].curah_hujan)
                    curah_hujan_normal+=Number(curah_hujan[i].curah_hujan_normal)
                }
            }

            color=blockColor(ch, curah_hujan_normal)
        }

        return {
            stroke:true,
            color:"#FFF",
            weight:1,
            opacity:1,
            fillColor:color,
            fillOpacity:.7
        }
    }
    const curahHujan=feature=>{
        if(bulan!=""){
            const curah_hujan=feature.properties.curah_hujan[bulan-1]

            return {
                curah_hujan:curah_hujan.curah_hujan,
                curah_hujan_normal:curah_hujan.curah_hujan_normal
            }
        }
        else{
            const curah_hujan=feature.properties.curah_hujan

            let ch=0, curah_hujan_normal=0
            for(var i=0; i<curah_hujan.length; i++){
                if(curah_hujan[i].curah_hujan.toString().trim()!=""){
                    ch+=Number(curah_hujan[i].curah_hujan)
                    curah_hujan_normal+=Number(curah_hujan[i].curah_hujan_normal)
                }
            }

            return {
                curah_hujan:ch,
                curah_hujan_normal:curah_hujan_normal
            }
        }
    }
    const blockColor=(curah_hujan, normal)=>{
        if(curah_hujan.toString().trim()==""||normal.toString().trim()==""){
            return "#fefe00"
        }
        if(Number(normal)==0){
            return "#fefe00"
        }

        const value=curah_hujan/normal;
        if(value<=0.3){
            return "#4a1400";
        }
        if(value<=0.5){
            return "#a65900";
        }
        if(value<=0.84){
            return "#f3c40f";
        }
        if(value<=1.15){
            return "#fefe00"
        }
        if(value<=1.5){
            return "#89b700"
        }
        if(value<=2){
            return "#238129"
        }
        if(value>200){
            return "#00460e"
        }
    }
    const sifatHujan=(curah_hujan, normal)=>{
        if(curah_hujan.toString().trim()==""||normal.toString().trim()==""){
            return ""
        }
        if(Number(normal)==0){
            return "?"
        }

        const value=curah_hujan/normal;
        if(value<=0.3){
            return "<div class='d-flex'><div class='d-flex mx-1' style='width:25px;height:15px;background:#4a1400'></div> (0 - 30%) Bawah Normal</div>";
        }
        if(value<=0.5){
            return "<div class='d-flex'><div class='d-flex mx-1' style='width:25px;height:15px;background:#a65900'></div> (31 - 50%) Bawah Normal</div>";
        }
        if(value<=0.84){
            return "<div class='d-flex'><div class='d-flex mx-1' style='width:25px;height:15px;background:#f3c40f'></div> (51 - 84%) Bawah Normal</div>";
        }
        if(value<=1.15){
            return "<div class='d-flex'><div class='d-flex mx-1' style='width:25px;height:15px;background:#fefe00'></div> (85 - 115%) Normal</div>";
        }
        if(value<=1.5){
            return "<div class='d-flex'><div class='d-flex mx-1' style='width:25px;height:15px;background:#89b700'></div> (116 - 150%) Atas Normal</div>";
        }
        if(value<=2){
            return "<div class='d-flex'><div class='d-flex mx-1' style='width:25px;height:15px;background:#238129'></div> (151 - 200%) Atas Normal</div>";
        }
        if(value>200){
            return "<div class='d-flex'><div class='d-flex mx-1' style='width:25px;height:15px;background:#00460e'></div> (> 200%) Atas Normal</div>";
        }
    }

    return (
        <>
            <div className="pb-4">
                <div style={{maxWidth:"200px"}}>
                    <select className="form-select" value={bulan} onChange={e=>setBulan(e.target.value)}>
                        <option value="">Rata-rata per tahun</option>
                        {month.map(month=>(
                            <option value={month.label}>{month.value}</option>
                        ))}
                    </select>
                </div>
            </div>

            <MapContainer 
                center={[center.latitude, center.longitude]} 
                zoom={center.zoom} 
                scrollWheelZoom={false}
                className={!isUndefined(props.className)?props.className:"map-responsive"}
                maxBounds={[
                    [-15.528, 87.798],
                    [9.911, 145.932]
                ]}
            >
                <ChangeView 
                    center={[center.latitude, center.longitude]} 
                    zoom={center.zoom}
                />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    
                />
                <GeoJSON 
                    key={Date.now()} 
                    data={props.data} 
                    style={mapStyle}
                    onEachFeature={(feature, layer)=>{
                        const curah_hujan=curahHujan(feature)

                        let popupContent=`
                            <div class='d-flex flex-column'>
                                <span>Kabupaten/Kota : <strong>${feature.properties.region}</strong></span>
                                <span>Curah Hujan : <strong>${curah_hujan.curah_hujan}</strong></span>
                                <span>Curah Hujan Normal : <strong>${curah_hujan.curah_hujan_normal}</strong></span>
                                <span class='d-flex'>Sifat : <strong>${sifatHujan(curah_hujan.curah_hujan, curah_hujan.curah_hujan_normal)}</strong></span>
                            </div>
                        `
                        layer.bindPopup(popupContent)
                    }}
                />
                <Legend/>
            </MapContainer>
        </>
    )
}

function ChangeView({center, zoom}){
    const map=useMap()
    map.setView(center, zoom)
    return null
}

function Legend(props){
    const map=useMap()

    useEffect(()=>{
        if(map){
            const legend=L.control({position:"bottomleft"})
    
            legend.onAdd=()=>{
                const div=L.DomUtil.create("div", "info legend")
                div.innerHTML=
                    "<div class='d-flex flex-column bg-white p-3'>"+
                    "<h4 style='font-weight:600;font-size:0.875rem'>SIFAT HUJAN</h4>"+
                    "<table class='mt-3'>"+
                    "<tr><td><div class='d-flex'><div class='d-flex me-1' style='width:25px;height:15px;background:#4a1400'></div> (0 - 30%)</div></td><th rowspan='3'> <span class='ms-2'>Bawah Normal</span></th></tr>"+
                    "<tr><td><div class='d-flex'><div class='d-flex me-1' style='width:25px;height:15px;background:#a65900'></div> (31 - 50%)</div></td></tr>"+
                    "<tr><td><div class='d-flex'><div class='d-flex me-1' style='width:25px;height:15px;background:#f3c40f'></div> (51 - 84%)</div></td></tr>"+
                    "<tr style='border-top:1px solid #9a9a9a'><td class='pt-1'><div class='d-flex'><div class='d-flex me-1' style='width:25px;height:15px;background:#fefe00'></div> (85 - 115%)</div></td><th> <span class='ms-2'>Normal</span></th></tr>"+
                    "<tr style='border-top:1px solid #9a9a9a'><td class='pt-1'><div class='d-flex'><div class='d-flex me-1' style='width:25px;height:15px;background:#89b700'></div> (116 - 150%)</div></td><th rowspan='3'> <span class='ms-2'>Atas Normal</span></th></tr>"+
                    "<tr><td><div class='d-flex'><div class='d-flex me-1' style='width:25px;height:15px;background:#238129'></div> (151 - 200%)</div></td></tr>"+
                    "<tr><td><div class='d-flex'><div class='d-flex me-1' style='width:25px;height:15px;background:#00460e'></div> (> 200%)</div></td></tr>"+
                    "</div>"+
                    "</table>"

                return div
            }
    
            legend.addTo(map)
        }
    }, [map])

    return null
  }

// const Maps=(props)=>{
//     const [center, setCenter]=useState({
//         latitude:-2.809,
//         longitude:117.865,
//         zoom:4
//     })

//     const mapContainer=useRef(null)
//     const map=useRef(null)

//     useEffect(()=>{
//         if(map.current) return
//         map.current=new mapboxgl.Map({
//             accessToken:mapbox_access_token,
//             container:mapContainer.current,
//             style:'mapbox://styles/mapbox/streets-v12',
//             center:[center.longitude, center.latitude],
//             zoom:center.zoom,
//             minZoom:4,
//             maxZoom:15,
//             projection:"naturalEarth",
//             maxBounds:[
//                 [87.798, -15.528],
//                 [145.932, 9.911]
//             ]
//         })
//         map.current.addControl(new mapboxgl.NavigationControl())
//         map.current.on("load", ()=>{
//             console.log("yes")
//             map.current.addSource('kabupaten_kota_indonesia', {
//                 type:"geojson",
//                 data:"/kabkota.geojson"
//             })
//             map.current.addLayer({
//                 'id': 'kabupaten_kota_indonesia-layer',
//                 'type': 'fill',
//                 'source': 'kabupaten_kota_indonesia',
//                 'paint': {
//                     'fill-opacity':.75,
//                     'fill-color':[
//                         'match',
//                         ['get', 'KAB_KOTA'],
//                         "MADIUN",
//                         "#9A9A9A",
//                         "#FFFFFF"
//                     ]
//                 }
//             })

//             map.current.on("click", "kabupaten_kota_indonesia-layer", e=>{
//                 alert(JSON.stringify(e.features[0].properties))
//             })
//             map.current.on("mouseenter", "kabupaten_kota_indonesia-layer", ()=>{
//                 map.current.getCanvas().style.cursor="pointer"
//             })
//             map.current.on("mouseleave", "kabupaten_kota_indonesia-layer", ()=>{
//                 map.current.getCanvas().style.cursor=""
//             })
//         })
//     }, [])


//     return (
//         <div ref={mapContainer} className="map-responsive-full"></div>
//     )
// }

 
export default Map