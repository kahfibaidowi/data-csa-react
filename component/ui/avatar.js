import React from 'react'
import classNames from "classnames"
import { akronim, BASE_URL, isUndefined } from '../../config/config'

export default function Avatar({data, size="", quality=100}) {
    const get_avatar_url=(avatar_url)=>{
        let avatar
        if(isUndefined(avatar_url)) avatar=""
        else avatar=avatar_url

        return BASE_URL+"/storage/"+avatar
    }

    return (
        <>
            {!isUndefined(data)&&
                <>
                    {data.avatar_url==""?
                        <>{akronim(data.nama_lengkap)}</>
                    :
                        <img
                            src={get_avatar_url(data.avatar_url)}
                            width={size=="lg"?80:30}
                            height={size=="lg"?80:30}
                            quality={quality}
                        />
                    }
                </>
            }
        </>
    )
}
