import React from 'react'
import { api } from '../../config/api'
import { is_login, access_token, login_data} from '../../config/config'
import Router, { withRouter } from 'next/router'

export default function withAuth(WrappedComponent, data){
    class authHOC extends React.Component{
        state={
            show_page:false,
            login_data:{}
        }
        
        componentDidMount=()=>{
            if(is_login()){
                this.tokenVerify()
            }
            else{
                Router.push("/login")
            }
        }
        tokenVerify=()=>{
            api(access_token()).get("/auth/verify")
            .then(res=>{
                this.setState({
                    show_page:true,
                    login_data:login_data()
                })
            })
            .catch(err=>{
                if(err.response.status===401){
                    localStorage.removeItem("login_data")
                    Router.push("/login")
                }
            })
        }

        render(){
            return (
                <>
                    {this.state.show_page&&
                        <WrappedComponent login_data={this.state.login_data} {...this.props}/>
                    }
                </>
            )
        }
    }

    return withRouter(authHOC)
}